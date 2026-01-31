"use client";

import { create } from "zustand";

const TYPING_TIMEOUT_MS = 5000;

interface PresenceState {
  /** User IDs currently online (from user_online / user_offline) */
  onlineUserIds: Set<string>;
  /** userId -> lastSeen ISO string (from user_offline) */
  userLastSeen: Record<string, string>;
  /** chatId -> Set of userIds currently typing */
  typingByChat: Record<string, Set<string>>;
  setUserOnline: (userId: string) => void;
  setUserOffline: (userId: string, lastSeen: string) => void;
  setUserTyping: (chatId: string, userId: string) => void;
  setUserStoppedTyping: (chatId: string, userId: string) => void;
  /** Clear typing for a user in a chat after timeout (called by timer) */
  clearTyping: (chatId: string, userId: string) => void;
  isOnline: (userId: string) => boolean;
  getLastSeen: (userId: string) => string | undefined;
  getTypingUserIds: (chatId: string) => string[];
}

export const usePresenceStore = create<PresenceState>((set, get) => ({
  onlineUserIds: new Set(),
  userLastSeen: {},
  typingByChat: {},

  setUserOnline: (userId) =>
    set((s) => {
      const next = new Set(s.onlineUserIds);
      next.add(userId);
      const { [userId]: _, ...rest } = s.userLastSeen;
      return { onlineUserIds: next, userLastSeen: rest };
    }),

  setUserOffline: (userId, lastSeen) =>
    set((s) => {
      const next = new Set(s.onlineUserIds);
      next.delete(userId);
      return {
        onlineUserIds: next,
        userLastSeen: { ...s.userLastSeen, [userId]: lastSeen },
      };
    }),

  setUserTyping: (chatId, userId) =>
    set((s) => {
      const chatSet = s.typingByChat[chatId] ?? new Set();
      if (chatSet.has(userId)) return s;
      const nextSet = new Set(chatSet);
      nextSet.add(userId);
      return {
        typingByChat: { ...s.typingByChat, [chatId]: nextSet },
      };
    }),

  setUserStoppedTyping: (chatId, userId) =>
    set((s) => {
      const chatSet = s.typingByChat[chatId];
      if (!chatSet || !chatSet.has(userId)) return s;
      const nextSet = new Set(chatSet);
      nextSet.delete(userId);
      const next = { ...s.typingByChat, [chatId]: nextSet };
      if (nextSet.size === 0) delete next[chatId];
      return { typingByChat: next };
    }),

  clearTyping: (chatId, userId) => get().setUserStoppedTyping(chatId, userId),

  isOnline: (userId) => get().onlineUserIds.has(userId),

  getLastSeen: (userId) => get().userLastSeen[userId],

  getTypingUserIds: (chatId) => Array.from(get().typingByChat[chatId] ?? []),
}));

/** Schedule clearing typing after TYPING_TIMEOUT_MS (so we don't show "typing" forever if event is missed) */
let typingTimeouts: Record<string, ReturnType<typeof setTimeout>> = {};

export function scheduleTypingClear(chatId: string, userId: string) {
  const key = `${chatId}:${userId}`;
  if (typingTimeouts[key]) clearTimeout(typingTimeouts[key]);
  typingTimeouts[key] = setTimeout(() => {
    usePresenceStore.getState().clearTyping(chatId, userId);
    delete typingTimeouts[key];
  }, TYPING_TIMEOUT_MS);
}
