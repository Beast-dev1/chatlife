"use client";

import { useState, useRef, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { MessageCircle, Search, Pencil, MoreHorizontal, User, Users, LogOut } from "lucide-react";
import { useAuthStore } from "@/store/authStore";
import { useChats } from "@/hooks/useChats";
import ChatListItem from "./ChatListItem";
import CreateChatModal from "./CreateChatModal";
import type { ChatWithDetails } from "@/types/chat";

type TabType = "all" | "unread" | "groups";

function isChatUnread(chat: ChatWithDetails, currentUserId: string): boolean {
  const lastMsg = chat.messages?.[0];
  if (!lastMsg) return false;
  if (lastMsg.senderId === currentUserId) return false;
  const myMember = chat.members.find((m) => m.userId === currentUserId);
  if (!myMember?.lastReadAt) return true;
  return new Date(lastMsg.createdAt) > new Date(myMember.lastReadAt);
}

function filterChats(
  chats: ChatWithDetails[],
  currentUserId: string,
  tab: TabType,
  searchQuery: string
): ChatWithDetails[] {
  let filtered = chats;

  if (tab === "unread") {
    filtered = chats.filter((c) => isChatUnread(c, currentUserId));
  } else if (tab === "groups") {
    filtered = chats.filter((c) => c.type === "GROUP");
  }

  if (searchQuery.trim()) {
    const q = searchQuery.toLowerCase();
    filtered = filtered.filter((chat) => {
      const name = chat.name ?? chat.members.find((m) => m.userId !== currentUserId)?.user?.username ?? "";
      return name.toLowerCase().includes(q);
    });
  }

  return filtered;
}

export default function ChatListSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const { data: chats, isLoading, error } = useChats();
  const [tab, setTab] = useState<TabType>("all");
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

  const filteredChats = chats ? filterChats(chats, user.id, tab, searchQuery) : [];

  return (
    <aside className="w-80 min-w-[280px] max-w-[360px] bg-slate-800/80 border-r border-slate-700/50 flex flex-col">
      {/* Header: Logo + User icons */}
      <div className="p-3 border-b border-slate-700/50 flex items-center justify-between">
        <Link href="/chat" className="flex items-center gap-2">
          <div className="p-2 bg-emerald-500/20 rounded-xl">
            <MessageCircle className="w-6 h-6 text-emerald-400" />
          </div>
          <span className="font-semibold text-white">Let&apos;sChat</span>
        </Link>
        <div className="flex items-center gap-1">
          <Link
            href="/contacts"
            className="p-2 rounded-lg text-slate-400 hover:bg-slate-700/50 hover:text-white"
            aria-label="Contacts"
          >
            <Users className="w-5 h-5" />
          </Link>
          <Link
            href="/profile"
            className="p-2 rounded-lg text-slate-400 hover:bg-slate-700/50 hover:text-white"
            aria-label="Profile"
          >
            <User className="w-5 h-5" />
          </Link>
          <div className="relative" ref={menuRef}>
            <button
              type="button"
              onClick={() => setShowMenu(!showMenu)}
              className="p-2 rounded-lg text-slate-400 hover:bg-slate-700/50 hover:text-white"
              aria-label="More options"
            >
              <MoreHorizontal className="w-5 h-5" />
            </button>
            {showMenu && (
              <div className="absolute right-0 top-full mt-1 py-1 w-44 rounded-lg bg-slate-800 border border-slate-600 shadow-xl z-50">
                <Link
                  href="/profile"
                  onClick={() => setShowMenu(false)}
                  className="flex items-center gap-2 px-3 py-2 text-sm text-slate-200 hover:bg-slate-700/50"
                >
                  <User className="w-4 h-4" />
                  Profile
                </Link>
                <Link
                  href="/contacts"
                  onClick={() => setShowMenu(false)}
                  className="flex items-center gap-2 px-3 py-2 text-sm text-slate-200 hover:bg-slate-700/50"
                >
                  <Users className="w-4 h-4" />
                  Contacts
                </Link>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-400 hover:bg-slate-700/50"
                >
                  <LogOut className="w-4 h-4" />
                  Log out
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Search bar */}
      <div className="p-2 border-b border-slate-700/50">
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-700/30">
          <Search className="w-4 h-4 text-slate-500 flex-shrink-0" />
          <input
            type="search"
            placeholder="Search Messenger"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1 bg-transparent text-sm text-white placeholder-slate-500 focus:outline-none"
          />
        </div>
      </div>

      {/* New chat button */}
      <div className="px-3 py-2 flex items-center justify-between">
        <span className="text-sm font-medium text-slate-300">Chats</span>
        <button
          type="button"
          onClick={() => setShowCreate(true)}
          className="p-2 rounded-lg text-slate-400 hover:bg-slate-700/50 hover:text-white"
          aria-label="New chat"
        >
          <Pencil className="w-4 h-4" />
        </button>
      </div>

      {/* Tabs */}
      <div className="px-3 flex gap-4 border-b border-slate-700/50">
        {(["all", "unread", "groups"] as const).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={`py-3 text-sm font-medium border-b-2 transition-colors ${
              tab === t
                ? "text-emerald-400 border-emerald-400"
                : "text-slate-500 border-transparent hover:text-slate-300"
            }`}
          >
            {t === "all" ? "All" : t === "unread" ? "Unread" : "Groups"}
          </button>
        ))}
      </div>

      {/* Chat list */}
      <div className="flex-1 overflow-y-auto p-2">
        {isLoading && (
          <div className="flex items-center justify-center py-12 text-slate-400 text-sm">
            Loading chats…
          </div>
        )}
        {error && (
          <div className="flex items-center justify-center py-12 text-red-400 text-sm">
            Failed to load chats
          </div>
        )}
        {chats && filteredChats.length === 0 && !isLoading && (
          <div className="flex flex-col items-center justify-center py-12 text-slate-400 text-sm text-center px-4">
            {searchQuery.trim() || tab !== "all"
              ? "No chats match your filters"
              : "No chats yet. Start a new chat!"}
          </div>
        )}
        {filteredChats.length > 0 && (
          <div className="space-y-0.5">
            {filteredChats.map((chat) => (
              <ChatListItem
                key={chat.id}
                chat={chat}
                currentUserId={user.id}
                isActive={pathname === `/chat/${chat.id}`}
                isUnread={isChatUnread(chat, user.id)}
              />
            ))}
          </div>
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
