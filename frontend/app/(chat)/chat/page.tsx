"use client";

import { MessageCircle } from "lucide-react";
import { useAuthStore } from "@/store/authStore";

export default function ChatPage() {
  const user = useAuthStore((s) => s.user);

  if (!user) return null;

  return (
    <div className="flex flex-col h-full items-center justify-center bg-slate-900">
      <div className="flex flex-col items-center text-center px-6">
        <MessageCircle className="w-24 h-24 text-slate-600 mb-4" />
        <h2 className="text-xl font-semibold text-slate-300 mb-2">Select a chat</h2>
        <p className="text-slate-500 text-sm max-w-xs">
          Choose a conversation from the list or start a new chat to get started.
        </p>
      </div>
    </div>
  );
}
