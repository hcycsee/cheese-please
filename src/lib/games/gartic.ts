// Gartic-Phone-style telephone game, group chats only (needs a real chain of
// people to be worth playing). Round 0: everyone privately writes a starting
// phrase for their own chain. Each following round, every player is handed
// someone else's chain and must continue it — drawing what the last text
// said, or writing what the last drawing looks like — alternating write/draw
// until every chain has passed through every player once. Then everyone sees
// every chain's full history at once.
import { type BaseSession, type GameMode, getSession as getBaseSession, setSession, setTimer, clearTimer } from "./shared";

export type GarticEntry = { kind: "text" | "drawing"; content: string; authorId: string; authorName: string };

export type GarticSession = BaseSession & {
  type: "gartic";
  round: number;
  totalRounds: number;
  chains: GarticEntry[][];
  submitted: string[]; // userIds who have submitted the current round
};

export const MIN_PLAYERS = 3;
export const ROUND_MS = 75_000;
const MAX_TEXT_LENGTH = 200;
const MAX_DRAWING_LENGTH = 2_000_000; // base64 PNG data URL

function asGartic(s: BaseSession | null): GarticSession | null {
  return s && s.type === "gartic" ? (s as GarticSession) : null;
}

export function getSession(key: string): GarticSession | null {
  return asGartic(getBaseSession(key));
}

export function createLobby(key: string, targetId: string, startedBy: string, startedByName: string): GarticSession {
  clearTimer(key);
  const session: GarticSession = {
    key,
    mode: "group" as GameMode,
    targetId,
    type: "gartic",
    status: "lobby",
    players: { [startedBy]: startedByName },
    playerOrder: [startedBy],
    startedBy,
    round: 0,
    totalRounds: 0,
    chains: [],
    submitted: [],
  };
  setSession(key, session);
  return session;
}

export function joinLobby(key: string, userId: string, name: string): GarticSession | null {
  const s = getSession(key);
  if (!s || s.status !== "lobby") return null;
  if (!s.players[userId]) {
    s.players[userId] = name;
    s.playerOrder.push(userId);
  }
  return s;
}

function chainForPlayerAtRound(playerIndex: number, round: number, n: number): number {
  return ((playerIndex - round) % n + n) % n;
}

export type MyTurn = { chain: number; promptType: "write" | "draw"; previous: GarticEntry | null };

export function myTurn(s: GarticSession, userId: string): MyTurn | null {
  if (s.status !== "active") return null;
  const idx = s.playerOrder.indexOf(userId);
  if (idx === -1) return null;
  const n = s.playerOrder.length;
  const chain = chainForPlayerAtRound(idx, s.round, n);
  const promptType: "write" | "draw" = s.round % 2 === 0 ? "write" : "draw";
  const previous = s.round === 0 ? null : s.chains[chain][s.round - 1] ?? null;
  return { chain, promptType, previous };
}

/** Strips chain contents unless the game has ended — chain history must stay
 *  hidden from room-wide broadcasts while a round is in progress, since each
 *  player's own turn is delivered to them privately instead. */
export function publicView(s: GarticSession): GarticSession {
  if (s.status === "ended") return s;
  return { ...s, chains: [] };
}

export function beginRound(key: string, notify: (s: GarticSession) => void): GarticSession | null {
  const s = getSession(key);
  if (!s || s.status !== "lobby") return null;
  if (s.playerOrder.length < MIN_PLAYERS) return null;
  s.status = "active";
  s.totalRounds = s.playerOrder.length;
  s.round = 0;
  s.chains = s.playerOrder.map(() => []);
  s.submitted = [];
  scheduleRoundTimeout(key, notify);
  notify(s);
  return s;
}

export function submitTurn(key: string, userId: string, content: string, notify: (s: GarticSession) => void): GarticSession | null {
  const s = getSession(key);
  if (!s || s.status !== "active") return null;
  if (s.submitted.includes(userId)) return null;
  const turn = myTurn(s, userId);
  if (!turn) return null;

  const maxLen = turn.promptType === "draw" ? MAX_DRAWING_LENGTH : MAX_TEXT_LENGTH;
  const cleaned = (content ?? "").slice(0, maxLen);
  if (!cleaned) return null;

  s.chains[turn.chain][s.round] = {
    kind: turn.promptType === "draw" ? "drawing" : "text",
    content: cleaned,
    authorId: userId,
    authorName: s.players[userId],
  };
  s.submitted.push(userId);

  if (s.submitted.length >= s.playerOrder.length) {
    advanceRound(key, notify);
  }
  return s;
}

function advanceRound(key: string, notify: (s: GarticSession) => void): void {
  const s = getSession(key);
  if (!s) return;
  clearTimer(key);
  s.round += 1;
  s.submitted = [];
  if (s.round >= s.totalRounds) {
    s.status = "ended";
  } else {
    scheduleRoundTimeout(key, notify);
  }
  notify(s);
}

function scheduleRoundTimeout(key: string, notify: (s: GarticSession) => void): void {
  setTimer(
    key,
    () => {
      const s = getSession(key);
      if (!s || s.status !== "active") return;
      for (const userId of s.playerOrder) {
        if (s.submitted.includes(userId)) continue;
        const turn = myTurn(s, userId);
        if (!turn) continue;
        s.chains[turn.chain][s.round] = {
          kind: turn.promptType === "draw" ? "drawing" : "text",
          content: turn.promptType === "draw" ? "" : "(no submission — time ran out)",
          authorId: userId,
          authorName: s.players[userId],
        };
        s.submitted.push(userId);
      }
      advanceRound(key, notify);
    },
    ROUND_MS
  );
}
