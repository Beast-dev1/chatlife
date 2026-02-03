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
  /** Other participant's display name (for call history list) */
  otherPartyName?: string;
}

function formatDuration(seconds: number): string {
  if (seconds < 60) return `${seconds} secs`;
  const mins = Math.floor(seconds / 60);
  return mins === 1 ? "1 min" : `${mins} mins`;
}

export default function CallLogCard({
  callLog,
  onCallBack,
  layout = "compact",
}: {
  callLog: CallLogCardData;
  onCallBack?: () => void;
  /** "compact" for in-chat, "row" for call history list */
  layout?: "compact" | "row";
}) {
  const { type, status, duration, createdAt, isOwnCall, otherPartyName } = callLog;
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

  const Icon = isMissed ? PhoneMissed : type === "video" ? Video : Phone;

  if (layout === "row") {
    return (
      <div className="flex items-center gap-4 px-4 py-3 w-full">
        <div
          className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${
            isMissed ? "bg-red-500/20" : "bg-slate-600/50"
          }`}
        >
          <Icon
            className={`w-5 h-5 ${isMissed && isOwnCall ? "text-red-400" : "text-slate-400"}`}
          />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-medium text-white truncate">
            {otherPartyName ?? "Unknown"}
          </p>
          <p className="text-sm text-slate-400">
            {status === "missed"
              ? isOwnCall
                ? `Outgoing ${type} call — missed`
                : `Missed ${type} call`
              : label}
          </p>
          <p className="text-xs text-slate-500 mt-0.5">{timeStr}</p>
        </div>
        {onCallBack && (
          <button
            type="button"
            onClick={onCallBack}
            className="flex-shrink-0 px-3 py-1.5 rounded-lg text-sm font-medium text-emerald-400 hover:text-emerald-300 bg-emerald-500/10 hover:bg-emerald-500/20 transition-colors"
          >
            {isMissed ? "Call again" : "Call back"}
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="flex justify-center my-2">
      <div className="flex flex-col items-center gap-2 px-4 py-3 rounded-xl bg-slate-700/50 max-w-[85%]">
        {otherPartyName && (
          <p className="text-xs text-slate-400">With {otherPartyName}</p>
        )}
        <div className="flex items-center gap-2 text-slate-300">
          <Icon
            className={`w-5 h-5 ${isMissed && isOwnCall ? "text-red-400" : "text-slate-400"}`}
          />
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
