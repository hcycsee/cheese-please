import type { Server as SocketIOServer } from "socket.io";

// Populated once by server.ts after it creates the Socket.IO server. Route
// handlers run through Next's own module system (separate from what server.ts
// loads directly via tsx), so this is stashed on globalThis rather than a
// plain module-scoped variable — otherwise route handlers would always see
// `io` as null even though the real server is running. See presence.ts for
// the same issue/fix.
const globalForIo = globalThis as unknown as { __socketIoInstance?: SocketIOServer };

export function setIo(instance: SocketIOServer) {
  globalForIo.__socketIoInstance = instance;
}

export function getIo(): SocketIOServer | null {
  return globalForIo.__socketIoInstance ?? null;
}
