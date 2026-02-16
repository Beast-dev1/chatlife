"use client";

import dynamic from "next/dynamic";
import { useEffect } from "react";
import { AnimatePresence } from "framer-motion";
import { useQueryClient } from "@tanstack/react-query";
import { useSocket } from "@/hooks/useSocket";
import { useCallStore } from "@/store/callStore";

const IncomingCallModal = dynamic(() => import("./IncomingCallModal"), { ssr: false });
const ActiveCallBar = dynamic(() => import("./ActiveCallBar"), { ssr: false });

export default function CallProvider() {
  const { socket } = useSocket();
  const queryClient = useQueryClient();
  const incomingCall = useCallStore((s) => s.incomingCall);
  const activeCall = useCallStore((s) => s.activeCall);
  const setIncomingCall = useCallStore((s) => s.setIncomingCall);
  const setActiveCall = useCallStore((s) => s.setActiveCall);
  const clearActiveCall = useCallStore((s) => s.clearActiveCall);
  const clearIncomingCall = useCallStore((s) => s.clearIncomingCall);
  const clearAll = useCallStore((s) => s.clearAll);

  useEffect(() => {
    if (!socket) return;

    const onIncomingCall = (payload: {
      callId: string;
      chatId: string;
      callerId: string;
      caller: { id: string; username: string; avatarUrl: string | null };
      callType: "audio" | "video";
    }) => {
      setIncomingCall({
        callId: payload.callId,
        chatId: payload.chatId,
        callerId: payload.callerId,
        caller: payload.caller,
        callType: payload.callType,
      });
    };

    const onCallInitiated = (payload: {
      callId: string;
      chatId: string;
      calleeId: string;
      callType?: "audio" | "video";
    }) => {
      const { callId, chatId, calleeId, callType } = payload;
      if (!chatId) return;
      setActiveCall({
        callId,
        chatId,
        remoteUserId: calleeId,
        isCaller: true,
        callType: callType ?? "audio",
      });
    };

    const onCallAccepted = () => {
      // Caller: activeCall already set when we emitted call_initiate; ensure it stays.
      // Nothing to do if we already have activeCall.
    };

    const onCallRejected = (payload: { callId?: string; chatId?: string }) => {
      clearActiveCall();
      clearIncomingCall();
      if (payload?.chatId) {
        queryClient.invalidateQueries({ queryKey: ["calls", payload.chatId] });
      }
    };

    const onCallEnded = (payload: { callId?: string; chatId?: string }) => {
      clearAll();
      if (payload?.chatId) {
        queryClient.invalidateQueries({ queryKey: ["calls", payload.chatId] });
      }
    };

    socket.on("incoming_call", onIncomingCall);
    socket.on("call_initiated", onCallInitiated);
    socket.on("call_accepted", onCallAccepted);
    socket.on("call_rejected", onCallRejected);
    socket.on("call_ended", onCallEnded);

    return () => {
      socket.off("incoming_call", onIncomingCall);
      socket.off("call_initiated", onCallInitiated);
      socket.off("call_accepted", onCallAccepted);
      socket.off("call_rejected", onCallRejected);
      socket.off("call_ended", onCallEnded);
    };
  }, [
    socket,
    queryClient,
    setIncomingCall,
    setActiveCall,
    clearActiveCall,
    clearIncomingCall,
    clearAll,
  ]);

  return (
    <>
      <AnimatePresence>
        {incomingCall && (
          <IncomingCallModal
            key="incoming-call"
            incomingCall={incomingCall}
            socket={socket}
          />
        )}
      </AnimatePresence>
      {activeCall && <ActiveCallBar activeCall={activeCall} />}
    </>
  );
}
