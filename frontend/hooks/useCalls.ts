"use client";

import { useInfiniteQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { CallsListResponse } from "@/types/call";

const CALLS_QUERY_KEY = ["calls"];

function buildCallsQueryKey(chatId: string | undefined) {
  return chatId ? [...CALLS_QUERY_KEY, chatId] : CALLS_QUERY_KEY;
}

export function useCalls(chatId?: string) {
  return useInfiniteQuery({
    queryKey: buildCallsQueryKey(chatId),
    queryFn: ({ pageParam }: { pageParam: string | undefined }) => {
      const params = new URLSearchParams();
      if (chatId) params.set("chatId", chatId);
      if (pageParam) params.set("cursor", pageParam);
      params.set("limit", "20");
      return api.get<CallsListResponse>(`/api/calls?${params.toString()}`);
    },
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
  });
}
