import { PrismaClient } from "@prisma/client";
import { AppError } from "../middleware/errorHandler";

const prisma = new PrismaClient();

export async function getChatMemberOrThrow(chatId: string, userId: string) {
  const member = await prisma.chatMember.findUnique({
    where: { chatId_userId: { chatId, userId } },
  });
  if (!member) throw new AppError("You are not a member of this chat", 403);
  return member;
}

export async function requireChatMember(chatId: string, userId: string) {
  return getChatMemberOrThrow(chatId, userId);
}

export async function requireChatAdmin(chatId: string, userId: string) {
  const member = await getChatMemberOrThrow(chatId, userId);
  if (member.role !== "admin") throw new AppError("Only admins can perform this action", 403);
  return member;
}
