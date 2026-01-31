"use client";

import { useState } from "react";
import {
  X,
  User,
  BellOff,
  Search,
  ChevronDown,
  ChevronRight,
  Lock,
} from "lucide-react";
import { useChat } from "@/hooks/useChats";
import { useAuthStore } from "@/store/authStore";
import { useChatStore } from "@/store/chatStore";
import type { ChatWithDetails } from "@/types/chat";

function getDisplayName(chat: ChatWithDetails | undefined, currentUserId: string): string {
  if (!chat) return "Chat";
  if (chat.name) return chat.name;
  const other = chat.members?.find((m) => m.userId !== currentUserId);
  return other?.user?.username ?? "Chat";
}

function getAvatarUrl(chat: ChatWithDetails | undefined, currentUserId: string): string | null {
  if (!chat) return null;
  if (chat.avatarUrl) return chat.avatarUrl;
  const other = chat.members?.find((m) => m.userId !== currentUserId);
  return other?.user?.avatarUrl ?? null;
}

export default function ChatInfoSidebar({ chatId }: { chatId: string | null }) {
  const user = useAuthStore((s) => s.user);
  const { data: chat } = useChat(chatId);
  const setRightSidebarOpen = useChatStore((s) => s.setRightSidebarOpen);
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({});

  const toggleSection = (key: string) => {
    setExpandedSections((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  if (!chatId || !user) return null;

  const name = getDisplayName(chat, user.id);
  const avatarUrl = getAvatarUrl(chat, user.id);

  return (
    <aside className="w-80 min-w-[280px] max-w-[360px] bg-slate-800/80 border-l border-slate-700/50 flex flex-col">
      {/* Header */}
      <div className="p-3 border-b border-slate-700/50 flex items-center justify-between">
        <span className="text-sm font-medium text-slate-300">Chat info</span>
        <button
          type="button"
          onClick={() => setRightSidebarOpen(false)}
          className="p-2 rounded-lg text-slate-400 hover:bg-slate-700/50 hover:text-white"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        {/* User profile */}
        <div className="flex flex-col items-center text-center mb-6">
          <div className="w-24 h-24 rounded-full bg-slate-600 overflow-hidden flex items-center justify-center mb-3">
            {avatarUrl ? (
              <img src={avatarUrl} alt="" className="w-full h-full object-cover" />
            ) : (
              <span className="text-3xl font-medium text-slate-400">
                {name.slice(0, 1).toUpperCase()}
              </span>
            )}
          </div>
          <h2 className="text-lg font-semibold text-white">{name}</h2>
          <div className="flex items-center gap-1.5 mt-2 text-slate-400 text-sm">
            <Lock className="w-4 h-4" />
            <span>End-to-end encrypted</span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-center gap-6 mb-6">
          <button
            type="button"
            className="flex flex-col items-center gap-1 text-slate-400 hover:text-white transition-colors"
          >
            <div className="w-12 h-12 rounded-full bg-slate-700/50 flex items-center justify-center">
              <User className="w-5 h-5" />
            </div>
            <span className="text-xs">Profile</span>
          </button>
          <button
            type="button"
            className="flex flex-col items-center gap-1 text-slate-400 hover:text-white transition-colors"
          >
            <div className="w-12 h-12 rounded-full bg-slate-700/50 flex items-center justify-center">
              <BellOff className="w-5 h-5" />
            </div>
            <span className="text-xs">Mute</span>
          </button>
          <button
            type="button"
            className="flex flex-col items-center gap-1 text-slate-400 hover:text-white transition-colors"
          >
            <div className="w-12 h-12 rounded-full bg-slate-700/50 flex items-center justify-center">
              <Search className="w-5 h-5" />
            </div>
            <span className="text-xs">Search</span>
          </button>
        </div>

        {/* Expandable sections */}
        {[
          { key: "chatInfo", label: "Chat info" },
          { key: "customize", label: "Customize chat" },
          { key: "media", label: "Media & files" },
          { key: "privacy", label: "Privacy & support" },
        ].map(({ key, label }) => (
          <div
            key={key}
            className="border-b border-slate-700/50 last:border-0"
          >
            <button
              type="button"
              onClick={() => toggleSection(key)}
              className="w-full flex items-center justify-between py-3 text-left text-slate-200 hover:text-white transition-colors"
            >
              <span className="text-sm">{label}</span>
              {expandedSections[key] ? (
                <ChevronDown className="w-4 h-4 text-slate-500" />
              ) : (
                <ChevronRight className="w-4 h-4 text-slate-500" />
              )}
            </button>
            {expandedSections[key] && (
              <div className="pb-3 text-sm text-slate-400">
                {key === "chatInfo" && (
                  <p>View and manage chat settings, participants, and more.</p>
                )}
                {key === "customize" && (
                  <p>Change chat theme, emoji, and nickname.</p>
                )}
                {key === "media" && (
                  <p>Browse shared photos, videos, and files.</p>
                )}
                {key === "privacy" && (
                  <p>Privacy settings and support options.</p>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </aside>
  );
}
