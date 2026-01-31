import { z } from "zod";

export const createChatSchema = z.object({
  type: z.enum(["DIRECT", "GROUP"]),
  name: z.string().min(1).max(100).optional().nullable(),
  avatarUrl: z.string().url().optional().nullable(),
  memberIds: z.array(z.string().cuid()).min(1, "At least one member required"),
});

export const updateChatSchema = z.object({
  name: z.string().min(1).max(100).optional().nullable(),
  avatarUrl: z.string().url().optional().nullable(),
});

export const addMemberSchema = z.object({
  userId: z.string().cuid(),
  role: z.enum(["admin", "member"]).optional().default("member"),
});

export type CreateChatInput = z.infer<typeof createChatSchema>;
export type UpdateChatInput = z.infer<typeof updateChatSchema>;
export type AddMemberInput = z.infer<typeof addMemberSchema>;
