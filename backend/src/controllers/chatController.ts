import { Response } from "express";
import { PrismaClient } from "@prisma/client";
import { AuthRequest } from "../middleware/auth";
import { AppError } from "../middleware/errorHandler";
import {
  createChatSchema,
  updateChatSchema,
  addMemberSchema,
  type CreateChatInput,
  type UpdateChatInput,
  type AddMemberInput,
} from "../validators/chat";
import { requireChatMember, requireChatAdmin, getChatMemberOrThrow } from "../utils/chatMembership";

const prisma = new PrismaClient();

export async function listChats(req: AuthRequest, res: Response) {
  if (!req.user) throw new AppError("Unauthorized", 401);
  const userId = req.user.id;

  const chats = await prisma.chat.findMany({
    where: { members: { some: { userId } } },
    include: {
      members: {
        include: {
          user: {
            select: { id: true, username: true, avatarUrl: true, status: true },
          },
        },
      },
      messages: {
        take: 1,
        orderBy: { createdAt: "desc" },
        include: {
          sender: { select: { id: true, username: true } },
        },
      },
    },
    orderBy: { updatedAt: "desc" },
  });

  res.json(chats);
}

export async function createChat(req: AuthRequest, res: Response) {
  if (!req.user) throw new AppError("Unauthorized", 401);
  const parsed = createChatSchema.safeParse(req.body);
  if (!parsed.success) throw parsed.error;

  const { type, name, avatarUrl, memberIds }: CreateChatInput = parsed.data;
  const userId = req.user.id;

  const uniqueMemberIds = [...new Set([userId, ...memberIds])];
  if (type === "DIRECT" && uniqueMemberIds.length !== 2) {
    throw new AppError("Direct chat must have exactly two members", 400);
  }

  const usersExist = await prisma.user.findMany({
    where: { id: { in: uniqueMemberIds } },
    select: { id: true },
  });
  if (usersExist.length !== uniqueMemberIds.length) {
    throw new AppError("One or more user IDs are invalid", 400);
  }

  const chat = await prisma.chat.create({
    data: {
      type,
      name: type === "GROUP" ? name ?? undefined : null,
      avatarUrl: avatarUrl ?? undefined,
      members: {
        create: uniqueMemberIds.map((id, index) => ({
          userId: id,
          role: type === "GROUP" && index === 0 ? "admin" : "member",
        })),
      },
    },
    include: {
      members: {
        include: {
          user: {
            select: { id: true, username: true, avatarUrl: true, status: true },
          },
        },
      },
    },
  });

  res.status(201).json(chat);
}

export async function getChat(req: AuthRequest, res: Response) {
  if (!req.user) throw new AppError("Unauthorized", 401);
  const chatId = req.params.id;
  await requireChatMember(chatId, req.user.id);

  const chat = await prisma.chat.findUnique({
    where: { id: chatId },
    include: {
      members: {
        include: {
          user: {
            select: { id: true, username: true, avatarUrl: true, status: true },
          },
        },
      },
    },
  });
  if (!chat) throw new AppError("Chat not found", 404);

  res.json(chat);
}

export async function updateChat(req: AuthRequest, res: Response) {
  if (!req.user) throw new AppError("Unauthorized", 401);
  const chatId = req.params.id;
  await requireChatMember(chatId, req.user.id);

  const existing = await prisma.chat.findUnique({ where: { id: chatId }, select: { type: true } });
  if (!existing) throw new AppError("Chat not found", 404);
  if (existing.type === "GROUP") {
    await requireChatAdmin(chatId, req.user.id);
  }

  const parsed = updateChatSchema.safeParse(req.body);
  if (!parsed.success) throw parsed.error;

  const data: UpdateChatInput = parsed.data;
  const chat = await prisma.chat.update({
    where: { id: chatId },
    data: {
      ...(data.name !== undefined && { name: data.name }),
      ...(data.avatarUrl !== undefined && { avatarUrl: data.avatarUrl }),
    },
    include: {
      members: {
        include: {
          user: {
            select: { id: true, username: true, avatarUrl: true, status: true },
          },
        },
      },
    },
  });

  res.json(chat);
}

export async function deleteChat(req: AuthRequest, res: Response) {
  if (!req.user) throw new AppError("Unauthorized", 401);
  const chatId = req.params.id;
  const member = await requireChatMember(chatId, req.user.id);

  const chat = await prisma.chat.findUnique({ where: { id: chatId }, select: { type: true } });
  if (!chat) throw new AppError("Chat not found", 404);
  if (chat.type === "GROUP" && member.role !== "admin") {
    throw new AppError("Only admins can delete the chat", 403);
  }

  await prisma.chat.delete({ where: { id: chatId } });
  res.status(204).send();
}

export async function addMember(req: AuthRequest, res: Response) {
  if (!req.user) throw new AppError("Unauthorized", 401);
  const chatId = req.params.id;
  await requireChatAdmin(chatId, req.user.id);

  const parsed = addMemberSchema.safeParse(req.body);
  if (!parsed.success) throw parsed.error;

  const { userId: newUserId, role }: AddMemberInput = parsed.data;

  const chat = await prisma.chat.findUnique({ where: { id: chatId }, select: { type: true } });
  if (!chat) throw new AppError("Chat not found", 404);
  if (chat.type === "DIRECT") throw new AppError("Cannot add members to a direct chat", 400);

  const existing = await prisma.chatMember.findUnique({
    where: { chatId_userId: { chatId, userId: newUserId } },
  });
  if (existing) throw new AppError("User is already a member", 409);

  const userExists = await prisma.user.findUnique({ where: { id: newUserId }, select: { id: true } });
  if (!userExists) throw new AppError("User not found", 404);

  const member = await prisma.chatMember.create({
    data: { chatId, userId: newUserId, role },
    include: {
      user: { select: { id: true, username: true, avatarUrl: true, status: true } },
    },
  });

  res.status(201).json(member);
}

export async function removeMember(req: AuthRequest, res: Response) {
  if (!req.user) throw new AppError("Unauthorized", 401);
  const chatId = req.params.id;
  const targetUserId = req.params.userId;

  const chat = await prisma.chat.findUnique({ where: { id: chatId }, select: { type: true } });
  if (!chat) throw new AppError("Chat not found", 404);

  if (targetUserId === req.user.id) {
    await getChatMemberOrThrow(chatId, req.user.id);
    await prisma.chatMember.delete({
      where: { chatId_userId: { chatId, userId: targetUserId } },
    });
    return res.status(204).send();
  }

  await requireChatAdmin(chatId, req.user.id);
  await prisma.chatMember.delete({
    where: { chatId_userId: { chatId, userId: targetUserId } },
  });
  res.status(204).send();
}
