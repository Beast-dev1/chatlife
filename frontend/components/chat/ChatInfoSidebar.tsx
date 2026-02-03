"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import {
  X,
  Phone,
  Mail,
  Video,
  MoreHorizontal,
} from "lucide-react";
import { useChat } from "@/hooks/useChats";
import { useSocket } from "@/hooks/useSocket";
import { useAuthStore } from "@/store/authStore";
import { useChatStore } from "@/store/chatStore";
import { useCallStore } from "@/store/callStore";
import { usePresenceStore } from "@/store/presenceStore";
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

function formatJoinedDate(iso: string): string {
  const d = new Date(iso);
  const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const day = days[d.getDay()];
  const date = d.getDate();
  const suffix = date === 1 || date === 21 || date === 31 ? "st" : date === 2 || date === 22 ? "nd" : date === 3 || date === 23 ? "rd" : "th";
  const month = d.toLocaleDateString("en-US", { month: "short" });
  const year = d.getFullYear();
  return `${day} ${date}${suffix} ${month} ${year}`;
}

export default function ChatInfoSidebar({ chatId }: { chatId: string | null }) {
  const user = useAuthStore((s) => s.user);
  const { data: chat } = useChat(chatId);
  const { socket, isConnected } = useSocket();
  const setRightSidebarOpen = useChatStore((s) => s.setRightSidebarOpen);
  const activeCall = useCallStore((s) => s.activeCall);
  const incomingCall = useCallStore((s) => s.incomingCall);
  const isOnline = usePresenceStore((s) => s.isOnline);

  if (!chatId || !user) return null;

  const name = getDisplayName(chat, user.id);
  const avatarUrl = getAvatarUrl(chat, user.id);
  const otherMember = chat?.members?.find((m) => m.userId !== user.id);
  const otherUserId = otherMember?.userId;
  const activeNow = otherUserId ? isOnline(otherUserId) : false;
  const joinedAt = otherMember?.joinedAt ?? user.createdAt;

  const canCall =
    chat?.type === "DIRECT" &&
    !!otherUserId &&
    isConnected &&
    !activeCall &&
    !incomingCall;

  const handleStartCall = (callType: "audio" | "video") => {
    if (!socket || !chatId || !canCall) return;
    socket.emit("call_initiate", { chatId, callType });
  };

  const actions = [
    { icon: Phone, label: "Call", onClick: () => handleStartCall("audio") },
    { icon: Mail, label: "Email", onClick: undefined },
    { icon: Video, label: "Video", onClick: () => handleStartCall("video") },
    { icon: MoreHorizontal, label: "More", onClick: undefined },
  ];

  const details = [
    { label: "EMAIL", value: (otherMember?.user as { email?: string } | undefined)?.email ?? "—" },
    { label: "PHONE", value: "—" },
    { label: "ADDRESS", value: "—" },
    { label: "PLAN", value: "—" },
    { label: "JOINED", value: formatJoinedDate(joinedAt) },
  ];

  return (
    <motion.aside
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      transition={{ duration: 0.2 }}
      className="w-80 min-w-[280px] max-w-[360px] bg-white/90 backdrop-blur-sm border-l border-slate-200/60 flex flex-col rounded-l-2xl shadow-soft"
    >
      {/* Header: NEED HELP, bell, user avatar */}
      <div className="p-3 border-b border-slate-100/80 flex items-center justify-between">
        <a href="#" className="text-sm font-semibold text-slate-600 hover:text-primary-500 transition-colors duration-200">
          NEED HELP
        </a>
        <div className="flex items-center gap-1">
          <motion.button
            type="button"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="p-2.5 rounded-xl text-slate-500 hover:bg-slate-100 hover:text-slate-700 transition-colors"
            aria-label="Notifications"
          >
            <span className="text-lg">🔔</span>
          </motion.button>
          <div className="w-9 h-9 rounded-full bg-slate-100 overflow-hidden flex items-center justify-center ring-2 ring-white shadow-inner">
            {user.avatarUrl ? (
              <Image src={user.avatarUrl} alt="" width={36} height={36} className="w-full h-full object-cover" unoptimized />
            ) : (
              <span className="text-sm font-semibold text-slate-500">{user.username?.slice(0, 1).toUpperCase()}</span>
            )}
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        {/* Profile with gradient ring */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="flex flex-col items-center text-center mb-6"
        >
          <div className="p-1 rounded-full bg-gradient-to-br from-primary-400 via-primary-500 to-primary-600 shadow-soft mb-4">
            <div className="w-28 h-28 rounded-full bg-slate-100 overflow-hidden flex items-center justify-center ring-4 ring-white">
              {avatarUrl ? (
                <Image src={avatarUrl} alt="" width={112} height={112} className="w-full h-full object-cover" unoptimized />
              ) : (
                <span className="text-4xl font-semibold text-slate-400">
                  {name.slice(0, 1).toUpperCase()}
                </span>
              )}
            </div>
          </div>
          <h2 className="text-lg font-bold text-slate-800 uppercase tracking-wide">{name}</h2>
          <p className={`flex items-center gap-1.5 mt-2 text-sm font-semibold ${activeNow ? "text-green-500" : "text-slate-500"}`}>
            <span className={`w-2 h-2 rounded-full ${activeNow ? "bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]" : "bg-slate-400"}`} />
            {activeNow ? "Active Now" : "Offline"}
          </p>
        </motion.div>

        {/* Action icons */}
        <div className="flex justify-center gap-3 mb-8">
          {actions.map(({ icon: Icon, label, onClick }, i) => (
            <motion.button
              key={label}
              type="button"
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.08 + i * 0.03 }}
              whileHover={{ scale: 1.08 }}
              whileTap={{ scale: 0.95 }}
              onClick={onClick}
              disabled={onClick ? !canCall : false}
              className={`flex flex-col items-center gap-1.5 transition-colors ${
                onClick && canCall
                  ? "text-slate-600 hover:text-slate-800 cursor-pointer"
                  : onClick
                    ? "text-slate-400 cursor-not-allowed"
                    : "text-slate-600 hover:text-slate-800"
              }`}
            >
              <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center hover:bg-slate-200 transition-colors duration-200">
                <Icon className="w-5 h-5" />
              </div>
              <span className="text-xs font-semibold">{label}</span>
            </motion.button>
          ))}
        </div>

        {/* Details cards */}
        <div className="space-y-4">
          {details.map(({ label, value }, i) => (
            <motion.div
              key={label}
              initial={{ opacity: 0, x: -4 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.12 + i * 0.02 }}
              className="rounded-xl bg-slate-50/80 px-4 py-3 border border-slate-100"
            >
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">{label}</p>
              <p className="text-sm text-slate-800 font-medium">{value}</p>
            </motion.div>
          ))}
        </div>

        {/* Block button */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.25 }}
          className="mt-8 pt-6 border-t border-slate-100"
        >
          <motion.button
            type="button"
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
            className="w-full py-3 rounded-xl bg-pink-100 text-pink-700 font-bold text-sm hover:bg-pink-200 transition-colors duration-200"
          >
            BLOCK
          </motion.button>
        </motion.div>
      </div>

      <div className="p-2 border-t border-slate-100 flex justify-end">
        <motion.button
          type="button"
          onClick={() => setRightSidebarOpen(false)}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="p-2.5 rounded-xl text-slate-500 hover:bg-slate-100 hover:text-slate-700 transition-colors"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </motion.button>
      </div>
    </motion.aside>
  );
}
