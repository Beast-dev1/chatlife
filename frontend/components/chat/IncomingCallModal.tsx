"use client";

import { useCallback, useRef } from "react";
import Image from "next/image";
import { Video, Phone } from "lucide-react";
import { useFocusTrap } from "@/hooks/useFocusTrap";
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

  const containerRef = useRef<HTMLDivElement>(null);
  useFocusTrap(containerRef, true, clearIncomingCall);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div ref={containerRef} className="w-full max-w-sm rounded-2xl bg-popover p-6 shadow-modal border border-border" role="dialog" aria-modal="true" aria-label="Incoming call">
        <p className="text-center text-body text-muted-foreground mb-4">
          Incoming {callType === "video" ? "video" : "audio"} call
        </p>
        <div className="flex flex-col items-center gap-4">
          <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center overflow-hidden relative">
            {caller.avatarUrl ? (
              <Image
                src={caller.avatarUrl}
                alt=""
                fill
                className="object-cover"
              />
            ) : (
              <span className="text-2xl font-semibold text-muted-foreground">
                {caller.username?.charAt(0)?.toUpperCase() ?? "?"}
              </span>
            )}
          </div>
          <p className="text-title font-medium text-popover-foreground">{caller.username}</p>
          <div className="flex items-center gap-3 mt-2">
            <button
              type="button"
              onClick={handleReject}
              className="flex items-center justify-center w-14 h-14 rounded-full bg-destructive/20 text-destructive hover:bg-destructive/30 transition-colors duration-normal"
              aria-label="Reject call"
            >
              <Phone className="w-7 h-7 rotate-[135deg]" />
            </button>
            <button
              type="button"
              onClick={handleAccept}
              className="flex items-center justify-center w-14 h-14 rounded-full bg-primary-500/20 text-primary-500 hover:bg-primary-500/30 transition-colors duration-normal"
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
