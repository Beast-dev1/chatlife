"use client";

import { useCallback } from "react";
import { Video, Phone } from "lucide-react";
import { useCallStore, type IncomingCallPayload } from "@/store/callStore";
import type { Socket } from "socket.io-client";

export default function IncomingCallModal({
  incomingCall,
  socket,
}: {
  incomingCall: IncomingCallPayload;
  socket: Socket | null;
}) {
  const { caller, callType, callId, chatId } = incomingCall;
  const clearIncomingCall = useCallStore((s) => s.clearIncomingCall);
  const setActiveCall = useCallStore((s) => s.setActiveCall);

  const handleAccept = useCallback(() => {
    if (!socket) return;
    socket.emit("call_accept", { callId });
    setActiveCall({
      callId,
      chatId,
      remoteUserId: caller.id,
      isCaller: false,
      callType,
    });
    clearIncomingCall();
  }, [socket, callId, chatId, caller.id, callType, setActiveCall, clearIncomingCall]);

  const handleReject = useCallback(() => {
    if (socket) socket.emit("call_reject", { callId });
    clearIncomingCall();
  }, [socket, callId, clearIncomingCall]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70">
      <div className="mx-4 w-full max-w-sm rounded-2xl bg-slate-800 p-6 shadow-xl border border-slate-700">
        <p className="text-center text-sm text-slate-400 mb-4">
          Incoming {callType === "video" ? "video" : "audio"} call
        </p>
        <div className="flex flex-col items-center gap-4">
          <div className="w-20 h-20 rounded-full bg-slate-700 flex items-center justify-center overflow-hidden">
            {caller.avatarUrl ? (
              <img
                src={caller.avatarUrl}
                alt=""
                className="w-full h-full object-cover"
              />
            ) : (
              <span className="text-2xl font-semibold text-slate-400">
                {caller.username?.charAt(0)?.toUpperCase() ?? "?"}
              </span>
            )}
          </div>
          <p className="text-lg font-medium text-white">{caller.username}</p>
          <div className="flex items-center gap-3 mt-2">
            <button
              type="button"
              onClick={handleReject}
              className="flex items-center justify-center w-14 h-14 rounded-full bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-colors"
              aria-label="Reject call"
            >
              <Phone className="w-7 h-7 rotate-[135deg]" />
            </button>
            <button
              type="button"
              onClick={handleAccept}
              className="flex items-center justify-center w-14 h-14 rounded-full bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 transition-colors"
              aria-label="Accept call"
            >
              {callType === "video" ? (
                <Video className="w-7 h-7" />
              ) : (
                <Phone className="w-7 h-7" />
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
