import { z } from "zod";

export const addReactionSchema = z.object({
  emoji: z.string().min(1).max(10),
});

export type AddReactionInput = z.infer<typeof addReactionSchema>;
