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
      <div className="min-h-screen flex items-center justify-center app-shell">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary-500/20 animate-pulse" />
          <span className="text-sm font-medium text-slate-500">Loading...</span>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  // 3-column layout for chat routes (modern: gradient bg, soft shadows)
  if (isChatRoute) {
    return (
      <div className="h-screen flex app-shell">
        <ChatListSidebar />
        <main className="flex-1 flex flex-col overflow-hidden min-w-0 bg-white/90 backdrop-blur-sm rounded-l-2xl shadow-soft border border-slate-200/60">
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

  // Original sidebar + main for contacts, profile (modern theme)
  return (
    <div className="h-screen flex app-shell">
      <aside className="w-72 bg-white/90 backdrop-blur-sm border-r border-slate-200/60 flex flex-col rounded-r-2xl shadow-soft">
        <div className="p-4 border-b border-slate-100 flex items-center gap-3">
          <div className="p-2.5 bg-gradient-to-br from-primary-400 to-primary-600 rounded-xl shadow-sm">
            <MessageCircle className="w-5 h-5 text-white" />
          </div>
          <span className="font-semibold text-slate-800">Let&apos;sChat</span>
        </div>

        <nav className="flex-1 p-2 overflow-y-auto">
          <Link
            href="/chat"
            className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 ${
              pathname === "/chat"
                ? "bg-primary-500 text-white shadow-sm"
                : "text-slate-600 hover:bg-slate-100/80"
            }`}
          >
            <MessageCircle className="w-5 h-5" />
            <span>Chats</span>
          </Link>
          <Link
            href="/contacts"
            className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 ${
              pathname === "/contacts"
                ? "bg-primary-500 text-white shadow-sm"
                : "text-slate-600 hover:bg-slate-100/80"
            }`}
          >
            <Users className="w-5 h-5" />
            <span>Contacts</span>
          </Link>
          <Link
            href="/profile"
            className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 ${
              pathname === "/profile"
                ? "bg-primary-500 text-white shadow-sm"
                : "text-slate-600 hover:bg-slate-100/80"
            }`}
          >
            <User className="w-5 h-5" />
            <span>Profile</span>
          </Link>
        </nav>

        <div className="p-2 border-t border-slate-100">
          <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-slate-50/80 mb-2">
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary-100 to-primary-200 flex items-center justify-center ring-2 ring-white shadow-inner">
              <User className="w-5 h-5 text-primary-600" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-slate-800 truncate">
                {user.username}
              </p>
              <p className="text-xs text-slate-500 truncate">{user.email}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-slate-600 hover:bg-rose-50 hover:text-rose-600 transition-all duration-200"
          >
            <LogOut className="w-5 h-5" />
            <span>Log out</span>
          </button>
        </div>
      </aside>

      <main className="flex-1 flex flex-col overflow-hidden bg-white/90 backdrop-blur-sm rounded-2xl shadow-soft border border-slate-200/60">
        <NotificationPermission />
        <SocketSync />
        <CallProvider />
        {children}
        <NewMessageToastContainer />
      </main>
    </div>
  );
}
