"use client";

import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useSocket } from "@/hooks/useSocket";
import { useAuthStore } from "@/store/authStore";
import { useChatStore } from "@/store/chatStore";
import { chatsQueryKey } from "@/hooks/useChats";
import { messagesQueryKey } from "@/hooks/useMessages";
import type { MessageWithSender } from "@/types/chat";

export default function SocketSync() {
  const { socket, isConnected } = useSocket();
  const queryClient = useQueryClient();
  const userId = useAuthStore((s) => s.user?.id);
  const appendMessage = useChatStore((s) => s.appendMessage);
  const updateChatFromNewMessage = useChatStore((s) => s.updateChatFromNewMessage);
  const replaceTempMessage = useChatStore((s) => s.replaceTempMessage);

  useEffect(() => {
    if (!socket || !isConnected || !userId) return;

    const onNewMessage = (message: MessageWithSender) => {
      const chatId = message.chatId;
      const list = useChatStore.getState().messagesByChat[chatId] ?? [];
      const last = list[list.length - 1] as (MessageWithSender & { tempId?: string }) | undefined;
      const tempId = last?.tempId;
      const isOurOptimistic = tempId && last.senderId === userId;
      if (isOurOptimistic && tempId) {
        replaceTempMessage(chatId, tempId, message);
      } else {
        appendMessage(chatId, message);
      }
      updateChatFromNewMessage(message);
      queryClient.invalidateQueries({ queryKey: chatsQueryKey() });
      queryClient.invalidateQueries({ queryKey: messagesQueryKey(chatId) });
    };

    socket.on("new_message", onNewMessage);
    return () => {
      socket.off("new_message", onNewMessage);
    };
  }, [
    socket,
    isConnected,
    userId,
    appendMessage,
    updateChatFromNewMessage,
    replaceTempMessage,
    queryClient,
  ]);

  return null;
}
