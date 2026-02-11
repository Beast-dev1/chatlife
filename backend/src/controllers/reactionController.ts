import { Response } from "express";
import { PrismaClient } from "@prisma/client";
import { Server as SocketServer } from "socket.io";
import { AuthRequest } from "../middleware/auth";
import { AppError } from "../middleware/errorHandler";
import { addReactionSchema, type AddReactionInput } from "../validators/reaction";
import { requireChatMember } from "../utils/chatMembership";

const prisma = new PrismaClient();

const CHAT_ROOM_PREFIX = "chat:";
function roomForChat(chatId: string) {
  return `${CHAT_ROOM_PREFIX}${chatId}`;
}

export async function addReaction(req: AuthRequest, res: Response) {
  if (!req.user) throw new AppError("Unauthorized", 401);
  const messageId = req.params.id;

  const message = await prisma.message.findUnique({
    where: { id: messageId },
    select: { id: true, chatId: true },
  });
  if (!message) throw new AppError("Message not found", 404);

  await requireChatMember(message.chatId, req.user.id);

  const parsed = addReactionSchema.safeParse(req.body);
  if (!parsed.success) throw parsed.error;

  const data: AddReactionInput = parsed.data;

  // Check if user already reacted with this emoji
  const existing = await prisma.messageReaction.findUnique({
    where: {
      messageId_userId_emoji: {
        messageId,
        userId: req.user.id,
        emoji: data.emoji,
      },
    },
  });

  if (existing) {
    return res.json(existing);
  }

  const reaction = await prisma.messageReaction.create({
    data: {
      messageId,
      userId: req.user.id,
      emoji: data.emoji,
    },
    include: {
      user: {
        select: { id: true, username: true, avatarUrl: true },
      },
    },
  });

  const io = req.app.get("io") as SocketServer | undefined;
  if (io) {
    io.to(roomForChat(message.chatId)).emit("reaction_added", {
      messageId,
      reaction,
    });
  }

  res.status(201).json(reaction);
}

export async function removeReaction(req: AuthRequest, res: Response) {
  if (!req.user) throw new AppError("Unauthorized", 401);
  const messageId = req.params.id;
  const emoji = req.params.emoji;

  const message = await prisma.message.findUnique({
    where: { id: messageId },
    select: { id: true, chatId: true },
  });
  if (!message) throw new AppError("Message not found", 404);

  await requireChatMember(message.chatId, req.user.id);

  const reaction = await prisma.messageReaction.findUnique({
    where: {
      messageId_userId_emoji: {
        messageId,
        userId: req.user.id,
        emoji,
      },
    },
  });

  if (!reaction) {
    throw new AppError("Reaction not found", 404);
  }

  await prisma.messageReaction.delete({
    where: { id: reaction.id },
  });

  const io = req.app.get("io") as SocketServer | undefined;
  if (io) {
    io.to(roomForChat(message.chatId)).emit("reaction_removed", {
      messageId,
      userId: req.user.id,
      emoji,
    });
  }

  res.status(204).send();
}
