"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { Send, Loader2, Smile, Image as ImageIcon } from "lucide-react";
import { useAuthStore } from "@/store/authStore";
import { useChatStore } from "@/store/chatStore";
import { useSocket } from "@/hooks/useSocket";
import { uploadFile } from "@/lib/api";

const TYPING_THROTTLE_MS = 1500;
const TYPING_DEBOUNCE_MS = 2000;

const IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/gif", "image/webp"]);

export default function MessageInput({
  chatId,
  disabled,
}: {
  chatId: string;
  onFileSelect?: (file: File) => void;
  disabled?: boolean;
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
    (payload: { type: string; content?: string | null; fileUrl?: string | null }) => {
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
    emitMessage({ type: "TEXT", content: trimmed });
    setText("");
  }, [text, user, socket, disabled, emitMessage]);

  const handleFileSelect = useCallback(
    async (file: File) => {
      if (!user || !socket || disabled || uploading) return;
      setUploading(true);
      try {
        const { url } = await uploadFile(file);
        const type = IMAGE_TYPES.has(file.type) ? "IMAGE" : "FILE";
        const content = type === "FILE" ? file.name : null;
        emitMessage({ type, fileUrl: url, content });
      } catch {
        // error could be shown via toast
      } finally {
        setUploading(false);
      }
    },
    [user, socket, disabled, uploading, emitMessage]
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

  return (
    <div className="flex items-end gap-2 p-3 bg-slate-800/50 border-t border-slate-700/50">
      <button
        type="button"
        className="p-2 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-700/50 disabled:opacity-50"
        aria-label="Voice message"
      >
        <span className="text-lg">🎤</span>
      </button>
      <button
        type="button"
        onClick={handleFileClick}
        disabled={disabled || uploading}
        className="p-2 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-700/50 disabled:opacity-50"
        aria-label="Attach file"
      >
        {uploading ? (
          <Loader2 className="w-5 h-5 animate-spin" />
        ) : (
          <ImageIcon className="w-5 h-5" />
        )}
      </button>
      <button
        type="button"
        className="p-2 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-700/50 disabled:opacity-50"
        aria-label="Sticker"
      >
        <span className="text-lg">😊</span>
      </button>
      <button
        type="button"
        className="p-2 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-700/50 disabled:opacity-50"
        aria-label="GIF"
      >
        <span className="text-xs font-medium text-slate-400">GIF</span>
      </button>
      <textarea
        ref={inputRef}
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={handleKeyDown}
        onFocus={handleFocus}
        onBlur={handleBlur}
        placeholder="Aa"
        rows={1}
        disabled={disabled}
        className="flex-1 resize-none rounded-xl bg-slate-700/50 border border-slate-600 px-4 py-2.5 text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 min-h-[44px] max-h-32 disabled:opacity-50"
      />
      <button
        type="button"
        className="p-2 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-700/50 disabled:opacity-50"
        aria-label="Emoji"
      >
        <Smile className="w-5 h-5" />
      </button>
      <button
        type="button"
        onClick={sendMessage}
        disabled={!text.trim() || disabled}
        className="p-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed text-white"
        aria-label="Send"
      >
        <Send className="w-5 h-5" />
      </button>
    </div>
  );
}
