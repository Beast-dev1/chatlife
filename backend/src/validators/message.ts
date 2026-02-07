import { z } from "zod";

export const createMessageSchema = z.object({
  type: z.enum(["TEXT", "IMAGE", "FILE", "AUDIO", "VIDEO"]).optional().default("TEXT"),
  content: z.string().max(65535).optional().nullable(),
  fileUrl: z.string().url().optional().nullable(),
  replyToId: z.string().cuid().optional().nullable(),
}).refine((data) => data.content != null || data.fileUrl != null, {
  message: "Either content or fileUrl is required",
});

export const updateMessageSchema = z.object({
  content: z.string().max(65535).optional(),
  fileUrl: z.string().url().optional().nullable(),
});

export const messagesQuerySchema = z.object({
  cursor: z.string().cuid().optional(),
  limit: z.coerce.number().int().min(1).max(100).optional().default(50),
});

export const searchMessagesQuerySchema = z.object({
  q: z.string().min(1, "Search query is required"),
  chatId: z.string().cuid().optional(),
  cursor: z.string().cuid().optional(),
  limit: z.coerce.number().int().min(1).max(100).optional().default(50),
});

export type CreateMessageInput = z.infer<typeof createMessageSchema>;
export type UpdateMessageInput = z.infer<typeof updateMessageSchema>;
export type MessagesQuery = z.infer<typeof messagesQuerySchema>;
export type SearchMessagesQuery = z.infer<typeof searchMessagesQuerySchema>;
