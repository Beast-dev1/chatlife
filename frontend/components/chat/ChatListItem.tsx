"use client";

import Link from "next/link";
import Image from "next/image";
import { motion, useReducedMotion } from "framer-motion";
import { usePresenceStore } from "@/store/presenceStore";
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
  unreadCount = 0,
  index = 0,
}: {
  chat: ChatWithDetails;
  currentUserId: string;
  isActive: boolean;
  isUnread?: boolean;
  unreadCount?: number;
  index?: number;
}) {
  const name = getDisplayName(chat, currentUserId);
  const avatarUrl = getAvatarUrl(chat, currentUserId);
  const preview = lastMessagePreview(chat);
  const time = lastMessageTime(chat);
  const isOnline = usePresenceStore((s) => s.isOnline);
  const getLastSeen = usePresenceStore((s) => s.getLastSeen);
  const otherMember = chat.type === "DIRECT" ? chat.members.find((m) => m.userId !== currentUserId) : null;
  const otherUserId = otherMember?.userId;
  const otherOnline = otherUserId ? isOnline(otherUserId) : false;
  const otherLastSeen = otherUserId ? getLastSeen(otherUserId) : undefined;
  const reduceMotion = useReducedMotion();

  return (
    <motion.div
      initial={reduceMotion ? false : { opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={reduceMotion ? { duration: 0 } : { duration: 0.2, ease: "easeOut", delay: index * 0.03 }}
    >
      <Link
        href={`/chat/${chat.id}`}
        className={`flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-normal ${
          isActive
            ? "bg-gradient-to-r from-primary-500 to-primary-600 text-white shadow-surface"
            : isUnread
              ? "bg-slate-50 dark:bg-slate-700/50 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-100"
              : "hover:bg-slate-50 dark:hover:bg-slate-700/50 text-slate-800 dark:text-slate-100"
        }`}
      >
        <div className="relative w-12 h-12 rounded-full bg-slate-200 dark:bg-slate-600 flex-shrink-0 overflow-hidden flex items-center justify-center ring-2 ring-white/50 dark:ring-slate-700/50">
          {avatarUrl ? (
            <Image src={avatarUrl} alt="" width={48} height={48} className="w-full h-full object-cover" />
          ) : (
            <span className={`text-lg font-semibold ${isActive ? "text-white" : "text-slate-500 dark:text-slate-400"}`}>
              {name.slice(0, 1).toUpperCase()}
            </span>
          )}
          {chat.type === "DIRECT" && otherUserId && (
            <span
              className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 ${isActive ? "border-primary-500" : "border-white dark:border-slate-800"} ${
                otherOnline ? "bg-green-500" : "bg-slate-400 dark:bg-slate-500"
              }`}
              title={otherOnline ? "Online" : otherLastSeen ? `Last seen ${otherLastSeen}` : "Offline"}
            />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <span
              className={`truncate font-semibold uppercase tracking-wide text-sm ${
                isActive ? "text-white" : isUnread ? "text-slate-900 dark:text-slate-100" : "text-slate-700 dark:text-slate-200"
              }`}
            >
              {name}
            </span>
            <span className={`text-xs flex-shrink-0 ${isActive ? "text-white/90" : "text-slate-500 dark:text-slate-400"}`}>
              {time}
            </span>
          </div>
          <p
            className={`text-sm truncate ${
              isActive ? "text-white/90" : isUnread ? "text-slate-600 dark:text-slate-300 font-medium" : "text-slate-500 dark:text-slate-400"
            }`}
          >
            {preview}
          </p>
        </div>
        {isUnread && unreadCount > 0 && !isActive && (
          <span className="min-w-[1.25rem] h-5 px-1.5 rounded-full bg-primary-500 text-white text-xs font-semibold flex items-center justify-center flex-shrink-0 shadow-sm">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
        {isActive && isUnread && unreadCount > 0 && (
          <span className="min-w-[1.25rem] h-5 px-1.5 rounded-full bg-white/25 text-white text-xs font-semibold flex items-center justify-center flex-shrink-0">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </Link>
    </motion.div>
  );
}
