"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { MessageReaction } from "@/types/chat";

export function useAddReaction(messageId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (emoji: string) =>
      api.post<MessageReaction>(`/api/messages/${messageId}/reactions`, { emoji }),
    onSuccess: () => {
      // Reactions are handled by Socket.io real-time updates
      // but we can invalidate just in case
      queryClient.invalidateQueries({ queryKey: ["messages"] });
    },
  });
}

export function useRemoveReaction(messageId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (emoji: string) =>
      api.delete(`/api/messages/${messageId}/reactions/${encodeURIComponent(emoji)}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["messages"] });
    },
  });
}
