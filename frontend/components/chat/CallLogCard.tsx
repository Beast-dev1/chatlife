"use client";

import { Video, Phone, PhoneMissed } from "lucide-react";

export type CallLogType = "video" | "audio";
export type CallLogStatus = "completed" | "missed" | "outgoing";

export interface CallLogCardData {
  id: string;
  type: CallLogType;
  status: CallLogStatus;
  duration?: number; // seconds
  createdAt: string;
  callerId: string;
  isOwnCall?: boolean;
}

function formatDuration(seconds: number): string {
  if (seconds < 60) return `${seconds} secs`;
  const mins = Math.floor(seconds / 60);
  return mins === 1 ? "1 min" : `${mins} mins`;
}

export default function CallLogCard({
  callLog,
  onCallBack,
}: {
  callLog: CallLogCardData;
  onCallBack?: () => void;
}) {
  const { type, status, duration, createdAt, isOwnCall } = callLog;
  const isMissed = status === "missed";

  const label =
    status === "missed"
      ? `Missed ${type} call`
      : type === "video"
        ? `Video call${duration != null ? ` (${formatDuration(duration)})` : ""}`
        : `Audio call${duration != null ? ` (${formatDuration(duration)})` : ""}`;

  const timeStr = new Date(createdAt).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <div className="flex justify-center my-2">
      <div className="flex flex-col items-center gap-2 px-4 py-3 rounded-xl bg-slate-700/50 max-w-[85%]">
        <div className="flex items-center gap-2 text-slate-300">
          {isMissed ? (
            <PhoneMissed
              className={`w-5 h-5 ${isOwnCall ? "text-red-400" : "text-slate-400"}`}
            />
          ) : type === "video" ? (
            <Video className="w-5 h-5 text-slate-400" />
          ) : (
            <Phone className="w-5 h-5 text-slate-400" />
          )}
          <span className="text-sm">{label}</span>
        </div>
        <span className="text-xs text-slate-500">{timeStr}</span>
        {onCallBack && (
          <button
            type="button"
            onClick={onCallBack}
            className="text-sm font-medium text-emerald-400 hover:text-emerald-300"
          >
            {isMissed ? "Call again" : "Call back"}
          </button>
        )}
      </div>
    </div>
  );
}
