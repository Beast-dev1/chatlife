"use client";

import { useState, useRef, useEffect } from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import { MoreHorizontal, Reply, Pencil, Check, X, Forward, Trash2 } from "lucide-react";
import type { MessageWithSender } from "@/types/chat";

export type MessageStatus = "sent" | "delivered" | "read";

export default function MessageBubble({
  message,
  isOwn,
  showSender,
  status,
  showAvatar = true,
  avatarUrl,
  onReply,
  onEdit,
  onForward,
  onDeleteForMe,
  onDeleteForEveryone,
}: {
  message: MessageWithSender;
  isOwn: boolean;
  showSender?: boolean;
  /** For own messages: sent / delivered / read */
  status?: MessageStatus;
  showAvatar?: boolean;
  avatarUrl?: string | null;
  onReply?: (message: MessageWithSender) => void;
  onEdit?: (message: MessageWithSender, newContent: string) => void;
  onForward?: (message: MessageWithSender) => void;
  onDeleteForMe?: (message: MessageWithSender) => void;
  onDeleteForEveryone?: (message: MessageWithSender) => void;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editContent, setEditContent] = useState("");
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!menuOpen) return;
    const close = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false);
    };
    document.addEventListener("click", close);
    return () => document.removeEventListener("click", close);
  }, [menuOpen]);
  const isImage = message.type === "IMAGE" && message.fileUrl;
  const isFile = message.type === "FILE" && message.fileUrl;
  const timeStr = new Date(message.createdAt).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, ease: "easeOut" }}
      className={`w-full flex gap-2.5 mb-3 group/bubble ${isOwn ? "justify-end flex-row-reverse" : "justify-start"}`}
    >
      {showAvatar && (
        <div className="w-9 h-9 rounded-full bg-slate-200/90 flex-shrink-0 overflow-hidden flex items-center justify-center ring-2 ring-white/80 shadow-inner">
          {avatarUrl ? (
            <Image src={avatarUrl} alt="" width={36} height={36} className="w-full h-full object-cover" unoptimized />
          ) : (
            <span className="text-sm font-semibold text-slate-500">
              {(message.sender?.username ?? "?").slice(0, 1).toUpperCase()}
            </span>
          )}
        </div>
      )}
      <div className={`flex flex-col items-${isOwn ? "end" : "start"} max-w-[78%]`}>
        <div
          className={`relative rounded-2xl px-4 py-2.5 transition-shadow duration-200 ${
            isOwn
              ? "bg-gradient-to-br from-primary-500 to-primary-600 text-white rounded-br-md shadow-soft hover:shadow-glow"
              : "bg-white text-slate-800 rounded-bl-md border border-slate-200/70 shadow-soft"
          }`}
        >
          {onReply && (
            <div className="absolute top-1 right-1 opacity-0 group-hover/bubble:opacity-100 transition-opacity" ref={menuRef}>
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); setMenuOpen((o) => !o); }}
                className={`p-1 rounded ${isOwn ? "text-white/80 hover:bg-white/20" : "text-slate-400 hover:bg-slate-200/80"}`}
                aria-label="Message actions"
              >
                <MoreHorizontal className="w-4 h-4" />
              </button>
              {menuOpen && (
                <div className={`absolute top-full right-0 mt-0.5 py-1 min-w-[140px] rounded-lg border shadow-lg ${
                  isOwn ? "bg-primary-600 border-primary-500" : "bg-white border-slate-200"
                }`}>
                  {onReply && (
                    <button
                      type="button"
                      onClick={() => { onReply(message); setMenuOpen(false); }}
                      className={`w-full flex items-center gap-2 px-3 py-2 text-left text-sm ${isOwn ? "text-white hover:bg-white/20" : "text-slate-700 hover:bg-slate-100"}`}
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
                      className={`w-full flex items-center gap-2 px-3 py-2 text-left text-sm ${isOwn ? "text-white hover:bg-white/20" : "text-slate-700 hover:bg-slate-100"}`}
                    >
                      <Pencil className="w-4 h-4" />
                      Edit
                    </button>
                  )}
                  {onForward && (
                    <button
                      type="button"
                      onClick={() => { onForward(message); setMenuOpen(false); }}
                      className={`w-full flex items-center gap-2 px-3 py-2 text-left text-sm ${isOwn ? "text-white hover:bg-white/20" : "text-slate-700 hover:bg-slate-100"}`}
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
                          className={`w-full flex items-center gap-2 px-3 py-2 text-left text-sm ${isOwn ? "text-red-200 hover:bg-white/20" : "text-red-600 hover:bg-red-50"}`}
                        >
                          <Trash2 className="w-4 h-4" />
                          Delete for me
                        </button>
                      )}
                      {isOwn && onDeleteForEveryone && (
                        <button
                          type="button"
                          onClick={() => { onDeleteForEveryone(message); setMenuOpen(false); }}
                          className={`w-full flex items-center gap-2 px-3 py-2 text-left text-sm ${isOwn ? "text-red-200 hover:bg-white/20" : "text-red-600 hover:bg-red-50"}`}
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
                  isOwn ? "bg-white/20 text-white placeholder-white/60" : "bg-slate-100 text-slate-800"
                }`}
                placeholder="Edit message…"
              />
              <div className="flex justify-end gap-1">
                <button
                  type="button"
                  onClick={() => { setEditing(false); setEditContent(""); }}
                  className={`p-1.5 rounded text-sm ${isOwn ? "text-white/80 hover:bg-white/20" : "text-slate-500 hover:bg-slate-200"}`}
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
                  className={`p-1.5 rounded text-sm ${isOwn ? "text-white hover:bg-white/20" : "text-primary-600 hover:bg-primary-50"}`}
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
            <a
              href={message.fileUrl!}
              target="_blank"
              rel="noopener noreferrer"
              className="block rounded-lg overflow-hidden"
            >
              <Image
                src={message.fileUrl!}
                alt=""
                width={400}
                height={256}
                className="max-w-full max-h-64 object-contain"
                unoptimized
              />
            </a>
          )}
          {isFile && (
            <a
              href={message.fileUrl!}
              target="_blank"
              rel="noopener noreferrer"
              className={`text-sm underline break-all ${isOwn ? "text-white" : "text-slate-700"}`}
            >
              {message.content || "File"}
            </a>
          )}
          {message.type === "TEXT" && message.content && (
            <p className="text-sm whitespace-pre-wrap break-words">{message.content}</p>
          )}
          {message.type !== "TEXT" && !isImage && !isFile && message.content && (
            <p className="text-sm whitespace-pre-wrap break-words">{message.content}</p>
          )}
          </>
          )}
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
