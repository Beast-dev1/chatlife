import { Server, Socket } from "socket.io";
import { PrismaClient } from "@prisma/client";
import { verifyAccessToken } from "../utils/jwt";
import { createMessageSchema } from "../validators/message";
import { getChatMemberOrThrow } from "../utils/chatMembership";
import { getRedisClients } from "../config/redis";
import {
  userRoom,
  getRelevantUserIds,
  PRESENCE_ONLINE_KEY,
} from "../utils/presence";

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

    // Presence: join user room so we can emit to this user's sockets
    const userRoomId = userRoom(userId);
    void socket.join(userRoomId);

    // Set user online (Redis) and notify relevant users
    void (async () => {
      try {
        const { pubClient } = await getRedisClients();
        await pubClient.sAdd(PRESENCE_ONLINE_KEY, userId);
      } catch {
        // Redis not available, skip online set
      }
      try {
        const relevantIds = await getRelevantUserIds(userId);
        const payload = { userId };
        for (const id of relevantIds) {
          io.to(userRoom(id)).emit("user_online", payload);
        }
      } catch (err) {
        console.error("Presence getRelevantUserIds:", err);
      }
    })();

    socket.on("disconnect", async () => {
      try {
        const { pubClient } = await getRedisClients();
        await pubClient.sRem(PRESENCE_ONLINE_KEY, userId);
      } catch {
        // Redis not available
      }
      const lastSeen = new Date();
      try {
        await prisma.$executeRaw`
          UPDATE "User" SET last_seen = ${lastSeen} WHERE id = ${userId}
        `;
      } catch (err) {
        console.error("Presence update lastSeen:", err);
      }
      try {
        const relevantIds = await getRelevantUserIds(userId);
        const payload = { userId, lastSeen: lastSeen.toISOString() };
        for (const id of relevantIds) {
          io.to(userRoom(id)).emit("user_offline", payload);
        }
      } catch (err) {
        console.error("Presence disconnect getRelevantUserIds:", err);
      }
    });

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
      const data = payload as { chatId?: string; type?: string; content?: string; fileUrl?: string; replyToId?: string };
      const { chatId, replyToId } = data ?? {};
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
        replyToId: replyToId ?? null,
      });
      if (!parsed.success) {
        socket.emit("error", { message: "Invalid message payload" });
        return;
      }

      if (parsed.data.replyToId) {
        const replyToMsg = await prisma.message.findUnique({
          where: { id: parsed.data.replyToId },
          select: { id: true, chatId: true },
        });
        if (!replyToMsg || replyToMsg.chatId !== chatId) {
          socket.emit("error", { message: "Reply target message not found or in different chat" });
          return;
        }
      }

      const created = await prisma.message.create({
        data: {
          chat: { connect: { id: chatId } },
          sender: { connect: { id: userId } },
          type: parsed.data.type as "TEXT" | "IMAGE" | "FILE" | "AUDIO" | "VIDEO",
          content: parsed.data.content ?? null,
          fileUrl: parsed.data.fileUrl ?? null,
          ...(parsed.data.replyToId && { replyTo: { connect: { id: parsed.data.replyToId } } }),
        },
      });
      const message = await prisma.message.findUniqueOrThrow({
        where: { id: created.id },
        include: {
          sender: { select: { id: true, username: true, avatarUrl: true } },
          reads: true,
          replyTo: {
            select: {
              id: true,
              content: true,
              senderId: true,
              sender: { select: { id: true, username: true } },
            },
          },
        } as Parameters<typeof prisma.message.findUniqueOrThrow>[0]["include"],
      });

      await prisma.chat.update({
        where: { id: chatId },
        data: { updatedAt: new Date() },
      });

      const room = roomForChat(chatId);
      io.to(room).emit("new_message", message);
      // Emit to whole room (including sender) so sender can show "delivered"
      io.to(room).emit("message_delivered", { messageId: message.id, chatId });
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

    // --- Call signaling ---
    socket.on("call_initiate", async (payload: unknown) => {
      const data = payload as { chatId?: string; callType?: "video" | "audio" };
      const chatId = data?.chatId;
      const callType = data?.callType ?? "audio";
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
      const otherMembers = await prisma.chatMember.findMany({
        where: { chatId, userId: { not: userId } },
        take: 1,
        include: { user: { select: { id: true } } },
      });
      const calleeId = otherMembers[0]?.userId ?? null;
      if (!calleeId) {
        socket.emit("error", { message: "No other member to call in this chat" });
        return;
      }
      const caller = await prisma.user.findUnique({
        where: { id: userId },
        select: { id: true, username: true, avatarUrl: true },
      });
      if (!caller) return;
      const callLog = await prisma.callLog.create({
        data: {
          chatId,
          callerId: userId,
          calleeId,
          callType: callType === "video" ? "VIDEO" : "AUDIO",
          status: "INITIATED",
        },
      });
      const callTypePayload = callType === "video" ? "video" : "audio";
      io.to(userRoom(calleeId)).emit("incoming_call", {
        callId: callLog.id,
        chatId,
        callerId: userId,
        caller: { id: caller.id, username: caller.username, avatarUrl: caller.avatarUrl },
        callType: callTypePayload,
      });
      socket.emit("call_initiated", {
        callId: callLog.id,
        chatId,
        calleeId,
        callType: callTypePayload,
      });
    });

    socket.on("call_accept", async (payload: unknown) => {
      const data = payload as { callId?: string };
      const callId = data?.callId;
      if (!callId || typeof callId !== "string") {
        socket.emit("error", { message: "callId required" });
        return;
      }
      const call = await prisma.callLog.findUnique({
        where: { id: callId },
        select: { id: true, callerId: true, calleeId: true, status: true },
      });
      if (!call || call.calleeId !== userId) {
        socket.emit("error", { message: "Call not found or you are not the callee" });
        return;
      }
      if (call.status !== "INITIATED") {
        socket.emit("error", { message: "Call is no longer available" });
        return;
      }
      await prisma.callLog.update({
        where: { id: callId },
        data: { status: "ACCEPTED" },
      });
      io.to(userRoom(call.callerId)).emit("call_accepted", { callId, calleeId: userId });
    });

    socket.on("call_reject", async (payload: unknown) => {
      const data = payload as { callId?: string };
      const callId = data?.callId;
      if (!callId || typeof callId !== "string") {
        socket.emit("error", { message: "callId required" });
        return;
      }
      const call = await prisma.callLog.findUnique({
        where: { id: callId },
        select: { callerId: true, calleeId: true, status: true },
      });
      if (!call || call.calleeId !== userId) {
        socket.emit("error", { message: "Call not found or you are not the callee" });
        return;
      }
      if (call.status !== "INITIATED") return;
      const now = new Date();
      await prisma.callLog.update({
        where: { id: callId },
        data: { status: "REJECTED", endedAt: now },
      });
      io.to(userRoom(call.callerId)).emit("call_rejected", { callId });
    });

    socket.on("call_end", async (payload: unknown) => {
      const data = payload as { callId?: string };
      const callId = data?.callId;
      if (!callId || typeof callId !== "string") {
        socket.emit("error", { message: "callId required" });
        return;
      }
      const call = await prisma.callLog.findUnique({
        where: { id: callId },
        select: { callerId: true, calleeId: true, status: true, startedAt: true },
      });
      if (!call) {
        socket.emit("error", { message: "Call not found" });
        return;
      }
      const isCaller = call.callerId === userId;
      const isCallee = call.calleeId === userId;
      if (!isCaller && !isCallee) {
        socket.emit("error", { message: "You are not a participant in this call" });
        return;
      }
      const otherUserId = isCaller ? call.calleeId : call.callerId;
      const now = new Date();
      if (call.status === "ACCEPTED") {
        const duration = Math.floor((now.getTime() - call.startedAt.getTime()) / 1000);
        await prisma.callLog.update({
          where: { id: callId },
          data: { status: "ENDED", endedAt: now, duration },
        });
      } else if (call.status === "INITIATED") {
        await prisma.callLog.update({
          where: { id: callId },
          data: { status: "MISSED", endedAt: now },
        });
      } else {
        return;
      }
      if (otherUserId) {
        io.to(userRoom(otherUserId)).emit("call_ended", { callId });
      }
    });

    function isCallParticipant(call: { callerId: string; calleeId: string | null }, uid: string) {
      return call.callerId === uid || call.calleeId === uid;
    }
    function getOtherParticipant(call: { callerId: string; calleeId: string | null }, uid: string) {
      return call.callerId === uid ? call.calleeId : call.callerId;
    }

    socket.on("call_offer", async (payload: unknown) => {
      const data = payload as { callId?: string; targetUserId?: string; sdp?: unknown };
      const { callId, targetUserId, sdp } = data ?? {};
      if (!callId || !targetUserId || !sdp) {
        socket.emit("error", { message: "callId, targetUserId and sdp required" });
        return;
      }
      const call = await prisma.callLog.findUnique({
        where: { id: callId },
        select: { callerId: true, calleeId: true },
      });
      if (!call || !isCallParticipant(call, userId) || getOtherParticipant(call, userId) !== targetUserId) {
        socket.emit("error", { message: "Invalid call or target" });
        return;
      }
      io.to(userRoom(targetUserId)).emit("call_offer", { callId, fromUserId: userId, sdp });
    });

    socket.on("call_answer", async (payload: unknown) => {
      const data = payload as { callId?: string; targetUserId?: string; sdp?: unknown };
      const { callId, targetUserId, sdp } = data ?? {};
      if (!callId || !targetUserId || !sdp) {
        socket.emit("error", { message: "callId, targetUserId and sdp required" });
        return;
      }
      const call = await prisma.callLog.findUnique({
        where: { id: callId },
        select: { callerId: true, calleeId: true },
      });
      if (!call || !isCallParticipant(call, userId) || getOtherParticipant(call, userId) !== targetUserId) {
        socket.emit("error", { message: "Invalid call or target" });
        return;
      }
      io.to(userRoom(targetUserId)).emit("call_answer", { callId, fromUserId: userId, sdp });
    });

    socket.on("ice_candidate", async (payload: unknown) => {
      const data = payload as { callId?: string; targetUserId?: string; candidate?: unknown };
      const { callId, targetUserId, candidate } = data ?? {};
      if (!callId || !targetUserId) {
        socket.emit("error", { message: "callId and targetUserId required" });
        return;
      }
      const call = await prisma.callLog.findUnique({
        where: { id: callId },
        select: { callerId: true, calleeId: true },
      });
      if (!call || !isCallParticipant(call, userId) || getOtherParticipant(call, userId) !== targetUserId) {
        socket.emit("error", { message: "Invalid call or target" });
        return;
      }
      io.to(userRoom(targetUserId)).emit("ice_candidate", { callId, fromUserId: userId, candidate });
    });
  });
}
