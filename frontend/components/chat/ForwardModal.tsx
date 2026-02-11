"use client";

import { useRef } from "react";
import Image from "next/image";
import { useChats } from "@/hooks/useChats";
import { useFocusTrap } from "@/hooks/useFocusTrap";
import { api } from "@/lib/api";
import type { ChatWithDetails } from "@/types/chat";
import type { MessageWithSender } from "@/types/chat";

function getChatTitle(chat: ChatWithDetails, currentUserId: string): string {
  if (chat.name) return chat.name;
  const other = chat.members?.find((m) => m.userId !== currentUserId);
  return other?.user?.username ?? "Chat";
}

export default function ForwardModal({
  message,
  currentChatId,
  currentUserId,
  onClose,
  onSent,
}: {
  message: MessageWithSender;
  currentChatId: string;
  currentUserId: string;
  onClose: () => void;
  onSent?: () => void;
}) {
  const { data: chats = [], isLoading } = useChats();
  const otherChats = chats.filter((c) => c.id !== currentChatId);

  const handleSelect = async (chatId: string) => {
    try {
      await api.post(`/api/chats/${chatId}/messages`, {
        type: message.type,
        content: message.content ?? null,
        fileUrl: message.fileUrl ?? null,
      });
      onSent?.();
      onClose();
    } catch {
      // error could be shown via toast
    }
  };

  const containerRef = useRef<HTMLDivElement>(null);
  useFocusTrap(containerRef, true, onClose);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={onClose}>
      <div
        ref={containerRef}
        role="dialog"
        aria-modal="true"
        aria-label="Forward to"
        className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-600 w-full max-w-md max-h-[80vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-4 py-3 border-b border-slate-200 flex items-center justify-between">
          <h2 className="font-semibold text-slate-800">Forward to</h2>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100"
            aria-label="Close"
          >
            ×
          </button>
        </div>
        <div className="overflow-y-auto flex-1 p-2">
          {isLoading ? (
            <p className="text-sm text-slate-500 py-4 text-center">Loading chats…</p>
          ) : otherChats.length === 0 ? (
            <p className="text-sm text-slate-500 py-4 text-center">No other chats</p>
          ) : (
            <ul className="space-y-0.5">
              {otherChats.map((chat) => {
                const title = getChatTitle(chat, currentUserId);
                const avatar = chat.avatarUrl ?? null;
                return (
                  <li key={chat.id}>
                    <button
                      type="button"
                      onClick={() => handleSelect(chat.id)}
                      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-slate-100 text-left"
                    >
                      <div className="w-10 h-10 rounded-full bg-slate-200 flex-shrink-0 overflow-hidden flex items-center justify-center">
                        {avatar ? (
                          <Image src={avatar} alt="" width={40} height={40} className="w-full h-full object-cover" unoptimized />
                        ) : (
                          <span className="text-sm font-semibold text-slate-500">{title.slice(0, 1).toUpperCase()}</span>
                        )}
                      </div>
                      <span className="font-medium text-slate-800 truncate">{title}</span>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
