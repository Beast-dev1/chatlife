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

export function useUpdateChat(chatId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: { name?: string | null; avatarUrl?: string | null }) =>
      api.put<ChatWithDetails>(`/api/chats/${chatId}`, body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CHATS_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: ["chat", chatId] });
    },
  });
}

export function useAddMember(chatId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: { userId: string; role?: "admin" | "member" }) =>
      api.post<ChatWithDetails["members"][0]>(`/api/chats/${chatId}/members`, body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CHATS_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: ["chat", chatId] });
    },
  });
}

export function useRemoveMember(chatId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (userId: string) =>
      api.delete(`/api/chats/${chatId}/members/${userId}`),
    onSuccess: (_, userId) => {
      queryClient.invalidateQueries({ queryKey: CHATS_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: ["chat", chatId] });
    },
  });
}

export function useDeleteChat(chatId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => api.delete(`/api/chats/${chatId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CHATS_QUERY_KEY });
      queryClient.removeQueries({ queryKey: ["chat", chatId] });
    },
  });
}

export function chatsQueryKey() {
  return CHATS_QUERY_KEY;
}
