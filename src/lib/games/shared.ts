// Infrastructure shared by every game type: the room-key scheme, the
// in-memory session store, and a generic per-key timer registry. Kept
// framework-agnostic (no socket.io/Next imports) so it's importable from
// both server.ts and client components.

export type GameMode = "dm" | "group";
export type GameType = "tilerush" | "tictactoe" | "gartic";

export type BaseSession = {
  key: string;
  mode: GameMode;
  targetId: string;
  type: GameType;
  status: "lobby" | "active" | "ended";
  players: Record<string, string>; // userId -> display name
  playerOrder: string[]; // join order — used for turn/chain assignment
  startedBy: string;
};

/** Canonical key for a conversation's game session — for a DM this must be the
 *  same regardless of which of the two participants is asking, so it's keyed
 *  by the sorted pair of user ids rather than "the other person's id". */
export function gameRoomKey(selfId: string, mode: GameMode, targetId: string): string {
  if (mode === "group") return `group:${targetId}`;
  return `dm:${[selfId, targetId].sort().join(":")}`;
}

const sessions = new Map<string, BaseSession>();
const timers = new Map<string, ReturnType<typeof setTimeout>>();

export function getSession(key: string): BaseSession | null {
  return sessions.get(key) ?? null;
}

export function setSession(key: string, session: BaseSession): void {
  sessions.set(key, session);
}

export function clearSession(key: string): void {
  sessions.delete(key);
  clearTimer(key);
}

export function clearTimer(key: string): void {
  const t = timers.get(key);
  if (t) {
    clearTimeout(t);
    timers.delete(key);
  }
}

export function setTimer(key: string, fn: () => void, ms: number): void {
  clearTimer(key);
  timers.set(key, setTimeout(fn, ms));
}
