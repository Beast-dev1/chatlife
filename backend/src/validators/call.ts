import { z } from "zod";

export const listCallsQuerySchema = z.object({
  chatId: z.string().cuid().optional(),
  cursor: z.string().cuid().optional(),
  limit: z.coerce.number().int().min(1).max(100).optional().default(50),
});

export const createCallSchema = z.object({
  chatId: z.string().cuid(),
  callType: z.enum(["audio", "video"]).optional().default("audio"),
});

export const updateCallSchema = z.object({
  status: z.enum(["ENDED", "MISSED"]).optional(),
  endedAt: z.string().datetime().optional(),
  duration: z.number().int().min(0).optional(),
});

export type ListCallsQuery = z.infer<typeof listCallsQuerySchema>;
export type CreateCallInput = z.infer<typeof createCallSchema>;
export type UpdateCallInput = z.infer<typeof updateCallSchema>;
