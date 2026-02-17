"use client";

import dynamic from "next/dynamic";
import MessageBubble from "@/components/chat/MessageBubble";
import MessageInput from "@/components/chat/MessageInput";
import { useCalls } from "@/hooks/useCalls";
import { useChat } from "@/hooks/useChats";
import { useMessages, useMessageSearch } from "@/hooks/useMessages";
import { useSocket } from "@/hooks/useSocket";
import { api } from "@/lib/api";
import { useAuthStore } from "@/store/authStore";
import { useCallStore } from "@/store/callStore";
import { useChatStore } from "@/store/chatStore";
import { usePresenceStore } from "@/store/presenceStore";
import type { CallLogItem } from "@/types/call";
import type { ChatWithDetails, MessageWithSender } from "@/types/chat";
import { Info, MessageCircle, Phone, Search, Video, X } from "lucide-react";
import Image from "next/image";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence } from "framer-motion";

const MediaViewer = dynamic(() => import("@/components/chat/MediaViewer"), { ssr: false });
const ForwardModal = dynamic(() => import("@/components/chat/ForwardModal"), { ssr: false });
const CallEntryBubble = dynamic(() => import("@/components/chat/CallEntryBubble"), { ssr: false });

type ChatTimelineEntry =
  | { type: "message"; id: string; timestamp: string; data: MessageWithSender }
  | { type: "call"; id: string; timestamp: string; data: CallLogItem };

function getChatTitle(chat: ChatWithDetails | undefined, currentUserId: string): string {
  if (!chat) return "Chat";
  if (chat.name) return chat.name;
  const other = chat.members?.find((m) => m.userId !== currentUserId);
  return other?.user?.username ?? "Chat";
}

function formatLastSeen(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const mins = Math.floor(diffMs / 60000);
  const hours = Math.floor(diffMs / 3600000);
  if (diffMs < 60000) return "Last seen just now";
  if (mins === 1) return "Last seen 1 min ago";
  if (diffMs < 3600000) return `Last seen ${mins} min ago`;
  if (hours === 1) return "Last seen 1 hr ago";
  if (diffMs < 86400000) return `Last seen ${hours} hr ago`;
  if (diffMs < 172800000) return "Last seen yesterday";
  return `Last seen ${d.toLocaleDateString()}`;
}

