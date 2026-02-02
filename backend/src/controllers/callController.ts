import { Response } from "express";
import { PrismaClient } from "@prisma/client";
import { AuthRequest } from "../middleware/auth";
import { AppError } from "../middleware/errorHandler";
import {
  listCallsQuerySchema,
  createCallSchema,
  updateCallSchema,
  type CreateCallInput,
  type UpdateCallInput,
} from "../validators/call";
import { requireChatMember } from "../utils/chatMembership";

const prisma = new PrismaClient();

export async function getCallLogAndRequireParticipant(callId: string, userId: string) {
  const call = await prisma.callLog.findUnique({
    where: { id: callId },
    include: { chat: { select: { id: true } } },
  });
  if (!call) throw new AppError("Call not found", 404);
  const isCaller = call.callerId === userId;
  const isCallee = call.calleeId === userId;
  if (!isCaller && !isCallee) throw new AppError("You are not a participant in this call", 403);
  return call;
}

export async function getCall(req: AuthRequest, res: Response) {
  if (!req.user) throw new AppError("Unauthorized", 401);
  const callId = req.params.id;
  await getCallLogAndRequireParticipant(callId, req.user.id);
  const call = await prisma.callLog.findUnique({
    where: { id: callId },
    include: {
      chat: { select: { id: true, type: true, name: true } },
      caller: { select: { id: true, username: true, avatarUrl: true } },
      callee: { select: { id: true, username: true, avatarUrl: true } },
    },
  });
  if (!call) throw new AppError("Call not found", 404);
  res.json(call);
}

export async function listCalls(req: AuthRequest, res: Response) {
  if (!req.user) throw new AppError("Unauthorized", 401);
  const parsed = listCallsQuerySchema.safeParse(req.query);
  if (!parsed.success) throw parsed.error;
  const { chatId, cursor, limit } = parsed.data;

  const userId = req.user.id;
  const where = {
    ...(chatId ? { chatId } : {}),
    chat: {
      members: {
        some: { userId },
      },
    },
  };

  const callLogs = await prisma.callLog.findMany({
    where,
    take: limit + 1,
    ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    orderBy: { startedAt: "desc" },
    include: {
      chat: { select: { id: true, type: true, name: true } },
      caller: { select: { id: true, username: true, avatarUrl: true } },
      callee: { select: { id: true, username: true, avatarUrl: true } },
    },
  });

  const hasMore = callLogs.length > limit;
  const items = hasMore ? callLogs.slice(0, limit) : callLogs;
  const nextCursor = hasMore ? items[items.length - 1].id : null;

  res.json({
    calls: items,
    nextCursor,
    hasMore,
  });
}

export async function createCall(req: AuthRequest, res: Response) {
  if (!req.user) throw new AppError("Unauthorized", 401);
  const parsed = createCallSchema.safeParse(req.body);
  if (!parsed.success) throw parsed.error;
  const data: CreateCallInput = parsed.data;

  await requireChatMember(data.chatId, req.user.id);

  const otherMembers = await prisma.chatMember.findMany({
    where: { chatId: data.chatId, userId: { not: req.user.id } },
    take: 1,
    select: { userId: true },
  });
  const calleeId = otherMembers[0]?.userId ?? null;
  if (!calleeId) throw new AppError("No other member to call in this chat", 400);

  const callLog = await prisma.callLog.create({
    data: {
      chatId: data.chatId,
      callerId: req.user.id,
      calleeId,
      callType: data.callType === "video" ? "VIDEO" : "AUDIO",
      status: "INITIATED",
    },
    include: {
      chat: { select: { id: true } },
      caller: { select: { id: true, username: true, avatarUrl: true } },
      callee: { select: { id: true, username: true, avatarUrl: true } },
    },
  });

  res.status(201).json(callLog);
}

export async function updateCall(req: AuthRequest, res: Response) {
  if (!req.user) throw new AppError("Unauthorized", 401);
  const callId = req.params.id;
  await getCallLogAndRequireParticipant(callId, req.user.id);

  const parsed = updateCallSchema.safeParse(req.body);
  if (!parsed.success) throw parsed.error;
  const data: UpdateCallInput = parsed.data;

  const updateData: {
    status?: "ENDED" | "MISSED";
    endedAt?: Date;
    duration?: number;
  } = {};
  if (data.status) updateData.status = data.status;
  if (data.endedAt) updateData.endedAt = new Date(data.endedAt);
  if (data.duration !== undefined) updateData.duration = data.duration;

  if (data.status === "ENDED" && updateData.endedAt == null) {
    updateData.endedAt = new Date();
  }
  if (data.status === "ENDED" && updateData.duration == null) {
    const call = await prisma.callLog.findUnique({
      where: { id: callId },
      select: { startedAt: true },
    });
    if (call) {
      const endedAt = updateData.endedAt ?? new Date();
      updateData.duration = Math.floor((endedAt.getTime() - call.startedAt.getTime()) / 1000);
    }
  }

  if (Object.keys(updateData).length === 0) {
    const current = await prisma.callLog.findUnique({
      where: { id: callId },
      include: {
        chat: { select: { id: true } },
        caller: { select: { id: true, username: true, avatarUrl: true } },
        callee: { select: { id: true, username: true, avatarUrl: true } },
      },
    });
    return res.json(current);
  }

  const updated = await prisma.callLog.update({
    where: { id: callId },
    data: updateData,
    include: {
      chat: { select: { id: true } },
      caller: { select: { id: true, username: true, avatarUrl: true } },
      callee: { select: { id: true, username: true, avatarUrl: true } },
    },
  });

  res.json(updated);
}
