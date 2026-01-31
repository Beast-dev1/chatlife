"use client";

import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useSocket } from "@/hooks/useSocket";
import { useAuthStore } from "@/store/authStore";
import { useChatStore } from "@/store/chatStore";
import { usePresenceStore, scheduleTypingClear } from "@/store/presenceStore";
import { useSettingsStore } from "@/store/settingsStore";
import { chatsQueryKey } from "@/hooks/useChats";
import { messagesQueryKey } from "@/hooks/useMessages";
import type { MessageWithSender } from "@/types/chat";
import { showNewMessageToast } from "./chat/NewMessageToast";

export default function SocketSync() {
  const { socket, isConnected } = useSocket();
  const queryClient = useQueryClient();
  const userId = useAuthStore((s) => s.user?.id);
  const appendMessage = useChatStore((s) => s.appendMessage);
  const updateChatFromNewMessage = useChatStore((s) => s.updateChatFromNewMessage);
  const replaceTempMessage = useChatStore((s) => s.replaceTempMessage);
  const setMessageDelivered = useChatStore((s) => s.setMessageDelivered);
  const setMessageRead = useChatStore((s) => s.setMessageRead);
  const setUserOnline = usePresenceStore((s) => s.setUserOnline);
  const setUserOffline = usePresenceStore((s) => s.setUserOffline);
  const setUserTyping = usePresenceStore((s) => s.setUserTyping);
  const setUserStoppedTyping = usePresenceStore((s) => s.setUserStoppedTyping);
  const notificationsEnabled = useSettingsStore((s) => s.notificationsEnabled);
  const browserNotificationsEnabled = useSettingsStore((s) => s.browserNotificationsEnabled);
  const activeChatId = useChatStore((s) => s.activeChatId);

  useEffect(() => {
    if (!socket || !isConnected || !userId) return;

    const onUserOnline = (payload: { userId: string }) => {
      if (payload.userId && payload.userId !== userId) setUserOnline(payload.userId);
    };

    const onUserOffline = (payload: { userId: string; lastSeen: string }) => {
      if (payload.userId && payload.userId !== userId) {
        setUserOffline(payload.userId, payload.lastSeen ?? new Date().toISOString());
      }
    };

    const onUserTyping = (payload: { chatId: string; userId: string }) => {
      if (payload.chatId && payload.userId && payload.userId !== userId) {
        setUserTyping(payload.chatId, payload.userId);
        scheduleTypingClear(payload.chatId, payload.userId);
      }
    };

    const onUserStoppedTyping = (payload: { chatId: string; userId: string }) => {
      if (payload.chatId && payload.userId) setUserStoppedTyping(payload.chatId, payload.userId);
    };

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

      // Notifications: only for messages from others
      if (message.senderId !== userId) {
        const isBackground = typeof document !== "undefined" && document.hidden;
        if (isBackground && browserNotificationsEnabled && typeof Notification !== "undefined" && Notification.permission === "granted") {
          try {
            new Notification(`${message.sender.username}`, {
              body: message.type === "TEXT" ? (message.content ?? "Sent a message") : message.type === "IMAGE" ? "Sent a photo" : "Sent a file",
              icon: message.sender.avatarUrl ?? undefined,
            });
          } catch {
            // ignore
          }
        }
        if (notificationsEnabled && activeChatId !== chatId && typeof document !== "undefined" && !document.hidden) {
          showNewMessageToast({
            chatId,
            senderName: message.sender.username,
            preview: message.type === "TEXT" ? (message.content ?? "") : message.type === "IMAGE" ? "📷 Photo" : "📎 File",
          });
        }
      }
    };

    const onMessageDelivered = (payload: { messageId: string; chatId: string }) => {
      setMessageDelivered(payload.messageId);
    };

    const onMessageRead = (payload: {
      messageId: string;
      chatId: string;
      userId: string;
      readAt: string | number | Date;
    }) => {
      const readAt =
        typeof payload.readAt === "string"
          ? payload.readAt
          : payload.readAt instanceof Date
            ? payload.readAt.toISOString()
            : new Date(payload.readAt).toISOString();
      setMessageRead(payload.messageId, payload.userId, readAt);
    };

    socket.on("user_online", onUserOnline);
    socket.on("user_offline", onUserOffline);
    socket.on("user_typing", onUserTyping);
    socket.on("user_stopped_typing", onUserStoppedTyping);
    socket.on("new_message", onNewMessage);
    socket.on("message_delivered", onMessageDelivered);
    socket.on("message_read", onMessageRead);
    return () => {
      socket.off("user_online", onUserOnline);
      socket.off("user_offline", onUserOffline);
      socket.off("user_typing", onUserTyping);
      socket.off("user_stopped_typing", onUserStoppedTyping);
      socket.off("new_message", onNewMessage);
      socket.off("message_delivered", onMessageDelivered);
      socket.off("message_read", onMessageRead);
    };
  }, [
    socket,
    isConnected,
    userId,
    appendMessage,
    updateChatFromNewMessage,
    replaceTempMessage,
    setMessageDelivered,
    setMessageRead,
    setUserOnline,
    setUserOffline,
    setUserTyping,
    setUserStoppedTyping,
    notificationsEnabled,
    browserNotificationsEnabled,
    activeChatId,
    queryClient,
  ]);

  return null;
}
