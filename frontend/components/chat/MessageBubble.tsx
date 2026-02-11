"use client";

import { useState, useRef, useEffect } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { MoreHorizontal, Reply, Pencil, Check, X, Forward, Trash2, Smile } from "lucide-react";
import { uploadDisplayUrl } from "@/lib/utils";
import type { MessageWithSender } from "@/types/chat";
import { useAddReaction, useRemoveReaction } from "@/hooks/useReactions";

export type MessageStatus = "sent" | "delivered" | "read";

const QUICK_REACTIONS = ["👍", "❤️", "😂", "😮", "😢", "🙏"];

export default function MessageBubble({
  message,
  isOwn,
  showSender,
  status,
  showAvatar = true,
  avatarUrl,
  currentUserId,
  onReply,
  onEdit,
  onForward,
  onDeleteForMe,
  onDeleteForEveryone,
  onOpenMedia,
}: {
  message: MessageWithSender;
  isOwn: boolean;
  showSender?: boolean;
  /** For own messages: sent / delivered / read */
  status?: MessageStatus;
  showAvatar?: boolean;
  avatarUrl?: string | null;
  currentUserId?: string;
  onReply?: (message: MessageWithSender) => void;
  onEdit?: (message: MessageWithSender, newContent: string) => void;
  onForward?: (message: MessageWithSender) => void;
  onDeleteForMe?: (message: MessageWithSender) => void;
  onDeleteForEveryone?: (message: MessageWithSender) => void;
  onOpenMedia?: (message: MessageWithSender) => void;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editContent, setEditContent] = useState("");
  const [emojiPickerOpen, setEmojiPickerOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const emojiPickerRef = useRef<HTMLDivElement>(null);
  const addReaction = useAddReaction(message.id);
  const removeReaction = useRemoveReaction(message.id);

  useEffect(() => {
    if (!menuOpen) return;
    const close = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false);
    };
    document.addEventListener("click", close);
    return () => document.removeEventListener("click", close);
  }, [menuOpen]);

  useEffect(() => {
    if (!emojiPickerOpen) return;
    const close = (e: MouseEvent) => {
      if (emojiPickerRef.current && !emojiPickerRef.current.contains(e.target as Node)) setEmojiPickerOpen(false);
    };
    document.addEventListener("click", close);
    return () => document.removeEventListener("click", close);
  }, [emojiPickerOpen]);

  const handleReaction = (emoji: string) => {
    if (!currentUserId) return;
    const existing = message.reactions?.find((r) => r.userId === currentUserId && r.emoji === emoji);
    if (existing) {
      removeReaction.mutate(emoji);
    } else {
      addReaction.mutate(emoji);
    }
    setEmojiPickerOpen(false);
  };

  // Group reactions by emoji
  const groupedReactions = (message.reactions || []).reduce((acc, reaction) => {
    if (!acc[reaction.emoji]) {
      acc[reaction.emoji] = [];
    }
    acc[reaction.emoji].push(reaction);
    return acc;
  }, {} as Record<string, typeof message.reactions>);
  const isImage = message.type === "IMAGE" && message.fileUrl;
  const isVideo = message.type === "VIDEO" && message.fileUrl;
  const isFile = message.type === "FILE" && message.fileUrl;
  const timeStr = new Date(message.createdAt).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, ease: "easeOut" }}
      className={`w-full flex gap-2.5 mb-3 group/bubble ${isOwn ? "justify-end flex-row-reverse" : "justify-start"}`}
    >
      {showAvatar && (
        <div className="w-9 h-9 rounded-full bg-slate-200/90 dark:bg-slate-600/90 flex-shrink-0 overflow-hidden flex items-center justify-center ring-2 ring-white/80 dark:ring-slate-700/80 shadow-inner">
          {avatarUrl ? (
            <Image src={avatarUrl} alt="" width={36} height={36} className="w-full h-full object-cover" />
          ) : (
            <span className="text-sm font-semibold text-slate-500 dark:text-slate-400">
              {(message.sender?.username ?? "?").slice(0, 1).toUpperCase()}
            </span>
          )}
        </div>
      )}
      <div className={`flex flex-col items-${isOwn ? "end" : "start"} max-w-[78%]`}>
        <div
          className={`relative rounded-2xl px-4 py-2.5 transition-shadow duration-normal ${
            isOwn
              ? "bg-gradient-to-br from-primary-500 to-primary-600 text-white rounded-br-md shadow-surface hover:shadow-glow"
              : "bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-100 rounded-bl-md border border-slate-200/70 dark:border-slate-600 shadow-surface"
          }`}
        >
          {onReply && (
            <div className="absolute top-1 right-1 opacity-0 group-hover/bubble:opacity-100 transition-opacity" ref={menuRef}>
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); setMenuOpen((o) => !o); }}
                className={`p-1 rounded ${isOwn ? "text-white/80 hover:bg-white/20" : "text-slate-400 dark:text-slate-500 hover:bg-slate-200/80 dark:hover:bg-slate-600/80"}`}
                aria-label="Message actions"
              >
                <MoreHorizontal className="w-4 h-4" />
              </button>
              {menuOpen && (
                <div className={`absolute top-full right-0 mt-0.5 py-1 min-w-[140px] rounded-lg border shadow-lg ${
                  isOwn ? "bg-primary-600 border-primary-500" : "bg-white dark:bg-slate-700 border-slate-200 dark:border-slate-600"
                }`}>
                  {onReply && (
                    <button
                      type="button"
                      onClick={() => { onReply(message); setMenuOpen(false); }}
                      className={`w-full flex items-center gap-2 px-3 py-2 text-left text-sm ${isOwn ? "text-white hover:bg-white/20" : "text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-600"}`}
                    >
                      <Reply className="w-4 h-4" />
                      Reply
                    </button>
                  )}
                  {isOwn && onEdit && message.type === "TEXT" && (
                    <button
                      type="button"
                      onClick={() => {
                        setEditContent(message.content ?? "");
                        setEditing(true);
                        setMenuOpen(false);
                      }}
                      className={`w-full flex items-center gap-2 px-3 py-2 text-left text-sm ${isOwn ? "text-white hover:bg-white/20" : "text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-600"}`}
                    >
                      <Pencil className="w-4 h-4" />
                      Edit
                    </button>
                  )}
                  {onForward && (
                    <button
                      type="button"
                      onClick={() => { onForward(message); setMenuOpen(false); }}
                      className={`w-full flex items-center gap-2 px-3 py-2 text-left text-sm ${isOwn ? "text-white hover:bg-white/20" : "text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-600"}`}
                    >
                      <Forward className="w-4 h-4" />
                      Forward
                    </button>
                  )}
                  {(onDeleteForMe || onDeleteForEveryone) && (
                    <>
                      {onDeleteForMe && (
                        <button
                          type="button"
                          onClick={() => { onDeleteForMe(message); setMenuOpen(false); }}
                          className={`w-full flex items-center gap-2 px-3 py-2 text-left text-sm ${isOwn ? "text-red-200 hover:bg-white/20" : "text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30"}`}
                        >
                          <Trash2 className="w-4 h-4" />
                          Delete for me
                        </button>
                      )}
                      {isOwn && onDeleteForEveryone && (
                        <button
                          type="button"
                          onClick={() => { onDeleteForEveryone(message); setMenuOpen(false); }}
                          className={`w-full flex items-center gap-2 px-3 py-2 text-left text-sm ${isOwn ? "text-red-200 hover:bg-white/20" : "text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30"}`}
                        >
                          <Trash2 className="w-4 h-4" />
                          Delete for everyone
                        </button>
                      )}
                    </>
                  )}
                </div>
              )}
            </div>
          )}
          {editing && message.type === "TEXT" ? (
            <div className="flex flex-col gap-1.5">
              <textarea
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                rows={3}
                className={`w-full rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 ${
                  isOwn ? "bg-white/20 text-white placeholder-white/60" : "bg-slate-100 dark:bg-slate-600 text-slate-800 dark:text-slate-100"
                }`}
                placeholder="Edit message…"
              />
              <div className="flex justify-end gap-1">
                <button
                  type="button"
                  onClick={() => { setEditing(false); setEditContent(""); }}
                  className={`p-1.5 rounded text-sm ${isOwn ? "text-white/80 hover:bg-white/20" : "text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-500"}`}
                >
                  <X className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const trimmed = editContent.trim();
                    if (trimmed && onEdit) {
                      onEdit(message, trimmed);
                      setEditing(false);
                    }
                  }}
                  className={`p-1.5 rounded text-sm ${isOwn ? "text-white hover:bg-white/20" : "text-primary-600 dark:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/30"}`}
                >
                  <Check className="w-4 h-4" />
                </button>
              </div>
            </div>
          ) : (
          <>
          {(message.replyTo ?? message.replyToId) && (
            <div
              className={`mb-1.5 pl-2 border-l-2 ${
                isOwn ? "border-white/70 text-white/90" : "border-slate-300 text-slate-500"
              }`}
            >
              <p className="text-xs font-semibold">
                {message.replyTo?.sender?.username ?? "Unknown"}
              </p>
              <p className="text-xs truncate max-w-[200px]">
                {message.replyTo?.content
                  ? message.replyTo.content.slice(0, 60) + (message.replyTo.content.length > 60 ? "…" : "")
                  : "Photo or file"}
              </p>
            </div>
          )}
          {showSender && !isOwn && message.sender && (
            <p className="text-xs font-semibold text-slate-600 mb-0.5 uppercase tracking-wide">
              {message.sender.username}
            </p>
          )}
          {isImage && (
            <button
              type="button"
              onClick={() => onOpenMedia?.(message)}
              className="block rounded-lg overflow-hidden cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary-400 focus:ring-offset-2 text-left"
              aria-label="Open image"
            >
              <Image
                src={uploadDisplayUrl(message.fileUrl)!}
                alt=""
                width={400}
                height={256}
                className="max-w-full max-h-64 object-contain"
              />
            </button>
          )}
          {isVideo && (
            <button
              type="button"
              onClick={() => onOpenMedia?.(message)}
              className="block rounded-lg overflow-hidden cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary-400 focus:ring-offset-2 text-left w-full max-w-[280px]"
              aria-label="Open video"
            >
              <video
                src={uploadDisplayUrl(message.fileUrl)!}
                muted
                playsInline
                className="max-w-full max-h-64 w-full object-contain rounded-lg bg-slate-900"
                preload="metadata"
              />
            </button>
          )}
          {isFile && (
            <a
              href={uploadDisplayUrl(message.fileUrl)!}
              target="_blank"
              rel="noopener noreferrer"
              className={`text-sm underline break-all ${isOwn ? "text-white" : "text-slate-700"}`}
            >
              {message.content || "File"}
            </a>
          )}
          {message.type === "TEXT" && message.content && (
            <p className="text-body whitespace-pre-wrap break-words">{message.content}</p>
          )}
          {message.type !== "TEXT" && !isImage && !isVideo && !isFile && message.content && (
            <p className="text-sm whitespace-pre-wrap break-words">{message.content}</p>
          )}
          </>
          )}
        </div>

        {/* Reactions display */}
        {Object.keys(groupedReactions).length > 0 && (
          <div className={`flex flex-wrap gap-1 mt-1.5 ${isOwn ? "justify-end" : "justify-start"}`}>
            {Object.entries(groupedReactions).map(([emoji, reactions]) => {
              const userReacted = currentUserId && reactions.some((r) => r.userId === currentUserId);
              return (
                <motion.button
                  key={emoji}
                  type="button"
                  onClick={() => handleReaction(emoji)}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                  className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs transition-colors ${
                    userReacted
                      ? "bg-primary-100 border border-primary-300 text-primary-700"
                      : "bg-slate-100 border border-slate-200 text-slate-700 hover:bg-slate-200"
                  }`}
                  title={reactions.map((r) => r.user.username).join(", ")}
                >
                  <span>{emoji}</span>
                  <span className="font-semibold">{reactions.length}</span>
                </motion.button>
              );
            })}
          </div>
        )}

        {/* Emoji picker button and picker */}
        <div className="relative">
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); setEmojiPickerOpen(!emojiPickerOpen); }}
            className={`mt-1.5 p-1.5 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 opacity-0 group-hover/bubble:opacity-100 transition-all duration-normal ${isOwn ? "ml-auto" : ""}`}
            aria-label="Add reaction"
          >
            <Smile className="w-4 h-4" />
          </button>
          
          <AnimatePresence>
            {emojiPickerOpen && (
              <motion.div
                ref={emojiPickerRef}
                initial={{ opacity: 0, scale: 0.9, y: -10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: -10 }}
                transition={{ duration: 0.2, ease: "easeOut" }}
                className={`absolute ${isOwn ? "right-0" : "left-0"} bottom-full mb-2 p-3 bg-white dark:bg-slate-800 rounded-xl shadow-overlay border border-slate-200/80 dark:border-slate-600 z-20 backdrop-blur-sm`}
              >
                <div className="mb-2">
                  <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wide">React</p>
                </div>
                <div className="flex gap-1.5">
                  {QUICK_REACTIONS.map((emoji) => (
                    <motion.button
                      key={emoji}
                      type="button"
                      onClick={() => handleReaction(emoji)}
                      whileHover={{ scale: 1.2, y: -2 }}
                      whileTap={{ scale: 0.9 }}
                      className="flex items-center justify-center w-9 h-9 hover:bg-slate-100 rounded-lg text-xl transition-colors duration-150"
                    >
                      {emoji}
                    </motion.button>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="flex items-center gap-2 mt-1 px-1">
          {isOwn && status && (
            <span
              className="text-xs text-slate-500 capitalize"
              title={status === "read" ? "Read" : status === "delivered" ? "Delivered" : "Sent"}
            >
              {status === "read" ? "Read" : status === "delivered" ? "Delivered" : "Sent"}
            </span>
          )}
          <span className="text-xs text-slate-400">{timeStr}</span>
        </div>
      </div>
    </motion.div>
  );
}
