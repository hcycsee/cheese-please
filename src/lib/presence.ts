// In-memory presence tracker, shared between server.ts (Socket.IO) and Next.js
// route handlers. Next.js compiles route handlers through its own module
// system, separate from modules server.ts loads directly via tsx — so a plain
// module-scoped Map here would silently end up as two different Maps even
// though it's the same process. Stashing it on globalThis (same trick Prisma
// recommends for its client singleton) makes both sides see the same Map.
// This intentionally resets on server restart — fine for a hackathon MVP.

const globalForPresence = globalThis as unknown as { __presenceSockets?: Map<string, Set<string>> };
const userSockets = globalForPresence.__presenceSockets ?? new Map<string, Set<string>>();
globalForPresence.__presenceSockets = userSockets;

export function markSocketOnline(userId: string, socketId: string) {
  const set = userSockets.get(userId) ?? new Set<string>();
  set.add(socketId);
  userSockets.set(userId, set);
}

/** Returns true if that was the user's last open socket (i.e. they just went offline). */
export function markSocketOffline(userId: string, socketId: string): boolean {
  const set = userSockets.get(userId);
  if (!set) return false;
  set.delete(socketId);
  if (set.size === 0) {
    userSockets.delete(userId);
    return true;
  }
  return false;
}

export function isOnline(userId: string): boolean {
  return userSockets.has(userId);
}

export function listOnlineUserIds(): string[] {
  return Array.from(userSockets.keys());
}
