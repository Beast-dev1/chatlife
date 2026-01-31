"use client";

import { create } from "zustand";
import type { ChatWithDetails, MessageWithSender } from "@/types/chat";

interface ChatState {
  chats: ChatWithDetails[];
  activeChatId: string | null;
  messagesByChat: Record<string, MessageWithSender[]>;
  /** Message IDs we've received message_delivered for (client-side delivery status) */
  deliveredMessageIds: Set<string>;
  rightSidebarOpen: boolean;
  setChats: (chats: ChatWithDetails[]) => void;
  setRightSidebarOpen: (open: boolean) => void;
  toggleRightSidebar: () => void;
  setActiveChatId: (id: string | null) => void;
  setMessages: (chatId: string, messages: MessageWithSender[]) => void;
  prependMessage: (chatId: string, message: MessageWithSender) => void;
  appendMessage: (chatId: string, message: MessageWithSender) => void;
  updateChatFromNewMessage: (message: MessageWithSender) => void;
  replaceTempMessage: (chatId: string, tempId: string, message: MessageWithSender) => void;
  setMessageDelivered: (messageId: string) => void;
  setMessageRead: (messageId: string, userId: string, readAt: string) => void;
  sendMessageOptimistic: (
    chatId: string,
    tempId: string,
    payload: { type: string; content?: string | null; fileUrl?: string | null },
    sender: { id: string; username: string; avatarUrl: string | null }
  ) => MessageWithSender;
  reset: () => void;
}

const initialState = {
  chats: [],
  activeChatId: null,
  messagesByChat: {},
  deliveredMessageIds: new Set<string>(),
  rightSidebarOpen: false,
};

export const useChatStore = create<ChatState>((set, get) => ({
  ...initialState,

  setChats: (chats) => set({ chats }),

  setActiveChatId: (id) => set({ activeChatId: id }),

  setRightSidebarOpen: (open) => set({ rightSidebarOpen: open }),
  toggleRightSidebar: () => set((s) => ({ rightSidebarOpen: !s.rightSidebarOpen })),

  setMessages: (chatId, messages) =>
    set((s) => ({
      messagesByChat: { ...s.messagesByChat, [chatId]: messages },
    })),

  prependMessage: (chatId, message) =>
    set((s) => {
      const list = s.messagesByChat[chatId] ?? [];
      if (list.some((m) => m.id === message.id)) return s;
      return {
        messagesByChat: {
          ...s.messagesByChat,
          [chatId]: [message, ...list],
        },
      };
    }),

  appendMessage: (chatId, message) =>
    set((s) => {
      const list = s.messagesByChat[chatId] ?? [];
      if (list.some((m) => m.id === message.id)) return s;
      return {
        messagesByChat: {
          ...s.messagesByChat,
          [chatId]: [...list, message],
        },
      };
    }),

  updateChatFromNewMessage: (message) =>
    set((s) => {
      const chatId = message.chatId;
      const chats = s.chats.map((c) => {
        if (c.id !== chatId) return c;
        const last = c.messages[0];
        const newLast = {
          id: message.id,
          chatId: message.chatId,
          senderId: message.senderId,
          type: message.type,
          content: message.content,
          fileUrl: message.fileUrl,
          createdAt: message.createdAt,
          updatedAt: message.updatedAt,
          sender: message.sender,
        };
        const messages = last?.id === message.id ? c.messages : [newLast];
        return { ...c, updatedAt: message.updatedAt, messages };
      });
      const byUpdated = [...chats].sort(
        (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
      );
      return { chats: byUpdated };
    }),

  replaceTempMessage: (chatId, tempId, message) =>
    set((s) => {
      const list = s.messagesByChat[chatId] ?? [];
      const next = list.map((m) =>
        (m as MessageWithSender & { tempId?: string }).tempId === tempId ? message : m
      );
      return {
        messagesByChat: { ...s.messagesByChat, [chatId]: next },
      };
    }),

  setMessageDelivered: (messageId) =>
    set((s) => {
      if (s.deliveredMessageIds.has(messageId)) return s;
      const next = new Set(s.deliveredMessageIds);
      next.add(messageId);
      return { deliveredMessageIds: next };
    }),

  setMessageRead: (messageId, userId, readAt) =>
    set((s) => {
      const chatId = Object.keys(s.messagesByChat).find((cid) =>
        (s.messagesByChat[cid] ?? []).some((m) => m.id === messageId)
      );
      if (!chatId) return s;
      const list = s.messagesByChat[chatId] ?? [];
      const updated = list.map((m) => {
        if (m.id !== messageId) return m;
        const hasRead = m.reads.some((r) => r.userId === userId);
        if (hasRead) return m;
        return {
          ...m,
          reads: [...m.reads, { id: `read-${userId}-${messageId}`, messageId, userId, readAt }],
        };
      });
      return {
        messagesByChat: { ...s.messagesByChat, [chatId]: updated },
      };
    }),

  sendMessageOptimistic: (chatId, tempId, payload, sender) => {
    const optimistic: MessageWithSender & { tempId?: string } = {
      id: tempId,
      chatId,
      senderId: sender.id,
      type: (payload.type as MessageWithSender["type"]) || "TEXT",
      content: payload.content ?? null,
      fileUrl: payload.fileUrl ?? null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      sender,
      reads: [],
      tempId,
    };
    set((s) => {
      const list = s.messagesByChat[chatId] ?? [];
      return {
        messagesByChat: {
          ...s.messagesByChat,
          [chatId]: [...list, optimistic],
        },
      };
    });
    return optimistic;
  },

  reset: () =>
    set({
      ...initialState,
      deliveredMessageIds: new Set<string>(),
    }),
}));
