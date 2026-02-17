"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { MessageCircle } from "lucide-react";

export interface ToastMessage {
  id: string;
  chatId: string;
  senderName: string;
  preview: string;
}

const toasts: ToastMessage[] = [];
const listeners = new Set<(t: ToastMessage[]) => void>();

function notify() {
  listeners.forEach((fn) => fn([...toasts]));
}

export function showNewMessageToast(payload: { chatId: string; senderName: string; preview: string }) {
  const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2)}`;
  const entry: ToastMessage = { id, ...payload };
  toasts.push(entry);
  notify();
  setTimeout(() => {
    const i = toasts.findIndex((t) => t.id === id);
    if (i !== -1) {
      toasts.splice(i, 1);
      notify();
    }
  }, 4000);
}

export function useNewMessageToasts() {
  const [items, setItems] = useState<ToastMessage[]>([]);
  useEffect(() => {
    setItems([...toasts]);
    listeners.add(setItems);
    return () => {
      listeners.delete(setItems);
    };
  }, []);
  return items;
}

export default function NewMessageToastContainer() {
  const items = useNewMessageToasts();
  const router = useRouter();

  const goToChat = useCallback(
    (chatId: string) => {
      const i = toasts.findIndex((t) => t.chatId === chatId);
      if (i !== -1) toasts.splice(i, 1);
      notify();
      router.push(`/chat/${chatId}`);
    },
    [router]
  );

  if (items.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2 max-w-sm">
      {items.map((t) => (
        <button
          key={t.id}
          type="button"
          onClick={() => goToChat(t.chatId)}
          className="flex items-center gap-3 p-3 rounded-xl bg-popover shadow-overlay text-left hover:bg-muted/80 transition-colors duration-normal"
        >
          <div className="w-10 h-10 rounded-full bg-primary-500/20 flex items-center justify-center flex-shrink-0">
            <MessageCircle className="w-5 h-5 text-primary-500" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-body font-medium text-popover-foreground truncate">{t.senderName}</p>
            <p className="text-caption text-muted-foreground truncate">{t.preview || "New message"}</p>
          </div>
        </button>
      ))}
    </div>
  );
}
