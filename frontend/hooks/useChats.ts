"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { ChatWithDetails } from "@/types/chat";

const CHATS_QUERY_KEY = ["chats"];

export function useChats() {
  return useQuery({
    queryKey: CHATS_QUERY_KEY,
    queryFn: () => api.get<ChatWithDetails[]>("/api/chats"),
  });
}

export function useCreateChat() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: { type: "DIRECT" | "GROUP"; name?: string | null; avatarUrl?: string | null; memberIds: string[] }) =>
      api.post<ChatWithDetails>("/api/chats", body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CHATS_QUERY_KEY });
    },
  });
}

export function useChat(chatId: string | null) {
  return useQuery({
    queryKey: ["chat", chatId],
    queryFn: () => api.get<ChatWithDetails>(`/api/chats/${chatId}`),
    enabled: !!chatId,
  });
}

export function chatsQueryKey() {
  return CHATS_QUERY_KEY;
}
