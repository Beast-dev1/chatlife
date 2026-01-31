"use client";

import Link from "next/link";
import type { ChatWithDetails } from "@/types/chat";

function getDisplayName(chat: ChatWithDetails, currentUserId: string): string {
  if (chat.name) return chat.name;
  const other = chat.members.find((m) => m.userId !== currentUserId);
  return other?.user?.username ?? "Chat";
}

function getAvatarUrl(chat: ChatWithDetails, currentUserId: string): string | null {
  if (chat.avatarUrl) return chat.avatarUrl;
  const other = chat.members.find((m) => m.userId !== currentUserId);
  return other?.user?.avatarUrl ?? null;
}

function lastMessagePreview(chat: ChatWithDetails): string {
  const last = chat.messages?.[0];
  if (!last) return "No messages yet";
  if (last.type === "IMAGE") return "📷 Photo";
  if (last.type === "FILE") return "📎 File";
  return (last.content ?? "").slice(0, 40) + ((last.content?.length ?? 0) > 40 ? "…" : "");
}

function lastMessageTime(chat: ChatWithDetails): string {
  const last = chat.messages?.[0];
  const t = last ? new Date(last.createdAt) : new Date(chat.updatedAt);
  const now = new Date();
  const diff = now.getTime() - t.getTime();
  if (diff < 60000) return "now";
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m`;
  if (diff < 86400000) return t.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  return t.toLocaleDateString([], { month: "short", day: "numeric" });
}

export default function ChatListItem({
  chat,
  currentUserId,
  isActive,
  isUnread = false,
}: {
  chat: ChatWithDetails;
  currentUserId: string;
  isActive: boolean;
  isUnread?: boolean;
}) {
  const name = getDisplayName(chat, currentUserId);
  const avatarUrl = getAvatarUrl(chat, currentUserId);
  const preview = lastMessagePreview(chat);
  const time = lastMessageTime(chat);

  return (
    <Link
      href={`/chat/${chat.id}`}
      className={`flex items-center gap-3 px-3 py-3 rounded-xl transition-colors ${
        isActive
          ? "bg-emerald-500/20 text-emerald-50"
          : isUnread
            ? "bg-slate-700/40 hover:bg-slate-700/60 text-slate-200"
            : "hover:bg-slate-700/50 text-slate-200"
      }`}
    >
      <div className="w-12 h-12 rounded-full bg-slate-600 flex-shrink-0 overflow-hidden flex items-center justify-center">
        {avatarUrl ? (
          <img src={avatarUrl} alt="" className="w-full h-full object-cover" />
        ) : (
          <span className="text-lg font-medium text-slate-400">
            {name.slice(0, 1).toUpperCase()}
          </span>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <span
            className={`truncate ${isUnread ? "font-semibold text-white" : "font-medium"}`}
          >
            {name}
          </span>
          <span className="text-xs text-slate-500 flex-shrink-0">{time}</span>
        </div>
        <p
          className={`text-sm truncate ${
            isUnread ? "text-slate-300 font-medium" : "text-slate-500"
          }`}
        >
          {preview}
        </p>
      </div>
    </Link>
  );
}
