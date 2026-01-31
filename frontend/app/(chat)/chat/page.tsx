"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { MessageCircle, Plus } from "lucide-react";
import { useAuthStore } from "@/store/authStore";
import { useChats } from "@/hooks/useChats";
import ChatListItem from "@/components/chat/ChatListItem";
import CreateChatModal from "@/components/chat/CreateChatModal";

export default function ChatPage() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const { data: chats, isLoading, error } = useChats();
  const [showCreate, setShowCreate] = useState(false);

  const handleCreated = (chatId: string) => {
    router.push(`/chat/${chatId}`);
  };

  if (!user) return null;

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between p-4 border-b border-slate-700/50">
        <h1 className="text-xl font-semibold text-white">Chats</h1>
        <button
          type="button"
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 px-3 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-medium"
        >
          <Plus className="w-5 h-5" />
          New chat
        </button>
      </div>
      <div className="flex-1 overflow-y-auto p-2">
        {isLoading && (
          <div className="flex items-center justify-center py-12 text-slate-400">
            Loading chats…
          </div>
        )}
        {error && (
          <div className="flex items-center justify-center py-12 text-red-400">
            Failed to load chats
          </div>
        )}
        {chats && chats.length === 0 && !isLoading && (
          <div className="flex flex-col items-center justify-center py-12 text-slate-400">
            <MessageCircle className="w-16 h-16 mb-4 text-slate-600" />
            <p className="text-center">No chats yet. Start a new chat!</p>
            <button
              type="button"
              onClick={() => setShowCreate(true)}
              className="mt-4 px-4 py-2 rounded-lg bg-emerald-600 text-white text-sm"
            >
              New chat
            </button>
          </div>
        )}
        {chats && chats.length > 0 && (
          <div className="space-y-1">
            {chats.map((chat) => (
              <ChatListItem
                key={chat.id}
                chat={chat}
                currentUserId={user.id}
                isActive={false}
              />
            ))}
          </div>
        )}
      </div>
      {showCreate && (
        <CreateChatModal
          onClose={() => setShowCreate(false)}
          onCreated={handleCreated}
        />
      )}
    </div>
  );
}
