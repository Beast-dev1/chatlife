"use client";

import { useState, useRef, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { MessageCircle, Search, Pencil, MoreHorizontal, User, Users, LogOut, Phone } from "lucide-react";
import { useAuthStore } from "@/store/authStore";
import { useChats } from "@/hooks/useChats";
import ChatListItem from "./ChatListItem";
import CreateChatModal from "./CreateChatModal";
import type { ChatWithDetails } from "@/types/chat";

type TabType = "email" | "chat";

function isChatUnread(chat: ChatWithDetails, currentUserId: string): boolean {
  const lastMsg = chat.messages?.[0];
  if (!lastMsg) return false;
  if (lastMsg.senderId === currentUserId) return false;
  const myMember = chat.members.find((m) => m.userId === currentUserId);
  if (!myMember?.lastReadAt) return true;
  return new Date(lastMsg.createdAt) > new Date(myMember.lastReadAt);
}

function getUnreadCount(chat: ChatWithDetails, currentUserId: string): number {
  // Simplified: 1 if unread, 0 otherwise. Could be extended to actual count.
  return isChatUnread(chat, currentUserId) ? 1 : 0;
}

function filterChats(
  chats: ChatWithDetails[],
  currentUserId: string,
  searchQuery: string
): ChatWithDetails[] {
  if (!searchQuery.trim()) return chats;
  const q = searchQuery.toLowerCase();
  return chats.filter((chat) => {
    const name = chat.name ?? chat.members.find((m) => m.userId !== currentUserId)?.user?.username ?? "";
    return name.toLowerCase().includes(q);
  });
}

export default function ChatListSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const { data: chats, isLoading, error } = useChats();
  const [tab, setTab] = useState<TabType>("chat");
  const [searchQuery, setSearchQuery] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const logout = useAuthStore((s) => s.logout);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowMenu(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = async () => {
    setShowMenu(false);
    await logout();
    router.replace("/login");
    router.refresh();
  };

  if (!user) return null;

  const filteredChats = chats ? filterChats(chats, user.id, searchQuery) : [];
  const unreadCounts = new Map<string, number>();
  chats?.forEach((c) => {
    const count = getUnreadCount(c, user.id);
    if (count > 0) unreadCounts.set(c.id, count);
  });

  return (
    <aside className="w-80 min-w-[280px] max-w-[360px] bg-white/90 backdrop-blur-sm border-r border-slate-200/60 flex flex-col rounded-r-2xl shadow-soft">
      {/* Header: Logo + User icons */}
      <div className="p-3 border-b border-slate-100/80 flex items-center justify-between">
        <Link href="/chat" className="flex items-center gap-2.5 group">
          <div className="p-2.5 bg-gradient-to-br from-primary-400 to-primary-600 rounded-xl shadow-sm group-hover:shadow-glow transition-shadow duration-300">
            <MessageCircle className="w-5 h-5 text-white" />
          </div>
          <span className="font-semibold text-slate-800">SKS Funding</span>
        </Link>
        <div className="flex items-center gap-0.5">
          <Link
            href="/calls"
            className="p-2.5 rounded-xl text-slate-500 hover:bg-slate-100 hover:text-slate-700 transition-colors duration-200"
            aria-label="Calls"
          >
            <Phone className="w-5 h-5" />
          </Link>
          <Link
            href="/contacts"
            className="p-2.5 rounded-xl text-slate-500 hover:bg-slate-100 hover:text-slate-700 transition-colors duration-200"
            aria-label="Contacts"
          >
            <Users className="w-5 h-5" />
          </Link>
          <Link
            href="/profile"
            className="p-2.5 rounded-xl text-slate-500 hover:bg-slate-100 hover:text-slate-700 transition-colors duration-200"
            aria-label="Profile"
          >
            <User className="w-5 h-5" />
          </Link>
          <div className="relative" ref={menuRef}>
            <button
              type="button"
              onClick={() => setShowMenu(!showMenu)}
              className="p-2.5 rounded-xl text-slate-500 hover:bg-slate-100 hover:text-slate-700 transition-colors duration-200"
              aria-label="More options"
            >
              <MoreHorizontal className="w-5 h-5" />
            </button>
            <AnimatePresence>
              {showMenu && (
                <motion.div
                  initial={{ opacity: 0, y: -4, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -4, scale: 0.98 }}
                  transition={{ duration: 0.15 }}
                  className="absolute right-0 top-full mt-1.5 py-1.5 w-48 rounded-2xl bg-white border border-slate-200/80 shadow-soft-lg z-50 overflow-hidden"
                >
                  <Link
                    href="/profile"
                    onClick={() => setShowMenu(false)}
                    className="flex items-center gap-2.5 px-3.5 py-2.5 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
                  >
                    <User className="w-4 h-4 text-slate-400" />
                    Profile
                  </Link>
                  <Link
                    href="/contacts"
                    onClick={() => setShowMenu(false)}
                    className="flex items-center gap-2.5 px-3.5 py-2.5 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
                  >
                    <Users className="w-4 h-4 text-slate-400" />
                    Contacts
                  </Link>
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-sm text-rose-600 hover:bg-rose-50 transition-colors"
                  >
                    <LogOut className="w-4 h-4" />
                    Log out
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Search bar */}
      <div className="p-3 border-b border-slate-100/80">
        <div className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl bg-slate-100/80 border border-slate-200/50 focus-within:bg-white focus-within:border-primary-300/50 focus-within:ring-2 focus-within:ring-primary-500/20 transition-all duration-200">
          <Search className="w-4 h-4 text-slate-400 flex-shrink-0" />
          <input
            type="search"
            placeholder="Search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1 bg-transparent text-sm text-slate-800 placeholder-slate-400 focus:outline-none"
          />
        </div>
      </div>

      {/* Tabs: EMAIL | CHAT (Chat active = orange pill) */}
      <div className="px-3 pt-2.5 flex gap-0">
        <button
          type="button"
          onClick={() => setTab("email")}
          className={`px-4 py-2.5 text-sm font-semibold rounded-l-xl transition-all duration-200 ${
            tab === "email"
              ? "bg-primary-500 text-white shadow-sm"
              : "bg-slate-50 text-slate-500 border border-r-0 border-slate-200/80 hover:bg-slate-100"
          }`}
        >
          EMAIL
        </button>
        <button
          type="button"
          onClick={() => setTab("chat")}
          className={`px-4 py-2.5 text-sm font-semibold rounded-r-xl transition-all duration-200 ${
            tab === "chat"
              ? "bg-primary-500 text-white shadow-sm"
              : "bg-slate-50 text-slate-500 border border-slate-200/80 hover:bg-slate-100"
          }`}
        >
          CHAT
        </button>
      </div>

      {/* New chat button (when Chat tab) */}
      {tab === "chat" && (
        <div className="px-3 py-2 flex items-center justify-end">
          <motion.button
            type="button"
            onClick={() => setShowCreate(true)}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.98 }}
            className="p-2.5 rounded-xl text-slate-500 hover:bg-slate-100 hover:text-slate-700 transition-colors duration-200"
            aria-label="New chat"
          >
            <Pencil className="w-4 h-4" />
          </motion.button>
        </div>
      )}

      {/* Chat list (when Chat tab) / Email placeholder */}
      <div className="flex-1 overflow-y-auto p-2 scrollbar-thin">
        {tab === "email" && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center justify-center py-12 text-slate-400 text-sm text-center px-4"
          >
            No emails yet.
          </motion.div>
        )}
        {tab === "chat" && (
          <>
            {isLoading && (
              <div className="flex items-center justify-center py-12">
                <div className="flex gap-1.5">
                  {[0, 1, 2].map((i) => (
                    <motion.div
                      key={i}
                      className="w-2 h-2 rounded-full bg-primary-400"
                      animate={{ y: [0, -6, 0] }}
                      transition={{ duration: 0.5, repeat: Infinity, delay: i * 0.1 }}
                    />
                  ))}
                </div>
              </div>
            )}
            {error && (
              <div className="flex items-center justify-center py-12 text-rose-500 text-sm">
                Failed to load chats
              </div>
            )}
            {chats && filteredChats.length === 0 && !isLoading && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex flex-col items-center justify-center py-12 text-slate-500 text-sm text-center px-4"
              >
                {searchQuery.trim() ? "No chats match your search" : "No chats yet. Start a new chat!"}
              </motion.div>
            )}
            {filteredChats.length > 0 && (
              <div className="space-y-1">
                {filteredChats.map((chat, i) => (
                  <ChatListItem
                    key={chat.id}
                    chat={chat}
                    currentUserId={user.id}
                    isActive={pathname === `/chat/${chat.id}`}
                    isUnread={isChatUnread(chat, user.id)}
                    unreadCount={unreadCounts.get(chat.id) ?? 0}
                    index={i}
                  />
                ))}
              </div>
            )}
          </>
        )}
      </div>

      {showCreate && (
        <CreateChatModal
          onClose={() => setShowCreate(false)}
          onCreated={(chatId) => {
            setShowCreate(false);
            router.push(`/chat/${chatId}`);
          }}
        />
      )}
    </aside>
  );
}
