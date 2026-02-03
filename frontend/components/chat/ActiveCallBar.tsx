"use client";

import { useCallback, useRef, useEffect } from "react";
import { Phone, Mic, MicOff, Video, VideoOff, Monitor, MonitorOff } from "lucide-react";
import { useCallStore, type ActiveCallPayload } from "@/store/callStore";
import { useWebRTC } from "@/hooks/useWebRTC";
import { useSocket } from "@/hooks/useSocket";

export default function ActiveCallBar({ activeCall }: { activeCall: ActiveCallPayload }) {
  const { socket } = useSocket();
  const clearActiveCall = useCallStore((s) => s.clearActiveCall);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const localVideoRef = useRef<HTMLVideoElement>(null);

  const {
    localStream,
    remoteStream,
    isMuted,
    isVideoDisabled,
    isScreenSharing,
    connectionState,
    mute,
    unmute,
    enableVideo,
    disableVideo,
    startScreenShare,
    stopScreenShare,
    endCall,
  } = useWebRTC({
    socket,
    callId: activeCall.callId,
    isCaller: activeCall.isCaller,
    remoteUserId: activeCall.remoteUserId,
    callType: activeCall.callType,
  });

  useEffect(() => {
    if (remoteVideoRef.current && remoteStream) {
      remoteVideoRef.current.srcObject = remoteStream;
    }
  }, [remoteStream]);

  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream]);

  const handleEndCall = useCallback(() => {
    endCall();
    clearActiveCall();
  }, [endCall, clearActiveCall]);

  const isVideo = activeCall.callType === "video";

  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-40 w-full max-w-lg mx-4">
      <div className="rounded-2xl bg-slate-800/95 border border-slate-700 shadow-xl overflow-hidden">
        {/* Video area */}
        <div className="relative aspect-video bg-slate-900">
          <video
            ref={remoteVideoRef}
            autoPlay
            playsInline
            muted={false}
            className="absolute inset-0 w-full h-full object-cover"
          />
          {isVideo && localStream && (
            <div className="absolute bottom-2 right-2 w-24 h-20 rounded-lg overflow-hidden border border-slate-600 bg-slate-800">
              <video
                ref={localVideoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover"
              />
            </div>
          )}
          {!isVideo && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-16 h-16 rounded-full bg-slate-700 flex items-center justify-center">
                <Phone className="w-8 h-8 text-slate-400" />
              </div>
            </div>
          )}
          <div className="absolute top-2 left-2 px-2 py-1 rounded bg-black/50 text-xs text-slate-300">
            {connectionState === "connecting" && "Connecting…"}
            {connectionState === "connected" && "Connected"}
            {connectionState === "disconnected" && "Disconnected"}
            {connectionState === "failed" && "Connection failed"}
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center justify-center gap-3 p-3">
          <button
            type="button"
            onClick={isMuted ? unmute : mute}
            className={`p-3 rounded-full transition-colors ${
              isMuted ? "bg-red-500/20 text-red-400" : "bg-slate-700 text-slate-300 hover:bg-slate-600"
            }`}
            aria-label={isMuted ? "Unmute" : "Mute"}
          >
            {isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
          </button>
          {isVideo && (
            <button
              type="button"
              onClick={isVideoDisabled ? enableVideo : disableVideo}
              className={`p-3 rounded-full transition-colors ${
                isVideoDisabled ? "bg-red-500/20 text-red-400" : "bg-slate-700 text-slate-300 hover:bg-slate-600"
              }`}
              aria-label={isVideoDisabled ? "Enable video" : "Disable video"}
            >
              {isVideoDisabled ? <VideoOff className="w-5 h-5" /> : <Video className="w-5 h-5" />}
            </button>
          )}
          {isVideo && (
            <button
              type="button"
              onClick={isScreenSharing ? stopScreenShare : startScreenShare}
              className={`p-3 rounded-full transition-colors ${
                isScreenSharing ? "bg-emerald-500/20 text-emerald-400" : "bg-slate-700 text-slate-300 hover:bg-slate-600"
              }`}
              aria-label={isScreenSharing ? "Stop sharing screen" : "Share screen"}
            >
              {isScreenSharing ? <MonitorOff className="w-5 h-5" /> : <Monitor className="w-5 h-5" />}
            </button>
          )}
          <button
            type="button"
            onClick={handleEndCall}
            className="p-3 rounded-full bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-colors"
            aria-label="End call"
          >
            <Phone className="w-5 h-5 rotate-[135deg]" />
          </button>
        </div>
      </div>
    </div>
  );
}
