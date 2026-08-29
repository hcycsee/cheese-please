// Cooperative "Tile Rush": a shared grid of emoji tiles and one target emoji.
// Anyone who joined can click tiles; matching the target scores a point for
// the whole room (not per-player) — the team wins by reaching the score
// target together before the shared clock runs out.
import { type BaseSession, type GameMode, getSession as getBaseSession, setSession, setTimer, clearTimer } from "./shared";

export type TileRushSession = BaseSession & {
  type: "tilerush";
  grid: string[];
  target: string;
  score: number;
  winScore: number;
  endsAt: number | null;
  result?: "won" | "timeout";
};

const EMOJIS = ["🍎", "🍋", "🍇", "🍉", "🍒", "🍑", "🥝", "🍍"];
export const GRID_SIZE = 16;
export const ROUND_MS = 45_000;
export const WIN_SCORE = 25;

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

function asTileRush(s: BaseSession | null): TileRushSession | null {
  return s && s.type === "tilerush" ? (s as TileRushSession) : null;
}

export function getSession(key: string): TileRushSession | null {
  return asTileRush(getBaseSession(key));
}

export function createLobby(key: string, mode: GameMode, targetId: string, startedBy: string, startedByName: string): TileRushSession {
  clearTimer(key);
  const grid = randomGrid();
  const session: TileRushSession = {
    key,
    mode,
    targetId,
    type: "tilerush",
    status: "lobby",
    players: { [startedBy]: startedByName },
    playerOrder: [startedBy],
    startedBy,
    grid,
    target: pickTargetFromGrid(grid),
    score: 0,
    winScore: WIN_SCORE,
    endsAt: null,
  };
  setSession(key, session);
  return session;
}

export function joinLobby(key: string, userId: string, name: string): TileRushSession | null {
  const s = getSession(key);
  if (!s || s.status !== "lobby") return null;
  if (!s.players[userId]) {
    s.players[userId] = name;
    s.playerOrder.push(userId);
  }
  return s;
}

export function beginRound(key: string, onEnd: (s: TileRushSession) => void): TileRushSession | null {
  const s = getSession(key);
  if (!s || s.status !== "lobby") return null;
  s.status = "active";
  s.endsAt = Date.now() + ROUND_MS;
  setTimer(
    key,
    () => {
      const cur = getSession(key);
      if (cur && cur.status === "active") {
        cur.status = "ended";
        cur.result = "timeout";
        onEnd(cur);
      }
    },
    ROUND_MS
  );
  return s;
}

export function clickTile(key: string, userId: string, index: number, onEnd: (s: TileRushSession) => void): TileRushSession | null {
  const s = getSession(key);
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
      clearTimer(key);
      onEnd(s);
    }
  }
  return s;
}
