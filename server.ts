import { createServer } from "node:http";
import next from "next";
import { Server as SocketIOServer } from "socket.io";
import { parse as parseCookie } from "cookie";

import { prisma } from "./src/lib/db";
import { SESSION_COOKIE, verifySessionToken } from "./src/lib/auth";
import { markSocketOnline, markSocketOffline, listOnlineUserIds } from "./src/lib/presence";
import { setIo } from "./src/lib/socketServer";

const dev = process.env.NODE_ENV !== "production";
const port = Number(process.env.PORT) || 3000;

const app = next({ dev });
const handle = app.getRequestHandler();

const MAX_MESSAGE_LENGTH = 2000;

app.prepare().then(() => {
  const httpServer = createServer((req, res) => handle(req, res));
  const io = new SocketIOServer(httpServer, {
    cors: { origin: false },
  });
  setIo(io);

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

    socket.on("chat:dm", async (payload: { toUserId?: string; content?: string }) => {
      try {
        const toUserId = payload?.toUserId;
        const content = (payload?.content ?? "").trim().slice(0, MAX_MESSAGE_LENGTH);
        if (!toUserId || !content) return;

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

        const message = await prisma.message.create({
          data: { senderId: userId, receiverId: toUserId, content },
        });

        io.to(`user:${toUserId}`).to(`user:${userId}`).emit("chat:message", message);
      } catch {
        socket.emit("chat:error", { message: "Failed to send message." });
      }
    });

    socket.on("chat:group", async (payload: { groupId?: string; content?: string }) => {
      try {
        const groupId = payload?.groupId;
        const content = (payload?.content ?? "").trim().slice(0, MAX_MESSAGE_LENGTH);
        if (!groupId || !content) return;

        const membership = await prisma.groupMember.findUnique({
          where: { userId_groupId: { userId, groupId } },
        });
        if (!membership) {
          socket.emit("chat:error", { message: "You're not in that group." });
          return;
        }

        const message = await prisma.message.create({
          data: { senderId: userId, groupId, content },
        });

        io.to(`group:${groupId}`).emit("chat:message", message);
      } catch {
        socket.emit("chat:error", { message: "Failed to send message." });
      }
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
