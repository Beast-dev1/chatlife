"use client";

import { Video, Phone, PhoneMissed } from "lucide-react";
import type { CallLogItem } from "@/types/call";

function formatDuration(seconds: number): string {
  if (seconds < 60) return `${seconds} secs`;
  const mins = Math.floor(seconds / 60);
  return mins === 1 ? "1 min" : `${mins} mins`;
}

export default function CallEntryBubble({
  call,
  currentUserId,
  onCallAgain,
}: {
  call: CallLogItem;
  currentUserId: string;
  onCallAgain: (callType: "audio" | "video") => void;
}) {
  const isOwn = call.callerId === currentUserId;
  const isMissed = call.status === "MISSED" || call.status === "REJECTED";
  const type = call.callType === "VIDEO" ? "video" : "audio";

  const timeStr = new Date(call.startedAt).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });

  const Icon = isMissed ? PhoneMissed : call.callType === "VIDEO" ? Video : Phone;

  const label = isMissed
    ? `Missed ${type} call`
    : call.callType === "VIDEO"
      ? "Video call"
      : "Audio call";

  const buttonLabel = isMissed ? (isOwn ? "Call again" : "Call back") : "Call again";

  return (
    <div className={`w-full flex ${isOwn ? "justify-end" : "justify-start"}`}>
      <div className="w-fit max-w-[85%]">
        <div
          className={`rounded-2xl px-4 py-3 border shadow-soft transition-shadow duration-200 ${
            isOwn ? "rounded-br-md" : "rounded-bl-md"
          } bg-white text-slate-800 border-slate-200/70`}
        >
          <div className="flex flex-col items-center gap-1.5">
            <div
              className={`flex items-center justify-center w-10 h-10 rounded-full shrink-0 ${
                isMissed ? "bg-red-500/20" : "bg-slate-200/80"
              }`}
            >
              <Icon
                className={`w-5 h-5 ${
                  isMissed ? "text-red-500" : "text-slate-600"
                }`}
              />
            </div>
            <span className="text-sm font-medium text-slate-800">{label}</span>
            {!isMissed && call.duration != null && (
              <span className="text-xs text-slate-500">
                {formatDuration(call.duration)}
              </span>
            )}
            <span className="text-xs text-slate-500">{timeStr}</span>
            <button
              type="button"
              onClick={() => onCallAgain(type)}
              className="mt-1 text-sm font-medium text-primary-600 hover:text-primary-500 hover:underline"
            >
              {buttonLabel}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