export default function ChatThreadPage() {
  const params = useParams();
  const chatId = params.chatId as string;
  const user = useAuthStore((s) => s.user);
  const { socket, isConnected } = useSocket();
  const { data: chat } = useChat(chatId);
  const { data: messagesData, isLoading: messagesLoading } = useMessages(chatId);
  const { data: callsData } = useCalls(chatId);
  const setActiveChatId = useChatStore((s) => s.setActiveChatId);
  const setMessages = useChatStore((s) => s.setMessages);
  const updateMessageInChat = useChatStore((s) => s.updateMessageInChat);
  const messagesByChat = useChatStore((s) => s.messagesByChat);
  const deliveredMessageIds = useChatStore((s) => s.deliveredMessageIds);
  const toggleRightSidebar = useChatStore((s) => s.toggleRightSidebar);
  const activeCall = useCallStore((s) => s.activeCall);
  const incomingCall = useCallStore((s) => s.incomingCall);
  const isOnline = usePresenceStore((s) => s.isOnline);
  const getLastSeen = usePresenceStore((s) => s.getLastSeen);
  const getTypingUserIds = usePresenceStore((s) => s.getTypingUserIds);
  const bottomRef = useRef<HTMLDivElement>(null);
  const messageRefsMap = useRef<Record<string, HTMLDivElement | null>>({});
  const [searchQuery, setSearchQuery] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const [highlightMessageId, setHighlightMessageId] = useState<string | null>(null);
  const [replyingTo, setReplyingTo] = useState<MessageWithSender | null>(null);
  const [forwardMessage, setForwardMessage] = useState<MessageWithSender | null>(null);
  const [openMediaIndex, setOpenMediaIndex] = useState<number | null>(null);
  const { data: searchData, isFetching: searchFetching } = useMessageSearch(searchQuery, chatId);
  const searchResults = searchData?.messages ?? [];

  const otherMember = chat?.members?.find((m) => m.userId !== user?.id);
  const otherUserId = otherMember?.userId;
  const isOtherOnline = otherUserId ? isOnline(otherUserId) : false;
  const otherLastSeen = otherUserId ? getLastSeen(otherUserId) : undefined;
  const typingUserIds = getTypingUserIds(chatId);
  const typingNames = typingUserIds
    .map((id) => chat?.members?.find((m) => m.userId === id)?.user?.username ?? "Someone")
    .filter(Boolean);
  const typingLabel =
    typingNames.length === 0
      ? null
      : typingNames.length === 1
        ? `${typingNames[0]} is typing…`
        : typingNames.length === 2
          ? `${typingNames[0]} and ${typingNames[1]} are typing…`
          : "Several people are typing…";

  const displayMessages: MessageWithSender[] = messagesByChat[chatId] ?? [];
  const callsForChat: CallLogItem[] = useMemo(() => {
    const list = callsData?.pages?.flatMap((p) => p.calls) ?? [];
    return [...list].reverse();
  }, [callsData?.pages]);
  const displayEntries: ChatTimelineEntry[] = useMemo(() => {
    const messageEntries: ChatTimelineEntry[] = displayMessages.map((m) => ({
      type: "message" as const,
      id: m.id,
      timestamp: m.createdAt,
      data: m,
    }));
    const callEntries: ChatTimelineEntry[] = callsForChat.map((c) => ({
      type: "call" as const,
      id: `call-${c.id}`,
      timestamp: c.startedAt,
      data: c,
    }));
    return [...messageEntries, ...callEntries].sort(
      (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );
  }, [displayMessages, callsForChat]);
  const mediaMessages = displayMessages.filter(
    (m) => (m.type === "IMAGE" || m.type === "VIDEO") && m.fileUrl
  );

  const handleOpenMedia = useCallback((message: MessageWithSender) => {
    const index = mediaMessages.findIndex((m) => m.id === message.id);
    if (index >= 0) setOpenMediaIndex(index);
  }, [mediaMessages]);

  function getMessageStatus(msg: MessageWithSender): "sent" | "delivered" | "read" | undefined {
    if (msg.senderId !== user?.id) return undefined;
    if (msg.reads && msg.reads.length > 0) return "read";
    if (deliveredMessageIds.has(msg.id)) return "delivered";
    return "sent";
  }

  function getAvatarForMessage(msg: MessageWithSender): string | null {
    return msg.sender?.avatarUrl ?? null;
  }

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

  // Mark last message as read when viewing chat (if from someone else)
  const lastMessageId =
    displayMessages.length > 0 ? (displayMessages[displayMessages.length - 1]?.id ?? null) : null;
  useEffect(() => {
    if (!socket || !chatId || !user || !lastMessageId) return;
    const list = useChatStore.getState().messagesByChat[chatId] ?? [];
    const last = list[list.length - 1];
    if (!last || last.senderId === user.id) return;
    if (last.reads?.some((r) => r.userId === user.id)) return;
    socket.emit("mark_read", { messageId: lastMessageId });
  }, [socket, chatId, user, lastMessageId]);

  useEffect(() => {
    if (!messagesData?.pages?.length || !chatId) return;
    const flat = messagesData.pages.flatMap((p) => p.messages);
    const chronological = [...flat].reverse();
    setMessages(chatId, chronological);
  }, [messagesData, chatId, setMessages]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [displayEntries.length]);

  useEffect(() => {
    if (!highlightMessageId) return;
    const el = messageRefsMap.current[highlightMessageId];
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "center" });
      const t = setTimeout(() => setHighlightMessageId(null), 2000);
      return () => clearTimeout(t);
    }
  }, [highlightMessageId]);

  const setMessageRef = useCallback((id: string, el: HTMLDivElement | null) => {
    messageRefsMap.current[id] = el;
  }, []);

  const handleEditMessage = useCallback(
    async (message: MessageWithSender, newContent: string) => {
      try {
        const updated = await api.put<MessageWithSender>(`/api/messages/${message.id}`, { content: newContent });
        updateMessageInChat(message.chatId, message.id, updated);
      } catch {
        // error could be shown via toast
      }
    },
    [updateMessageInChat]
  );

  const removeMessageFromChat = useChatStore((s) => s.removeMessageFromChat);

  const handleDeleteForMe = useCallback(
    async (message: MessageWithSender) => {
      try {
        await api.delete(`/api/messages/${message.id}?scope=me`);
        removeMessageFromChat(message.chatId, message.id);
      } catch {
        // error could be shown via toast
      }
    },
    [removeMessageFromChat]
  );

  const handleDeleteForEveryone = useCallback(
    async (message: MessageWithSender) => {
      if (!confirm("Delete this message for everyone? This cannot be undone.")) return;
      try {
        await api.delete(`/api/messages/${message.id}?scope=everyone`);
        removeMessageFromChat(message.chatId, message.id);
      } catch {
        // error could be shown via toast
      }
    },
    [removeMessageFromChat]
  );

  const canCall =
    chat?.type === "DIRECT" &&
    otherUserId &&
    isConnected &&
    !activeCall &&
    !incomingCall;

  const handleStartCall = (callType: "video" | "audio") => {
    if (!socket || !chatId || !canCall) return;
    socket.emit("call_initiate", { chatId, callType });
  };

  if (!user) return null;

  const title = getChatTitle(chat, user.id);
  const otherAvatar = otherMember?.user?.avatarUrl ?? null;

  return (
    <div className="flex flex-col h-full bg-card rounded-2xl overflow-hidden shadow-surface border border-border">
      {/* Header */}
      <header className="flex items-center gap-3 px-5 py-3.5 border-b border-border bg-muted/80 backdrop-blur-md shrink-0">
        <div className="w-11 h-11 rounded-full bg-muted flex-shrink-0 overflow-hidden ring-2 ring-background shadow-inner flex items-center justify-center">
          {otherAvatar ? (
            <Image src={otherAvatar} alt="" width={44} height={44} className="w-full h-full object-cover" />
          ) : (
          <span className="text-base font-semibold text-muted-foreground">
            {title.slice(0, 1).toUpperCase()}
          </span>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <h1 className="font-semibold text-foreground truncate text-title tracking-tight">{title}</h1>
          <p className="text-xs text-muted-foreground min-h-[1.25rem] mt-0.5">
            {typingLabel ? (
              <span className="text-primary-500 font-medium italic">{typingLabel}</span>
            ) : chat?.type === "DIRECT" && otherUserId && isConnected ? (
              isOtherOnline ? (
                <span className="inline-flex items-center gap-1.5 text-emerald-600 font-medium">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Online
                </span>
              ) : otherLastSeen ? (
                formatLastSeen(otherLastSeen)
              ) : (
                <span className="text-muted-foreground font-medium">Offline</span>
              )
            ) : chat?.type === "GROUP" && isConnected ? (
              `${chat.members.length} members`
            ) : null}
          </p>
        </div>
        <div className="flex items-center gap-1">
          {searchOpen ? (
            <div className="flex items-center gap-1 flex-1 max-w-[200px]">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search messages…"
                className="flex-1 min-w-0 rounded-lg border border-input px-2.5 py-1.5 text-sm text-foreground placeholder-muted-foreground bg-background focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all duration-normal"
                autoFocus
              />
              <button
                type="button"
                onClick={() => { setSearchOpen(false); setSearchQuery(""); }}
                className="p-1.5 rounded-lg text-muted-foreground hover:bg-muted transition-colors duration-normal"
                aria-label="Close search"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setSearchOpen(true)}
              className="p-2.5 rounded-xl text-muted-foreground hover:bg-muted hover:text-foreground transition-all duration-normal"
              aria-label="Search messages"
            >
              <Search className="w-5 h-5" />
            </button>
          )}
          <button
            type="button"
            disabled={!canCall}
            onClick={() => handleStartCall("video")}
            className="p-2.5 rounded-xl text-muted-foreground hover:bg-muted hover:text-foreground disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-normal"
            aria-label="Video call"
          >
            <Video className="w-5 h-5" />
          </button>
          <button
            type="button"
            disabled={!canCall}
            onClick={() => handleStartCall("audio")}
            className="p-2.5 rounded-xl text-muted-foreground hover:bg-muted hover:text-foreground disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-normal"
            aria-label="Audio call"
          >
            <Phone className="w-5 h-5" />
          </button>
          <button
            type="button"
            onClick={toggleRightSidebar}
            className="p-2.5 rounded-xl text-muted-foreground hover:bg-muted hover:text-foreground transition-all duration-normal"
            aria-label="Chat info"
          >
            <Info className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* Search results dropdown */}
      {searchOpen && searchQuery.trim().length >= 1 && (
        <div className="shrink-0 border-b border-border bg-card max-h-48 overflow-y-auto">
          {searchFetching ? (
            <p className="px-4 py-3 text-sm text-muted-foreground">Searching…</p>
          ) : searchResults.length === 0 ? (
            <p className="px-4 py-3 text-sm text-muted-foreground">No results</p>
          ) : (
            <ul className="py-1">
              {searchResults.map((msg) => (
                <li key={msg.id}>
                  <button
                    type="button"
                    onClick={() => {
                      setHighlightMessageId(msg.id);
                      setSearchOpen(false);
                      setSearchQuery("");
                    }}
                    className="w-full text-left px-4 py-2 hover:bg-muted flex flex-col gap-0.5"
                  >
                    <span className="text-xs text-muted-foreground">
                      {msg.sender.username} · {new Date(msg.createdAt).toLocaleString()}
                    </span>
                    <span className="text-sm text-foreground truncate">
                      {msg.type === "TEXT"
                        ? (msg.content ?? "")
                        : msg.type === "IMAGE"
                          ? "📷 Photo"
                          : msg.type === "VIDEO"
                            ? "🎬 Video"
                            : "📎 File"}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {/* Messages area */}
      <div className="flex-1 overflow-y-auto scrollbar-thin px-4 py-5 flex flex-col gap-2 min-h-0 bg-gradient-to-b from-muted/30 to-background">
        {messagesLoading && displayMessages.length === 0 && (
          <div className="flex flex-col gap-3 py-4">
            {[0, 1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className={`flex gap-2.5 ${i % 2 === 0 ? "justify-start" : "justify-end"}`}
              >
                {i % 2 === 0 && (
                  <div className="w-9 h-9 rounded-full bg-muted animate-pulse flex-shrink-0" />
                )}
                <div
                  className={`rounded-2xl px-4 py-3 max-w-[70%] space-y-2 bg-muted ${
                    i % 2 === 0
                      ? "rounded-bl-md"
                      : "rounded-br-md"
                  }`}
                >
                  <div
                    className={`h-3 rounded bg-muted animate-pulse ${
                      i % 2 === 0 ? "w-32" : "w-40 ml-auto"
                    }`}
                  />
                  <div
                    className={`h-3 rounded bg-muted animate-pulse ${
                      i % 2 === 0 ? "w-48" : "w-56 ml-auto"
                    }`}
                  />
                </div>
                {i % 2 === 1 && (
                  <div className="w-9 h-9 rounded-full bg-muted animate-pulse flex-shrink-0" />
                )}
              </div>
            ))}
          </div>
        )}
        {!messagesLoading && displayEntries.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 gap-3 text-center">
            <div className="w-14 h-14 rounded-2xl bg-muted flex items-center justify-center">
              <MessageCircle className="w-7 h-7 text-muted-foreground" />
            </div>
            <p className="text-foreground font-medium">No messages yet</p>
            <p className="text-sm text-muted-foreground max-w-[220px]">Send a message to start the conversation.</p>
          </div>
        )}
        {displayEntries.map((entry) => {
          if (entry.type === "message") {
            const msg = entry.data;
            const isOwn = user ? (String(msg.senderId) === String(user.id) || msg.sender?.id === user.id) : false;
            return (
              <div
                key={entry.id}
                ref={(el) => setMessageRef(msg.id, el)}
                className={`w-full flex ${isOwn ? "justify-end" : "justify-start"} ${highlightMessageId === msg.id ? "ring-2 ring-primary-400 ring-inset rounded-2xl animate-pulse" : ""}`}
              >
                <div className="w-fit max-w-[85%]">
                  <MessageBubble
                    message={msg}
                    isOwn={isOwn}
                    showSender={chat?.type === "GROUP"}
                    status={getMessageStatus(msg)}
                    showAvatar
                    avatarUrl={getAvatarForMessage(msg)}
                    currentUserId={user?.id}
                    onReply={(m) => setReplyingTo(m)}
                    onEdit={handleEditMessage}
                    onForward={(m) => setForwardMessage(m)}
                    onDeleteForMe={handleDeleteForMe}
                    onDeleteForEveryone={handleDeleteForEveryone}
                    onOpenMedia={handleOpenMedia}
                  />
                </div>
              </div>
            );
          }
          return (
            <div key={entry.id} className="w-full">
              <CallEntryBubble
                call={entry.data}
                currentUserId={user!.id}
                onCallAgain={handleStartCall}
              />
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      <MessageInput
        chatId={chatId}
        disabled={!isConnected}
        replyingTo={replyingTo}
        onCancelReply={() => setReplyingTo(null)}
      />

      <AnimatePresence>
        {forwardMessage && user && (
          <ForwardModal
            key="forward"
            message={forwardMessage}
            currentChatId={chatId}
            currentUserId={user.id}
            onClose={() => setForwardMessage(null)}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {openMediaIndex !== null && mediaMessages.length > 0 && (
          <MediaViewer
            key="media-viewer"
            mediaMessages={mediaMessages}
            initialIndex={openMediaIndex}
            onClose={() => setOpenMediaIndex(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
