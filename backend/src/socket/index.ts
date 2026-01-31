import { Server, Socket } from "socket.io";
import { PrismaClient } from "@prisma/client";
import { verifyAccessToken } from "../utils/jwt";
import { createMessageSchema } from "../validators/message";
import { getChatMemberOrThrow } from "../utils/chatMembership";

const prisma = new PrismaClient();

const CHAT_ROOM_PREFIX = "chat:";

function roomForChat(chatId: string) {
  return `${CHAT_ROOM_PREFIX}${chatId}`;
}

export function attachSocketHandlers(io: Server) {
  io.use((socket, next) => {
    const token =
      (socket.handshake.auth as { token?: string })?.token ||
      (socket.handshake.headers.authorization?.startsWith("Bearer ")
        ? socket.handshake.headers.authorization.slice(7)
        : undefined);

    if (!token) {
      return next(new Error("Authentication required"));
    }
    try {
      const payload = verifyAccessToken(token);
      (socket.data as { userId: string }).userId = payload.userId;
      next();
    } catch {
      next(new Error("Invalid or expired token"));
    }
  });

  io.on("connection", (socket: Socket) => {
    const userId = (socket.data as { userId: string }).userId;

    socket.on("join_chat", async (chatId: string) => {
      if (!chatId || typeof chatId !== "string") return;
      try {
        await getChatMemberOrThrow(chatId, userId);
        const room = roomForChat(chatId);
        await socket.join(room);
        socket.emit("joined_chat", { chatId });
      } catch {
        socket.emit("error", { message: "Not a member of this chat" });
      }
    });

    socket.on("leave_chat", async (chatId: string) => {
      if (!chatId || typeof chatId !== "string") return;
      const room = roomForChat(chatId);
      await socket.leave(room);
      socket.emit("left_chat", { chatId });
    });

    socket.on("send_message", async (payload: unknown) => {
      const data = payload as { chatId?: string; type?: string; content?: string; fileUrl?: string };
      const { chatId } = data ?? {};
      if (!chatId || typeof chatId !== "string") {
        socket.emit("error", { message: "chatId required" });
        return;
      }
      try {
        await getChatMemberOrThrow(chatId, userId);
      } catch {
        socket.emit("error", { message: "Not a member of this chat" });
        return;
      }

      const parsed = createMessageSchema.safeParse({
        type: data.type ?? "TEXT",
        content: data.content ?? null,
        fileUrl: data.fileUrl ?? null,
      });
      if (!parsed.success) {
        socket.emit("error", { message: "Invalid message payload" });
        return;
      }

      const message = await prisma.message.create({
        data: {
          chatId,
          senderId: userId,
          type: parsed.data.type as "TEXT" | "IMAGE" | "FILE" | "AUDIO" | "VIDEO",
          content: parsed.data.content ?? null,
          fileUrl: parsed.data.fileUrl ?? null,
        },
        include: {
          sender: {
            select: { id: true, username: true, avatarUrl: true },
          },
          reads: true,
        },
      });

      await prisma.chat.update({
        where: { id: chatId },
        data: { updatedAt: new Date() },
      });

      const room = roomForChat(chatId);
      io.to(room).emit("new_message", message);
      socket.to(room).emit("message_delivered", { messageId: message.id, chatId });
    });

    socket.on("typing_start", async (chatId: string) => {
      if (!chatId || typeof chatId !== "string") return;
      try {
        await getChatMemberOrThrow(chatId, userId);
        const room = roomForChat(chatId);
        socket.to(room).emit("user_typing", { chatId, userId });
      } catch {
        // ignore
      }
    });

    socket.on("typing_stop", async (chatId: string) => {
      if (!chatId || typeof chatId !== "string") return;
      const room = roomForChat(chatId);
      socket.to(room).emit("user_stopped_typing", { chatId, userId });
    });

    socket.on("mark_read", async (payload: unknown) => {
      const data = payload as { messageId?: string };
      const messageId = data?.messageId;
      if (!messageId || typeof messageId !== "string") {
        socket.emit("error", { message: "messageId required" });
        return;
      }
      const message = await prisma.message.findUnique({
        where: { id: messageId },
        select: { id: true, chatId: true },
      });
      if (!message) {
        socket.emit("error", { message: "Message not found" });
        return;
      }
      try {
        await getChatMemberOrThrow(message.chatId, userId);
      } catch {
        socket.emit("error", { message: "Not a member of this chat" });
        return;
      }

      await prisma.$transaction([
        prisma.messageRead.upsert({
          where: { messageId_userId: { messageId, userId } },
          create: { messageId, userId },
          update: {},
        }),
        prisma.chatMember.update({
          where: { chatId_userId: { chatId: message.chatId, userId } },
          data: { lastReadAt: new Date() },
        }),
      ]);

      const room = roomForChat(message.chatId);
      io.to(room).emit("message_read", {
        messageId,
        chatId: message.chatId,
        userId,
        readAt: new Date(),
      });
    });
  });
}
