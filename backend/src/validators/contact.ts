import { z } from "zod";

export const createContactSchema = z.object({
  contactUserId: z.string().cuid(),
});

export const updateContactSchema = z.object({
  status: z.enum(["PENDING", "ACCEPTED", "BLOCKED"]),
});

export const userSearchSchema = z.object({
  q: z.string().min(1).max(100),
  limit: z.coerce.number().int().min(1).max(50).optional().default(20),
});

export type CreateContactInput = z.infer<typeof createContactSchema>;
export type UpdateContactInput = z.infer<typeof updateContactSchema>;
export type UserSearchQuery = z.infer<typeof userSearchSchema>;
