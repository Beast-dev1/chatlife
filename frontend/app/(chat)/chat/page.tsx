"use client";

import { MessageCircle } from "lucide-react";

export default function ChatPage() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center p-8 text-slate-400">
      <div className="p-6 bg-slate-800/50 rounded-2xl border border-slate-700/50 text-center max-w-md">
        <MessageCircle className="w-16 h-16 mx-auto mb-4 text-emerald-500/50" />
        <h2 className="text-lg font-medium text-slate-300 mb-2">
          Your chats will appear here
        </h2>
        <p className="text-sm text-slate-500">
          Phase 2 will add contacts, chat creation, and real-time messaging.
        </p>
      </div>
    </div>
  );
}
