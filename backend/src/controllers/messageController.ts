import { Response } from "express";
import { PrismaClient } from "@prisma/client";
import { Server as SocketServer } from "socket.io";
import { AuthRequest } from "../middleware/auth";
import { AppError } from "../middleware/errorHandler";
import {
  createMessageSchema,
  updateMessageSchema,
  messagesQuerySchema,
  searchMessagesQuerySchema,
  type CreateMessageInput,
  type UpdateMessageInput,
} from "../validators/message";
import { requireChatMember } from "../utils/chatMembership";
import { userRoom } from "../utils/presence";

const CHAT_ROOM_PREFIX = "chat:";
function roomForChat(chatId: string) {
  return `${CHAT_ROOM_PREFIX}${chatId}`;
}

const prisma = new PrismaClient();

export async function listMessages(req: AuthRequest, res: Response) {
  if (!req.user) throw new AppError("Unauthorized", 401);
  const chatId = req.params.chatId;
  await requireChatMember(chatId, req.user.id);

  const parsed = messagesQuerySchema.safeParse(req.query);
  if (!parsed.success) throw parsed.error;

  const { cursor, limit } = parsed.data;

  const deletedForUser = await prisma.messageDeletion.findMany({
    where: { userId: req.user.id },
    select: { messageId: true },
  });
  const deletedMessageIds = deletedForUser.map((d) => d.messageId);

  const messages = await prisma.message.findMany({
    where: {
      chatId,
      ...(deletedMessageIds.length > 0 ? { id: { notIn: deletedMessageIds } } : {}),
    },
    take: limit + 1,
    ...(cursor
      ? { cursor: { id: cursor }, skip: 1 }
      : {}),
    orderBy: { createdAt: "desc" },
    include: {
      sender: {
        select: { id: true, username: true, avatarUrl: true },
      },
      reads: true,
      replyTo: {
        select: {
          id: true,
          content: true,
          senderId: true,
          sender: { select: { id: true, username: true } },
        },
      },
    },
  });

  const hasMore = messages.length > limit;
  const items = hasMore ? messages.slice(0, limit) : messages;
  const nextCursor = hasMore ? items[items.length - 1].id : null;

  res.json({
    messages: items,
    nextCursor,
    hasMore,
  });
}

export async function searchMessages(req: AuthRequest, res: Response) {
  if (!req.user) throw new AppError("Unauthorized", 401);

  const parsed = searchMessagesQuerySchema.safeParse(req.query);
  if (!parsed.success) throw parsed.error;

  const { q, chatId: filterChatId, cursor, limit } = parsed.data;

  const memberships = await prisma.chatMember.findMany({
    where: { userId: req.user.id },
    select: { chatId: true },
  });
  const allowedChatIds = memberships.map((m) => m.chatId);

  if (allowedChatIds.length === 0) {
    return res.json({ messages: [], nextCursor: null, hasMore: false });
  }

  const chatIds = filterChatId
    ? (await requireChatMember(filterChatId, req.user.id), [filterChatId])
    : allowedChatIds;

  const deletedForUser = await prisma.messageDeletion.findMany({
    where: { userId: req.user.id },
    select: { messageId: true },
  });
  const deletedMessageIds = deletedForUser.map((d) => d.messageId);

  const where = {
    chatId: { in: chatIds },
    content: { contains: q, mode: "insensitive" as const },
    ...(deletedMessageIds.length > 0 ? { id: { notIn: deletedMessageIds } } : {}),
  };

  const messages = await prisma.message.findMany({
    where,
    take: limit + 1,
    ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    orderBy: { createdAt: "desc" },
    include: {
      sender: {
        select: { id: true, username: true, avatarUrl: true },
      },
      reads: true,
      replyTo: {
        select: {
          id: true,
          content: true,
          senderId: true,
          sender: { select: { id: true, username: true } },
        },
      },
    },
  });

  const hasMore = messages.length > limit;
  const items = hasMore ? messages.slice(0, limit) : messages;
  const nextCursor = hasMore ? items[items.length - 1].id : null;

  res.json({
    messages: items,
    nextCursor,
    hasMore,
  });
}

