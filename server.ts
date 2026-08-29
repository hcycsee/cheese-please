import { createServer } from "node:http";
import next from "next";
import { Server as SocketIOServer } from "socket.io";
import { parse as parseCookie } from "cookie";

import { prisma } from "./src/lib/db";
import { SESSION_COOKIE, verifySessionToken } from "./src/lib/auth";
import { markSocketOnline, markSocketOffline, listOnlineUserIds } from "./src/lib/presence";
import { setIo } from "./src/lib/socketServer";
import { displayName } from "./src/lib/format";
import { gameRoomKey, getSession as getBaseSession, type GameMode, type GameType, type BaseSession } from "./src/lib/games/shared";
import * as TileRush from "./src/lib/games/tileRush";
import * as TicTacToe from "./src/lib/games/tictactoe";
import * as Gartic from "./src/lib/games/gartic";
import { containsProfanity } from "./src/lib/profanity";

const dev = process.env.NODE_ENV !== "production";
const port = Number(process.env.PORT) || 3000;

const app = next({ dev });
const handle = app.getRequestHandler();

const MAX_MESSAGE_LENGTH = 2000;
const MAX_IMAGE_DATA_URL_LENGTH = 7_000_000; // ~5MB decoded

function normalizeImageUrl(imageUrl: unknown): string | null | undefined {
  if (imageUrl === undefined) return undefined;
  if (typeof imageUrl !== "string") return null;
  if (!/^data:image\/(png|jpeg|jpg|gif|webp);base64,/.test(imageUrl)) return null;
  if (imageUrl.length > MAX_IMAGE_DATA_URL_LENGTH) return null;
  return imageUrl;
}

function gameRooms(userId: string, mode: GameMode, targetId: string): string[] {
  return mode === "group" ? [`group:${targetId}`] : [`user:${userId}`, `user:${targetId}`];
}

async function canPlayIn(userId: string, mode: GameMode, targetId: string): Promise<boolean> {
  if (mode === "group") {
    const membership = await prisma.groupMember.findUnique({
      where: { userId_groupId: { userId, groupId: targetId } },
    });
    return !!membership;
  }
  const friendship = await prisma.friendship.findFirst({
    where: {
      status: "accepted",
      OR: [
        { requesterId: userId, addresseeId: targetId },
        { requesterId: targetId, addresseeId: userId },
      ],
    },
  });
  return !!friendship;
}

