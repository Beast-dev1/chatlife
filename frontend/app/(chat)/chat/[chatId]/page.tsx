"use client";

import { useEffect, useRef } from "react";
import { useParams } from "next/navigation";
import { Video, Phone, Info } from "lucide-react";
import { useAuthStore } from "@/store/authStore";
import { useSocket } from "@/hooks/useSocket";
import { useChat } from "@/hooks/useChats";
import { useMessages } from "@/hooks/useMessages";
import { useChatStore } from "@/store/chatStore";
import MessageBubble from "@/components/chat/MessageBubble";
import MessageInput from "@/components/chat/MessageInput";
import type { ChatWithDetails } from "@/types/chat";
import type { MessageWithSender } from "@/types/chat";

function getChatTitle(chat: ChatWithDetails | undefined, currentUserId: string): string {
  if (!chat) return "Chat";
  if (chat.name) return chat.name;
  const other = chat.members?.find((m) => m.userId !== currentUserId);
  return other?.user?.username ?? "Chat";
}

export default function ChatThreadPage() {
  const params = useParams();
  const chatId = params.chatId as string;
  const user = useAuthStore((s) => s.user);
  const { socket, isConnected } = useSocket();
  const { data: chat } = useChat(chatId);
  const { data: messagesData, isLoading: messagesLoading } = useMessages(chatId);
  const setActiveChatId = useChatStore((s) => s.setActiveChatId);
  const setMessages = useChatStore((s) => s.setMessages);
  const messagesByChat = useChatStore((s) => s.messagesByChat);
  const toggleRightSidebar = useChatStore((s) => s.toggleRightSidebar);
  const bottomRef = useRef<HTMLDivElement>(null);

  const displayMessages: MessageWithSender[] = messagesByChat[chatId] ?? [];

  useEffect(() => {
    setActiveChatId(chatId);
    return () => setActiveChatId(null);
  }, [chatId, setActiveChatId]);

  useEffect(() => {
    if (!socket || !chatId) return;
    socket.emit("join_chat", chatId);
    return () => {
      socket.emit("leave_chat", chatId);
    };
  }, [socket, chatId]);

  useEffect(() => {
    if (!messagesData?.pages?.length || !chatId) return;
    const flat = messagesData.pages.flatMap((p) => p.messages);
    const chronological = [...flat].reverse();
    setMessages(chatId, chronological);
  }, [messagesData, chatId, setMessages]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [displayMessages.length]);

  if (!user) return null;

  const title = getChatTitle(chat, user.id);

  return (
    <div className="flex flex-col h-full bg-slate-900">
      <header className="flex items-center gap-3 px-4 py-3 border-b border-slate-700/50 bg-slate-800/80">
        <div className="flex-1 min-w-0">
          <h1 className="font-semibold text-white truncate">{title}</h1>
          <p className="text-xs text-slate-500">
            {isConnected ? "Online" : "Connecting…"}
          </p>
        </div>
        <div className="flex items-center gap-1">
          <button
            type="button"
            className="p-2 rounded-lg text-slate-400 hover:bg-slate-700/50 hover:text-white"
            aria-label="Video call"
          >
            <Video className="w-5 h-5" />
          </button>
          <button
            type="button"
            className="p-2 rounded-lg text-slate-400 hover:bg-slate-700/50 hover:text-white"
            aria-label="Audio call"
          >
            <Phone className="w-5 h-5" />
          </button>
          <button
            type="button"
            onClick={toggleRightSidebar}
            className="p-2 rounded-lg text-slate-400 hover:bg-slate-700/50 hover:text-white"
            aria-label="Chat info"
          >
            <Info className="w-5 h-5" />
          </button>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-1">
        {messagesLoading && displayMessages.length === 0 && (
          <div className="flex justify-center py-8 text-slate-500">Loading messages…</div>
        )}
        {!messagesLoading && displayMessages.length === 0 && (
          <div className="flex justify-center py-8 text-slate-500">No messages yet. Say hi!</div>
        )}
        {displayMessages.map((msg) => (
          <MessageBubble
            key={msg.id}
            message={msg}
            isOwn={msg.senderId === user.id}
            showSender={chat?.type === "GROUP"}
          />
        ))}
        <div ref={bottomRef} />
      </div>

      <MessageInput chatId={chatId} disabled={!isConnected} />
    </div>
  );
}
