"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import type { MessageWithSender } from "@/types/chat";

export type MessageStatus = "sent" | "delivered" | "read";

export default function MessageBubble({
  message,
  isOwn,
  showSender,
  status,
  showAvatar = true,
  avatarUrl,
}: {
  message: MessageWithSender;
  isOwn: boolean;
  showSender?: boolean;
  /** For own messages: sent / delivered / read */
  status?: MessageStatus;
  showAvatar?: boolean;
  avatarUrl?: string | null;
}) {
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
      className={`flex gap-2 mb-3 ${isOwn ? "justify-end flex-row-reverse" : "justify-start"}`}
    >
      {showAvatar && (
        <div className="w-9 h-9 rounded-full bg-slate-200 flex-shrink-0 overflow-hidden flex items-center justify-center ring-2 ring-white shadow-inner">
          {avatarUrl ? (
            <Image src={avatarUrl} alt="" width={36} height={36} className="w-full h-full object-cover" unoptimized />
          ) : (
            <span className="text-sm font-semibold text-slate-500">
              {(message.sender?.username ?? "?").slice(0, 1).toUpperCase()}
            </span>
          )}
        </div>
      )}
      <div className={`flex flex-col items-${isOwn ? "end" : "start"} max-w-[75%]`}>
        <div
          className={`rounded-2xl px-4 py-2.5 transition-shadow duration-200 ${
            isOwn
              ? "bg-gradient-to-br from-green-500 to-green-600 text-white rounded-br-md shadow-soft hover:shadow-glow-green"
              : "bg-white text-slate-800 rounded-bl-md border border-slate-200/80 shadow-soft"
          }`}
        >
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
