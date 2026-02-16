"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { MessageCircle, LogOut, User, Users, Settings } from "lucide-react";
import { Spinner } from "@/components/ui/Spinner";
import { useAuthStore } from "@/store/authStore";
import { useChatStore } from "@/store/chatStore";
import { useContactRequests } from "@/hooks/useContacts";
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
  const { data: contactRequests = [] } = useContactRequests();
  const pendingRequestsCount = contactRequests.length;

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
      <div className="min-h-screen flex items-center justify-center app-shell bg-background">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary-500/20 animate-pulse" />
          <span className="text-sm font-medium text-muted-foreground">Loading...</span>
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
      <div className="h-screen flex app-shell bg-background">
        <ChatListSidebar />
        <main className="flex-1 flex flex-col overflow-hidden min-w-0 glass rounded-l-2xl shadow-surface border border-border">
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
    <div className="h-screen flex app-shell bg-background">
      <aside className="w-72 glass border-r border-border flex flex-col rounded-r-2xl shadow-surface">
        <div className="p-4 border-b border-border flex items-center gap-3">
          <div className="p-2.5 bg-gradient-to-br from-primary-400 to-primary-600 rounded-xl shadow-sm">
            <MessageCircle className="w-5 h-5 text-primary-foreground" />
          </div>
          <span className="font-semibold text-foreground">Let&apos;sChat</span>
        </div>

        <nav className="flex-1 p-2 overflow-y-auto">
          <Link
            href="/chat"
            className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-normal ${
              pathname === "/chat"
                ? "bg-primary-500 text-primary-foreground shadow-sm"
                : "text-muted-foreground hover:bg-muted"
            }`}
          >
            <MessageCircle className="w-5 h-5" />
            <span>Chats</span>
          </Link>
          <Link
            href="/contacts"
            className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-normal relative ${
              pathname === "/contacts"
                ? "bg-primary-500 text-primary-foreground shadow-sm"
                : "text-muted-foreground hover:bg-muted"
            }`}
          >
            <Users className="w-5 h-5" />
            <span>Contacts</span>
            {pendingRequestsCount > 0 && (
              <span
                className={`absolute right-3 top-1/2 -translate-y-1/2 min-w-[1.25rem] h-5 px-1.5 flex items-center justify-center rounded-full text-xs font-semibold ${
                  pathname === "/contacts"
                    ? "bg-primary-foreground/20 text-primary-foreground"
                    : "bg-primary-500 text-primary-foreground"
                }`}
              >
                {pendingRequestsCount > 99 ? "99+" : pendingRequestsCount}
              </span>
            )}
          </Link>
          <Link
            href="/profile"
            className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-normal ${
              pathname === "/profile"
                ? "bg-primary-500 text-primary-foreground shadow-sm"
                : "text-muted-foreground hover:bg-muted"
            }`}
          >
            <User className="w-5 h-5" />
            <span>Profile</span>
          </Link>
          <Link
            href="/settings"
            className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-normal ${
              pathname === "/settings"
                ? "bg-primary-500 text-primary-foreground shadow-sm"
                : "text-muted-foreground hover:bg-muted"
            }`}
          >
            <Settings className="w-5 h-5" />
            <span>Settings</span>
          </Link>
        </nav>

        <div className="p-2 border-t border-border">
          <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-muted/80 mb-2">
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary-100 to-primary-200 dark:from-primary-900/50 dark:to-primary-800/50 flex items-center justify-center ring-2 ring-background shadow-inner">
              <User className="w-5 h-5 text-primary-600 dark:text-primary-400" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground truncate">
                {user.username}
              </p>
              <p className="text-xs text-muted-foreground truncate">{user.email}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-muted-foreground hover:bg-rose-50 dark:hover:bg-rose-900/30 hover:text-rose-600 dark:hover:text-rose-400 transition-all duration-normal"
          >
            <LogOut className="w-5 h-5" />
            <span>Log out</span>
          </button>
        </div>
      </aside>

      <main className="flex-1 flex flex-col overflow-hidden glass rounded-2xl shadow-surface border border-border">
        <NotificationPermission />
        <SocketSync />
        <CallProvider />
        {children}
        <NewMessageToastContainer />
      </main>
    </div>
  );
}
