// Cooperative "Tile Rush": a shared grid of emoji tiles and one target emoji.
// Anyone who joined can click tiles; matching the target scores a point for
// the whole room (not per-player) — the team wins by reaching the score
// target together before the shared clock runs out.
//
// This is intentionally framework-agnostic (no Next.js/socket.io imports) so
// it can be imported both by server.ts (which owns the actual game loop /
// timers) and by client components (which need `gameRoomKey` to filter
// broadcasts down to the conversation they're looking at).

export type GameMode = "dm" | "group";
export type GameStatus = "lobby" | "active" | "ended";

export type GameSession = {
  key: string;
  mode: GameMode;
  targetId: string;
  status: GameStatus;
  players: Record<string, string>; // userId -> display name
  grid: string[];
  target: string;
  score: number;
  winScore: number;
  endsAt: number | null;
  startedBy: string;
  result?: "won" | "timeout";
};

const EMOJIS = ["🍎", "🍋", "🍇", "🍉", "🍒", "🍑", "🥝", "🍍"];
export const GRID_SIZE = 16;
export const ROUND_MS = 45_000;
export const WIN_SCORE = 25;

const sessions = new Map<string, GameSession>();
const timers = new Map<string, ReturnType<typeof setTimeout>>();

/** Canonical key for a conversation's game session — for a DM this must be the
 *  same regardless of which of the two participants is asking, so it's keyed
 *  by the sorted pair of user ids rather than "the other person's id". */
export function gameRoomKey(selfId: string, mode: GameMode, targetId: string): string {
  if (mode === "group") return `group:${targetId}`;
  return `dm:${[selfId, targetId].sort().join(":")}`;
}

function randomEmoji(): string {
  return EMOJIS[Math.floor(Math.random() * EMOJIS.length)];
}

function randomGrid(): string[] {
  return Array.from({ length: GRID_SIZE }, randomEmoji);
}

/** Picks a target guaranteed to actually be somewhere on the grid — otherwise
 *  a round can randomly spawn with no matching tile anywhere and become
 *  permanently unwinnable. */
function pickTargetFromGrid(grid: string[]): string {
  return grid[Math.floor(Math.random() * grid.length)];
}

export function getSession(key: string): GameSession | null {
  return sessions.get(key) ?? null;
}

export function createLobby(
  key: string,
  mode: GameMode,
  targetId: string,
  startedBy: string,
  startedByName: string
): GameSession {
  const existingTimer = timers.get(key);
  if (existingTimer) {
    clearTimeout(existingTimer);
    timers.delete(key);
  }
  const grid = randomGrid();
  const session: GameSession = {
    key,
    mode,
    targetId,
    status: "lobby",
    players: { [startedBy]: startedByName },
    grid,
    target: pickTargetFromGrid(grid),
    score: 0,
    winScore: WIN_SCORE,
    endsAt: null,
    startedBy,
  };
  sessions.set(key, session);
  return session;
}

export function joinLobby(key: string, userId: string, name: string): GameSession | null {
  const s = sessions.get(key);
  if (!s || s.status !== "lobby") return null;
  s.players[userId] = name;
  return s;
}

export function beginRound(key: string, onEnd: (s: GameSession) => void): GameSession | null {
  const s = sessions.get(key);
  if (!s || s.status !== "lobby") return null;
  s.status = "active";
  s.endsAt = Date.now() + ROUND_MS;
  const timer = setTimeout(() => {
    const cur = sessions.get(key);
    if (cur && cur.status === "active") {
      cur.status = "ended";
      cur.result = "timeout";
      onEnd(cur);
    }
    timers.delete(key);
  }, ROUND_MS);
  timers.set(key, timer);
  return s;
}

export function clickTile(key: string, userId: string, index: number, onEnd: (s: GameSession) => void): GameSession | null {
  const s = sessions.get(key);
  if (!s || s.status !== "active") return null;
  if (!s.players[userId]) return null;
  if (index < 0 || index >= s.grid.length) return null;

  if (s.grid[index] === s.target) {
    s.score += 1;
    s.grid[index] = randomEmoji();
    s.target = pickTargetFromGrid(s.grid);
    if (s.score >= s.winScore) {
      s.status = "ended";
      s.result = "won";
      const t = timers.get(key);
      if (t) {
        clearTimeout(t);
        timers.delete(key);
      }
      onEnd(s);
    }
  }
  return s;
}
