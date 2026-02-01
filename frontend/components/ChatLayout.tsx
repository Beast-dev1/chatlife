"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { MessageCircle, LogOut, User, Users } from "lucide-react";
import { useAuthStore } from "@/store/authStore";
import { useChatStore } from "@/store/chatStore";
import SocketSync from "./SocketSync";
import CallProvider from "./chat/CallProvider";
import ChatListSidebar from "./chat/ChatListSidebar";
import ChatInfoSidebar from "./chat/ChatInfoSidebar";
import NewMessageToastContainer from "./chat/NewMessageToast";
import NotificationPermission from "./NotificationPermission";

export default function ChatLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, isInitialized, init, logout } = useAuthStore();
  const rightSidebarOpen = useChatStore((s) => s.rightSidebarOpen);

  const isChatRoute = pathname.startsWith("/chat") || pathname === "/calls";
  const chatIdMatch = pathname.match(/^\/chat\/([^/]+)$/);
  const activeChatId = chatIdMatch ? chatIdMatch[1] : null;

  useEffect(() => {
    init();
  }, [init]);

  useEffect(() => {
    if (!isInitialized) return;
    if (!user) {
      router.replace("/login");
    }
  }, [user, isInitialized, router]);

  const handleLogout = async () => {
    await logout();
    router.replace("/login");
    router.refresh();
  };

  if (!isInitialized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900">
        <div className="animate-pulse text-slate-400">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  // 3-column layout for chat routes
  if (isChatRoute) {
    return (
      <div className="h-screen flex bg-slate-900">
        <ChatListSidebar />
        <main className="flex-1 flex flex-col overflow-hidden min-w-0">
          <NotificationPermission />
          <SocketSync />
          <CallProvider />
          {children}
          <NewMessageToastContainer />
        </main>
        {rightSidebarOpen && activeChatId && (
          <ChatInfoSidebar chatId={activeChatId} />
        )}
      </div>
    );
  }

  // Original sidebar + main for contacts, profile
  return (
    <div className="h-screen flex bg-slate-900">
      <aside className="w-72 bg-slate-800/80 border-r border-slate-700/50 flex flex-col">
        <div className="p-4 border-b border-slate-700/50 flex items-center gap-3">
          <div className="p-2 bg-emerald-500/20 rounded-xl">
            <MessageCircle className="w-6 h-6 text-emerald-400" />
          </div>
          <span className="font-semibold text-white">Let&apos;sChat</span>
        </div>

        <nav className="flex-1 p-2 overflow-y-auto">
          <Link
            href="/chat"
            className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
              pathname === "/chat"
                ? "bg-emerald-500/20 text-emerald-400"
                : "text-slate-300 hover:bg-slate-700/50"
            }`}
          >
            <MessageCircle className="w-5 h-5" />
            <span>Chats</span>
          </Link>
          <Link
            href="/contacts"
            className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
              pathname === "/contacts"
                ? "bg-emerald-500/20 text-emerald-400"
                : "text-slate-300 hover:bg-slate-700/50"
            }`}
          >
            <Users className="w-5 h-5" />
            <span>Contacts</span>
          </Link>
          <Link
            href="/profile"
            className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
              pathname === "/profile"
                ? "bg-emerald-500/20 text-emerald-400"
                : "text-slate-300 hover:bg-slate-700/50"
            }`}
          >
            <User className="w-5 h-5" />
            <span>Profile</span>
          </Link>
        </nav>

        <div className="p-2 border-t border-slate-700/50">
          <div className="flex items-center gap-3 px-3 py-2 rounded-lg bg-slate-700/30 mb-2">
            <div className="w-9 h-9 rounded-full bg-emerald-500/30 flex items-center justify-center">
              <User className="w-5 h-5 text-emerald-400" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">
                {user.username}
              </p>
              <p className="text-xs text-slate-400 truncate">{user.email}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-slate-300 hover:bg-red-500/10 hover:text-red-400 transition-colors"
          >
            <LogOut className="w-5 h-5" />
            <span>Log out</span>
          </button>
        </div>
      </aside>

      <main className="flex-1 flex flex-col overflow-hidden">
        <NotificationPermission />
        <SocketSync />
        <CallProvider />
        {children}
        <NewMessageToastContainer />
      </main>
    </div>
  );
}
