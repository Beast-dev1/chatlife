"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { motion } from "framer-motion";
import { Send, Loader2, Smile, Paperclip, X } from "lucide-react";
import { useAuthStore } from "@/store/authStore";
import { useChatStore } from "@/store/chatStore";
import { useSocket } from "@/hooks/useSocket";
import { uploadFile } from "@/lib/api";
import type { MessageWithSender } from "@/types/chat";

const TYPING_THROTTLE_MS = 1500;
const TYPING_DEBOUNCE_MS = 2000;

const IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/gif", "image/webp"]);

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
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const user = useAuthStore((s) => s.user);
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

  const emitMessage = useCallback(
    (payload: { type: string; content?: string | null; fileUrl?: string | null; replyToId?: string | null }) => {
      if (!user || !socket) return;
      const sender = {
        id: user.id,
        username: user.username,
        avatarUrl: user.avatarUrl ?? null,
      };
      const tempId = `temp-${Date.now()}`;
      sendMessageOptimistic(chatId, tempId, payload, sender);
      socket.emit("send_message", { chatId, ...payload });
    },
    [chatId, user, socket, sendMessageOptimistic]
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
      try {
        const { url } = await uploadFile(file);
        const type = IMAGE_TYPES.has(file.type) ? "IMAGE" : "FILE";
        const content = type === "FILE" ? file.name : null;
        const replyToId = replyingTo?.id ?? null;
        emitMessage({ type, fileUrl: url, content, replyToId });
        onCancelReply?.();
      } catch {
        // error could be shown via toast
      } finally {
        setUploading(false);
      }
    },
    [user, socket, disabled, uploading, replyingTo, emitMessage, onCancelReply]
  );

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
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
    <div className="flex flex-col gap-1 px-4 py-3 bg-slate-50/90 backdrop-blur-md border-t border-slate-200/70 rounded-b-2xl">
      {replyingTo && (
        <div className="flex items-center gap-2 px-2 py-1.5 rounded-lg bg-slate-200/60 border border-slate-200/80">
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-slate-600">Replying to {replyingTo.sender.username}</p>
            <p className="text-xs text-slate-500 truncate">{replyPreview}</p>
          </div>
          <button
            type="button"
            onClick={onCancelReply}
            className="p-1 rounded text-slate-500 hover:bg-slate-300/80"
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
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className="p-2.5 rounded-xl text-slate-500 hover:bg-slate-200/80 hover:text-slate-700 disabled:opacity-50 transition-colors duration-200"
        aria-label="Attach file"
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
        placeholder="Type a message…"
        rows={1}
        disabled={disabled}
        className="flex-1 resize-none rounded-xl bg-white border border-slate-200/80 px-4 py-2.5 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-400/50 min-h-[44px] max-h-32 disabled:opacity-50 transition-all duration-200 shadow-inner"
      />
      <motion.button
        type="button"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className="p-2.5 rounded-xl text-slate-500 hover:bg-slate-200/80 hover:text-slate-700 disabled:opacity-50 transition-colors duration-200"
        aria-label="Emoji"
      >
        <Smile className="w-5 h-5" />
      </motion.button>
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
