"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, Loader2, Smile, Paperclip, X } from "lucide-react";
import { useAuthStore } from "@/store/authStore";
import { useChatStore } from "@/store/chatStore";
import { useSettingsStore } from "@/store/settingsStore";
import { useSocket } from "@/hooks/useSocket";
import { uploadFile } from "@/lib/api";
import type { MessageWithSender } from "@/types/chat";

const TYPING_THROTTLE_MS = 1500;
const TYPING_DEBOUNCE_MS = 2000;

const IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/gif", "image/webp"]);

const MESSAGE_EMOJIS = [
  "😀", "😂", "😍", "😢", "😮", "😎",
  "👍", "👎", "👏", "🙏", "💪", "✨",
  "❤️", "💔", "🔥", "⭐", "🎉", "🎊",
  "👋", "✅", "❌", "💯", "🚀", "💡"
];

export default function MessageInput({
  chatId,
  disabled,
  replyingTo,
  onCancelReply,
}: {
  chatId: string;
  onFileSelect?: (file: File) => void;
  disabled?: boolean;
  replyingTo?: MessageWithSender | null;
  onCancelReply?: () => void;
}) {
  const [text, setText] = useState("");
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [emojiPickerOpen, setEmojiPickerOpen] = useState(false);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const emojiPickerRef = useRef<HTMLDivElement>(null);
  const user = useAuthStore((s) => s.user);
  const enterToSend = useSettingsStore((s) => s.enterToSend);
  const { socket } = useSocket();
  const sendMessageOptimistic = useChatStore((s) => s.sendMessageOptimistic);
  const lastTypingEmitRef = useRef<number>(0);
  const typingStopTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const emitTypingStart = useCallback(() => {
    if (!socket || !chatId || disabled) return;
    const now = Date.now();
    if (now - lastTypingEmitRef.current >= TYPING_THROTTLE_MS) {
      lastTypingEmitRef.current = now;
      socket.emit("typing_start", chatId);
    }
  }, [socket, chatId, disabled]);

  const emitTypingStop = useCallback(() => {
    if (!socket || !chatId) return;
    if (typingStopTimerRef.current) {
      clearTimeout(typingStopTimerRef.current);
      typingStopTimerRef.current = null;
    }
    socket.emit("typing_stop", chatId);
  }, [socket, chatId]);

  useEffect(() => {
    return () => {
      if (typingStopTimerRef.current) {
        clearTimeout(typingStopTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (!emojiPickerOpen) return;
    const close = (e: MouseEvent) => {
      if (emojiPickerRef.current && !emojiPickerRef.current.contains(e.target as Node)) {
        setEmojiPickerOpen(false);
      }
    };
    document.addEventListener("click", close);
    return () => document.removeEventListener("click", close);
  }, [emojiPickerOpen]);

  const insertEmoji = useCallback((emoji: string) => {
    setText((prev) => prev + emoji);
    setEmojiPickerOpen(false);
    inputRef.current?.focus();
  }, []);

  const emitMessage = useCallback(
    (payload: { type: string; content?: string | null; fileUrl?: string | null; replyToId?: string | null }) => {
      if (!user || !socket) return;
      const sender = {
        id: user.id,
        username: user.username,
        avatarUrl: user.avatarUrl ?? null,
      };
      const tempId = `temp-${Date.now()}`;
      const replyTo = replyingTo
        ? {
            id: replyingTo.id,
            content: replyingTo.content,
            senderId: replyingTo.senderId,
            sender: replyingTo.sender,
          }
        : undefined;
      sendMessageOptimistic(chatId, tempId, { ...payload, replyToId: payload.replyToId ?? undefined, replyTo }, sender);
      socket.emit("send_message", { chatId, ...payload });
    },
    [chatId, user, socket, sendMessageOptimistic, replyingTo]
  );

  const sendMessage = useCallback(() => {
    const trimmed = text.trim();
    if (!trimmed || !user || !socket || disabled) return;
    const replyToId = replyingTo?.id ?? null;
    emitMessage({ type: "TEXT", content: trimmed, replyToId });
    setText("");
    onCancelReply?.();
  }, [text, user, socket, disabled, replyingTo, emitMessage, onCancelReply]);

  const handleFileSelect = useCallback(
    async (file: File) => {
      if (!user || !socket || disabled || uploading) return;
      setUploading(true);
      setUploadError(null);
      try {
        const { url } = await uploadFile(file);
        const type = IMAGE_TYPES.has(file.type) ? "IMAGE" : "FILE";
        const content = type === "FILE" ? file.name : null;
        const replyToId = replyingTo?.id ?? null;
        emitMessage({ type, fileUrl: url, content, replyToId });
        onCancelReply?.();
      } catch {
        setUploadError("Failed to upload file. Try again.");
        setTimeout(() => setUploadError(null), 5000);
      } finally {
        setUploading(false);
      }
    },
    [user, socket, disabled, uploading, replyingTo, emitMessage, onCancelReply]
  );

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      if (enterToSend) {
        if (!e.shiftKey) {
          e.preventDefault();
          sendMessage();
        }
        // Shift+Enter: allow default (newline)
      } else {
        // Enter to send is off: Enter = newline only
        if (e.ctrlKey || e.metaKey) {
          e.preventDefault();
          sendMessage();
        }
        // Plain Enter: allow default (newline)
      }
    } else {
      emitTypingStart();
      if (typingStopTimerRef.current) {
        clearTimeout(typingStopTimerRef.current);
        typingStopTimerRef.current = null;
      }
      typingStopTimerRef.current = setTimeout(() => {
        emitTypingStop();
        typingStopTimerRef.current = null;
      }, TYPING_DEBOUNCE_MS);
    }
  };

  const handleFocus = () => {
    emitTypingStart();
  };

  const handleBlur = () => {
    if (typingStopTimerRef.current) {
      clearTimeout(typingStopTimerRef.current);
      typingStopTimerRef.current = null;
    }
    emitTypingStop();
  };

  const handleFileClick = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*,.pdf,.doc,.docx,.txt";
    input.onchange = () => {
      const file = input.files?.[0];
      if (file) handleFileSelect(file);
    };
    input.click();
  };

  const replyPreview =
    replyingTo?.type === "TEXT"
      ? (replyingTo.content ?? "").slice(0, 50) + ((replyingTo.content?.length ?? 0) > 50 ? "…" : "")
      : replyingTo?.type === "IMAGE"
        ? "Photo"
        : "File";

  return (
    <div className="flex flex-col gap-1 px-4 py-3 bg-slate-50/90 dark:bg-slate-800/90 backdrop-blur-md border-t border-slate-200/70 dark:border-slate-600/70 rounded-b-2xl">
      {uploadError && (
        <p role="alert" className="text-sm text-rose-600 dark:text-rose-400 px-1 py-0.5">
          {uploadError}
        </p>
      )}
      {replyingTo && (
        <div className="flex items-center gap-2 px-2 py-1.5 rounded-lg bg-slate-200/60 dark:bg-slate-600/60 border border-slate-200/80 dark:border-slate-500/80">
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-slate-600 dark:text-slate-300">Replying to {replyingTo.sender.username}</p>
            <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{replyPreview}</p>
          </div>
          <button
            type="button"
            onClick={onCancelReply}
            className="p-1 rounded text-slate-500 dark:text-slate-400 hover:bg-slate-300/80 dark:hover:bg-slate-500/80"
            aria-label="Cancel reply"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}
      <div className="flex items-end gap-2.5">
      <motion.button
        type="button"
        onClick={handleFileClick}
        disabled={disabled || uploading}
        aria-busy={uploading}
        aria-label="Attach file"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className="p-2.5 rounded-xl text-slate-500 dark:text-slate-400 hover:bg-slate-200/80 dark:hover:bg-slate-600/80 hover:text-slate-700 dark:hover:text-slate-200 disabled:opacity-50 transition-colors duration-200"
      >
        {uploading ? (
          <Loader2 className="w-5 h-5 animate-spin" />
        ) : (
          <Paperclip className="w-5 h-5" />
        )}
      </motion.button>
      <textarea
        ref={inputRef}
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={handleKeyDown}
        onFocus={handleFocus}
        onBlur={handleBlur}
        placeholder={enterToSend ? "Type a message…" : "Type a message… (Ctrl+Enter to send)"}
        aria-description={enterToSend ? "Press Enter to send, Shift+Enter for new line" : "Press Ctrl+Enter to send"}
        rows={1}
        disabled={disabled}
        className="flex-1 resize-none rounded-xl bg-white dark:bg-slate-700 border border-slate-200/80 dark:border-slate-500 px-4 py-2.5 text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-400/50 min-h-[44px] max-h-32 disabled:opacity-50 transition-all duration-200 shadow-inner"
      />
      <div className="relative">
        <motion.button
          type="button"
          onClick={(e) => { e.stopPropagation(); setEmojiPickerOpen(!emojiPickerOpen); }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="p-2.5 rounded-xl text-slate-500 dark:text-slate-400 hover:bg-slate-200/80 dark:hover:bg-slate-600/80 hover:text-slate-700 dark:hover:text-slate-200 disabled:opacity-50 transition-colors duration-200"
          aria-label="Emoji"
        >
          <Smile className="w-5 h-5" />
        </motion.button>
        
        <AnimatePresence>
          {emojiPickerOpen && (
            <motion.div
              ref={emojiPickerRef}
              initial={{ opacity: 0, scale: 0.9, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 10 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              className="absolute bottom-full right-0 mb-3 p-4 bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-slate-200/80 dark:border-slate-600 z-50 backdrop-blur-sm"
              style={{ maxHeight: "320px", overflowY: "auto" }}
            >
              <div className="mb-2">
                <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Pick an emoji</p>
              </div>
              <div className="grid grid-cols-6 gap-2 w-[280px]">
                {MESSAGE_EMOJIS.map((emoji) => (
                  <motion.button
                    key={emoji}
                    type="button"
                    onClick={() => insertEmoji(emoji)}
                    whileHover={{ scale: 1.15 }}
                    whileTap={{ scale: 0.95 }}
                    className="flex items-center justify-center w-10 h-10 hover:bg-slate-100 dark:hover:bg-slate-600 rounded-xl text-2xl transition-colors duration-150"
                  >
                    {emoji}
                  </motion.button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      <motion.button
        type="button"
        onClick={sendMessage}
        disabled={!text.trim() || disabled}
        whileHover={text.trim() && !disabled ? { scale: 1.06 } : {}}
        whileTap={text.trim() && !disabled ? { scale: 0.96 } : {}}
        className="p-3 rounded-full bg-gradient-to-br from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 disabled:opacity-50 disabled:cursor-not-allowed text-white shadow-soft hover:shadow-glow transition-shadow duration-200"
        aria-label="Send"
      >
        <Send className="w-5 h-5" />
      </motion.button>
      </div>
    </div>
  );
}