app.prepare().then(() => {
  const httpServer = createServer((req, res) => handle(req, res));
  const io = new SocketIOServer(httpServer, {
    cors: { origin: false },
  });
  setIo(io);

  function toPublicSession(s: BaseSession | null): BaseSession | null {
    if (s && s.type === "gartic") return Gartic.publicView(s as Gartic.GarticSession);
    return s;
  }

  function broadcastState(rooms: string[], key: string, session: BaseSession | null) {
    io.to(rooms).emit("game:state", { key, session: toPublicSession(session) });
  }

  function pushGarticTurns(session: Gartic.GarticSession) {
    if (session.status !== "active") return;
    for (const uid of session.playerOrder) {
      const turn = Gartic.myTurn(session, uid);
      if (turn) {
        io.to(`user:${uid}`).emit("game:garticTurn", {
          key: session.key,
          round: session.round,
          totalRounds: session.totalRounds,
          ...turn,
        });
      }
    }
  }

  function notifyGartic(rooms: string[], session: Gartic.GarticSession) {
    broadcastState(rooms, session.key, session);
    pushGarticTurns(session);
  }

  io.use(async (socket, next_) => {
    try {
      const cookieHeader = socket.handshake.headers.cookie;
      const token = cookieHeader ? parseCookie(cookieHeader)[SESSION_COOKIE] : undefined;
      const session = token ? await verifySessionToken(token) : null;
      if (!session) return next_(new Error("unauthorized"));
      socket.data.userId = session.userId;
      next_();
    } catch (err) {
      next_(new Error("unauthorized"));
    }
  });

  io.on("connection", async (socket) => {
    const userId: string = socket.data.userId;

    socket.join(`user:${userId}`);
    markSocketOnline(userId, socket.id);

    try {
      prisma.user.update({ where: { id: userId }, data: { lastSeenAt: new Date() } }).catch(() => {});

      const memberships = await prisma.groupMember.findMany({ where: { userId }, select: { groupId: true } });
      for (const m of memberships) socket.join(`group:${m.groupId}`);
    } catch {
      // non-fatal
    }

    socket.emit("presence:list", listOnlineUserIds());
    socket.broadcast.emit("presence:online", { userId });

    socket.on("chat:dm", async (payload: { toUserId?: string; content?: string; imageUrl?: string }) => {
      try {
        const toUserId = payload?.toUserId;
        const content = (payload?.content ?? "").trim().slice(0, MAX_MESSAGE_LENGTH);
        const imageUrl = normalizeImageUrl(payload?.imageUrl);
        if (!toUserId) return;
        if (payload?.imageUrl !== undefined && imageUrl === null) {
          socket.emit("chat:error", { message: "Image must be a PNG, JPEG, GIF, or WebP under 5MB." });
          return;
        }
        if (!content && !imageUrl) return;

        const friendship = await prisma.friendship.findFirst({
          where: {
            status: "accepted",
            OR: [
              { requesterId: userId, addresseeId: toUserId },
              { requesterId: toUserId, addresseeId: userId },
            ],
          },
        });
        if (!friendship) {
          socket.emit("chat:error", { message: "You can only message friends." });
          return;
        }
        if (content && containsProfanity(content)) {
          socket.emit("chat:error", { message: "Please keep messages appropriate." });
          return;
        }

        const message = await prisma.message.create({
          data: { senderId: userId, receiverId: toUserId, content, imageUrl: imageUrl || null },
          include: { sender: { select: { id: true, name: true, preferredName: true } } },
        });

        io.to(`user:${toUserId}`).to(`user:${userId}`).emit("chat:message", message);
      } catch {
        socket.emit("chat:error", { message: "Failed to send message." });
      }
    });

    socket.on("chat:group", async (payload: { groupId?: string; content?: string; imageUrl?: string }) => {
      try {
        const groupId = payload?.groupId;
        const content = (payload?.content ?? "").trim().slice(0, MAX_MESSAGE_LENGTH);
        const imageUrl = normalizeImageUrl(payload?.imageUrl);
        if (!groupId) return;
        if (payload?.imageUrl !== undefined && imageUrl === null) {
          socket.emit("chat:error", { message: "Image must be a PNG, JPEG, GIF, or WebP under 5MB." });
          return;
        }
        if (!content && !imageUrl) return;

        const membership = await prisma.groupMember.findUnique({
          where: { userId_groupId: { userId, groupId } },
        });
        if (!membership) {
          socket.emit("chat:error", { message: "You're not in that group." });
          return;
        }
        if (content && containsProfanity(content)) {
          socket.emit("chat:error", { message: "Please keep messages appropriate." });
          return;
        }

        const message = await prisma.message.create({
          data: { senderId: userId, groupId, content, imageUrl: imageUrl || null },
          include: { sender: { select: { id: true, name: true, preferredName: true } } },
        });

        io.to(`group:${groupId}`).emit("chat:message", message);
      } catch {
        socket.emit("chat:error", { message: "Failed to send message." });
      }
    });

    socket.on("game:sync", (payload: { mode?: GameMode; targetId?: string }) => {
      const { mode, targetId } = payload ?? {};
      if (!mode || !targetId) return;
      const key = gameRoomKey(userId, mode, targetId);
      const session = getBaseSession(key);
      socket.emit("game:state", { key, session: toPublicSession(session) });
      if (session && session.type === "gartic" && session.status === "active") {
        const garticSession = session as Gartic.GarticSession;
        const turn = Gartic.myTurn(garticSession, userId);
        if (turn) {
          socket.emit("game:garticTurn", {
            key,
            round: garticSession.round,
            totalRounds: garticSession.totalRounds,
            ...turn,
          });
        }
      }
    });

    socket.on("game:start", async (payload: { mode?: GameMode; targetId?: string; type?: GameType }) => {
      try {
        const { mode, targetId, type } = payload ?? {};
        if (!mode || !targetId || !type) return;
        if (type === "gartic" && mode !== "group") {
          socket.emit("game:error", { message: "Gartic Phone is only available in group chats." });
          return;
        }
        if (!(await canPlayIn(userId, mode, targetId))) {
          socket.emit("game:error", { message: "You can't start a game here." });
          return;
        }

        const key = gameRoomKey(userId, mode, targetId);
        const rooms = gameRooms(userId, mode, targetId);
        const existing = getBaseSession(key);
        if (existing && existing.status !== "ended") {
          broadcastState(rooms, key, existing);
          return;
        }

        const user = await prisma.user.findUnique({ where: { id: userId }, select: { name: true, preferredName: true } });
        const name = user ? displayName(user) : "Someone";

        const session: BaseSession =
          type === "tilerush"
            ? TileRush.createLobby(key, mode, targetId, userId, name)
            : type === "tictactoe"
              ? TicTacToe.createLobby(key, mode, targetId, userId, name)
              : Gartic.createLobby(key, targetId, userId, name);

        broadcastState(rooms, key, session);
      } catch {
        socket.emit("game:error", { message: "Failed to start a game." });
      }
    });

    socket.on("game:join", async (payload: { mode?: GameMode; targetId?: string }) => {
      try {
        const { mode, targetId } = payload ?? {};
        if (!mode || !targetId) return;
        if (!(await canPlayIn(userId, mode, targetId))) return;

        const key = gameRoomKey(userId, mode, targetId);
        const rooms = gameRooms(userId, mode, targetId);
        const existing = getBaseSession(key);
        if (!existing) return;

        const user = await prisma.user.findUnique({ where: { id: userId }, select: { name: true, preferredName: true } });
        const name = user ? displayName(user) : "Someone";

        const session: BaseSession | null =
          existing.type === "tilerush"
            ? TileRush.joinLobby(key, userId, name)
            : existing.type === "tictactoe"
              ? TicTacToe.joinLobby(key, userId, name)
              : Gartic.joinLobby(key, userId, name);

        if (session) broadcastState(rooms, key, session);
        else socket.emit("game:error", { message: "Couldn't join — the game may be full or already started." });
      } catch {
        socket.emit("game:error", { message: "Failed to join the game." });
      }
    });

    socket.on("game:begin", (payload: { mode?: GameMode; targetId?: string }) => {
      const { mode, targetId } = payload ?? {};
      if (!mode || !targetId) return;
      const key = gameRoomKey(userId, mode, targetId);
      const existing = getBaseSession(key);
      if (!existing || !existing.players[userId]) return;
      const rooms = gameRooms(userId, mode, targetId);

      if (existing.type === "tilerush") {
        const started = TileRush.beginRound(key, (ended) => broadcastState(rooms, key, ended));
        if (started) broadcastState(rooms, key, started);
      } else if (existing.type === "tictactoe") {
        const started = TicTacToe.beginRound(key);
        if (started) broadcastState(rooms, key, started);
        else socket.emit("game:error", { message: "Need a second player to start." });
      } else {
        const started = Gartic.beginRound(key, (s) => notifyGartic(rooms, s));
        if (!started) {
          socket.emit("game:error", { message: `Need at least ${Gartic.MIN_PLAYERS} players to start.` });
        }
        // on success, Gartic.beginRound already broadcasts + pushes turns via notifyGartic
      }
    });

    socket.on("game:tile", (payload: { mode?: GameMode; targetId?: string; index?: number }) => {
      const { mode, targetId, index } = payload ?? {};
      if (!mode || !targetId || typeof index !== "number") return;
      const key = gameRoomKey(userId, mode, targetId);
      const rooms = gameRooms(userId, mode, targetId);
      const session = TileRush.clickTile(key, userId, index, (ended) => broadcastState(rooms, key, ended));
      if (session) broadcastState(rooms, key, session);
    });

    socket.on("game:move", (payload: { mode?: GameMode; targetId?: string; index?: number }) => {
      const { mode, targetId, index } = payload ?? {};
      if (!mode || !targetId || typeof index !== "number") return;
      const key = gameRoomKey(userId, mode, targetId);
      const rooms = gameRooms(userId, mode, targetId);
      const session = TicTacToe.makeMove(key, userId, index);
      if (session) broadcastState(rooms, key, session);
    });

    socket.on("game:garticSubmit", (payload: { mode?: GameMode; targetId?: string; content?: string }) => {
      const { mode, targetId, content } = payload ?? {};
      if (mode !== "group" || !targetId || typeof content !== "string") return;
      const key = gameRoomKey(userId, mode, targetId);
      const rooms = gameRooms(userId, mode, targetId);

      const session = Gartic.getSession(key);
      const turn = session ? Gartic.myTurn(session, userId) : null;
      if (turn?.promptType === "write" && containsProfanity(content)) {
        socket.emit("game:error", { message: "Please keep submissions appropriate." });
        return;
      }

      Gartic.submitTurn(key, userId, content, (s) => notifyGartic(rooms, s));
    });

    socket.on("disconnect", async () => {
      const wentOffline = markSocketOffline(userId, socket.id);
      if (wentOffline) {
        try {
          await prisma.user.update({ where: { id: userId }, data: { lastSeenAt: new Date() } });
        } catch {
          // non-fatal
        }
        io.emit("presence:offline", { userId });
      }
    });
  });

  httpServer.listen(port, () => {
    console.log(`> unipixel ready on http://localhost:${port}`);
  });
});
