"use client";

import Image from "next/image";
import type { MessageWithSender } from "@/types/chat";

export type MessageStatus = "sent" | "delivered" | "read";

export default function MessageBubble({
  message,
  isOwn,
  showSender,
  status,
}: {
  message: MessageWithSender;
  isOwn: boolean;
  showSender?: boolean;
  /** For own messages: sent / delivered / read */
  status?: MessageStatus;
}) {
  const isImage = message.type === "IMAGE" && message.fileUrl;
  const isFile = message.type === "FILE" && message.fileUrl;

  return (
    <div className={`flex ${isOwn ? "justify-end" : "justify-start"} mb-2`}>
      <div
        className={`max-w-[75%] rounded-2xl px-4 py-2 ${
          isOwn
            ? "bg-purple-600 text-white rounded-br-md"
            : "bg-slate-700 text-slate-100 rounded-bl-md"
        }`}
      >
        {showSender && !isOwn && (
          <p className="text-xs font-medium text-purple-400 mb-0.5">{message.sender.username}</p>
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
            className="text-sm underline break-all"
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
        <div className="flex items-center justify-end gap-2 mt-1">
          {isOwn && status && (
            <span
              className="text-xs opacity-80 capitalize"
              title={status === "read" ? "Read" : status === "delivered" ? "Delivered" : "Sent"}
            >
              {status === "read" ? "Read" : status === "delivered" ? "Delivered" : "Sent"}
            </span>
          )}
          <p className="text-xs opacity-80">
            {new Date(message.createdAt).toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </p>
        </div>
      </div>
    </div>
  );
}
