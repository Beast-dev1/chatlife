import { Response } from "express";
import { PrismaClient } from "@prisma/client";
import { AuthRequest } from "../middleware/auth";
import { AppError } from "../middleware/errorHandler";
import {
  createMessageSchema,
  updateMessageSchema,
  messagesQuerySchema,
  type CreateMessageInput,
  type UpdateMessageInput,
} from "../validators/message";
import { requireChatMember } from "../utils/chatMembership";

const prisma = new PrismaClient();

export async function listMessages(req: AuthRequest, res: Response) {
  if (!req.user) throw new AppError("Unauthorized", 401);
  const chatId = req.params.chatId;
  await requireChatMember(chatId, req.user.id);

  const parsed = messagesQuerySchema.safeParse(req.query);
  if (!parsed.success) throw parsed.error;

  const { cursor, limit } = parsed.data;

  const messages = await prisma.message.findMany({
    where: { chatId },
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

  const message = await prisma.message.create({
    data: {
      chatId,
      senderId: req.user.id,
      type: data.type,
      content: data.content ?? null,
      fileUrl: data.fileUrl ?? null,
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
    },
  });

  res.json(updated);
}

export async function deleteMessage(req: AuthRequest, res: Response) {
  if (!req.user) throw new AppError("Unauthorized", 401);
  const messageId = req.params.id;

  const message = await prisma.message.findUnique({
    where: { id: messageId },
  });
  if (!message) throw new AppError("Message not found", 404);
  if (message.senderId !== req.user.id) throw new AppError("You can only delete your own messages", 403);

  await prisma.message.delete({ where: { id: messageId } });
  res.status(204).send();
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