export async function createMessage(req: AuthRequest, res: Response) {
  if (!req.user) throw new AppError("Unauthorized", 401);
  const chatId = req.params.chatId;
  await requireChatMember(chatId, req.user.id);

  const parsed = createMessageSchema.safeParse(req.body);
  if (!parsed.success) throw parsed.error;

  const data: CreateMessageInput = parsed.data;

  if (data.replyToId) {
    const replyToMsg = await prisma.message.findUnique({
      where: { id: data.replyToId },
      select: { id: true, chatId: true },
    });
    if (!replyToMsg || replyToMsg.chatId !== chatId) {
      throw new AppError("Reply target message not found or in different chat", 400);
    }
  }

  const message = await prisma.message.create({
    data: {
      chatId,
      senderId: req.user.id,
      type: data.type,
      content: data.content ?? null,
      fileUrl: data.fileUrl ?? null,
      ...(data.replyToId ? { replyTo: { connect: { id: data.replyToId } } } : {}),
    },
    include: {
      sender: {
        select: { id: true, username: true, avatarUrl: true },
      },
      reads: true,
      replyTo: {
        select: {
          id: true,
          content: true,
          senderId: true,
          sender: { select: { id: true, username: true } },
        },
      },
    },
  });

  await prisma.chat.update({
    where: { id: chatId },
    data: { updatedAt: new Date() },
  });

  res.status(201).json(message);
}

export async function updateMessage(req: AuthRequest, res: Response) {
  if (!req.user) throw new AppError("Unauthorized", 401);
  const messageId = req.params.id;

  const message = await prisma.message.findUnique({
    where: { id: messageId },
    include: { chat: true },
  });
  if (!message) throw new AppError("Message not found", 404);
  if (message.senderId !== req.user.id) throw new AppError("You can only edit your own messages", 403);

  const parsed = updateMessageSchema.safeParse(req.body);
  if (!parsed.success) throw parsed.error;

  const data: UpdateMessageInput = parsed.data;

  const updated = await prisma.message.update({
    where: { id: messageId },
    data: {
      ...(data.content !== undefined && { content: data.content }),
      ...(data.fileUrl !== undefined && { fileUrl: data.fileUrl }),
    },
    include: {
      sender: {
        select: { id: true, username: true, avatarUrl: true },
      },
      reads: true,
      replyTo: {
        select: {
          id: true,
          content: true,
          senderId: true,
          sender: { select: { id: true, username: true } },
        },
      },
    },
  });

  const io = req.app.get("io") as SocketServer | undefined;
  if (io) {
    io.to(roomForChat(message.chatId)).emit("message_updated", updated);
  }

  res.json(updated);
}

export async function deleteMessage(req: AuthRequest, res: Response) {
  if (!req.user) throw new AppError("Unauthorized", 401);
  const messageId = req.params.id;
  const scope = (req.query.scope as string) || "everyone";

  const message = await prisma.message.findUnique({
    where: { id: messageId },
  });
  if (!message) throw new AppError("Message not found", 404);

  await requireChatMember(message.chatId, req.user.id);

  const io = req.app.get("io") as SocketServer | undefined;

  if (scope === "me") {
    await prisma.messageDeletion.upsert({
      where: {
        userId_messageId: { userId: req.user.id, messageId },
      },
      create: { userId: req.user.id, messageId },
      update: {},
    });
    if (io) {
      io.to(userRoom(req.user.id)).emit("message_deleted_for_me", { messageId, chatId: message.chatId });
    }
    return res.status(204).send();
  }

  if (scope === "everyone") {
    if (message.senderId !== req.user.id) {
      throw new AppError("You can only delete your own messages for everyone", 403);
    }
    await prisma.message.delete({ where: { id: messageId } });
    if (io) {
      io.to(roomForChat(message.chatId)).emit("message_deleted", { messageId, chatId: message.chatId });
    }
    return res.status(204).send();
  }

  throw new AppError("Invalid scope. Use 'me' or 'everyone'", 400);
}

export async function markMessageRead(req: AuthRequest, res: Response) {
  if (!req.user) throw new AppError("Unauthorized", 401);
  const messageId = req.params.id;

  const message = await prisma.message.findUnique({
    where: { id: messageId },
    select: { id: true, chatId: true },
  });
  if (!message) throw new AppError("Message not found", 404);
  await requireChatMember(message.chatId, req.user.id);

  await prisma.$transaction([
    prisma.messageRead.upsert({
      where: {
        messageId_userId: { messageId, userId: req.user!.id },
      },
      create: { messageId, userId: req.user!.id },
      update: {},
    }),
    prisma.chatMember.update({
      where: {
        chatId_userId: { chatId: message.chatId, userId: req.user!.id },
      },
      data: { lastReadAt: new Date() },
    }),
  ]);

  res.json({ success: true });
}
