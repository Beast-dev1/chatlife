"use client";

import { useQuery, useInfiniteQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { MessagesResponse, MessageWithSender } from "@/types/chat";

export function messagesQueryKey(chatId: string) {
  return ["messages", chatId];
}

export function useMessages(chatId: string | null) {
  const queryClient = useQueryClient();

  const infinite = useInfiniteQuery({
    queryKey: messagesQueryKey(chatId ?? ""),
    queryFn: async ({ pageParam }) => {
      const url = pageParam
        ? `/api/chats/${chatId}/messages?cursor=${pageParam}&limit=50`
        : `/api/chats/${chatId}/messages?limit=50`;
      return api.get<MessagesResponse>(url);
    },
    getNextPageParam: (last) => last.nextCursor,
    initialPageParam: undefined as string | undefined,
    enabled: !!chatId,
  });

  return infinite;
}

export function useMessagesList(chatId: string | null): MessageWithSender[] {
  const { data } = useMessages(chatId);
  const list: MessageWithSender[] = [];
  data?.pages?.forEach((p) => p.messages.forEach((m) => list.push(m)));
  return list.reverse();
}

export function invalidateMessages(queryClient: ReturnType<typeof useQueryClient>, chatId: string) {
  return queryClient.invalidateQueries({ queryKey: messagesQueryKey(chatId) });
}
