"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import type { Socket } from "socket.io-client";
import {
  getDefaultIceServers,
  createPeerConnection,
  createOffer,
  createAnswer,
  addIceCandidate,
  getLocalStream,
  attachTracksToConnection,
} from "@/lib/webrtc";

export type WebRTCConnectionState =
  | "new"
  | "connecting"
  | "connected"
  | "disconnected"
  | "failed"
  | "closed";

export interface UseWebRTCOptions {
  socket: Socket | null;
  callId: string | null;
  isCaller: boolean;
  remoteUserId: string | null;
  callType: "audio" | "video";
}

export function useWebRTC({
  socket,
  callId,
  isCaller,
  remoteUserId,
  callType,
}: UseWebRTCOptions) {
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoDisabled, setIsVideoDisabled] = useState(callType === "audio");
  const [connectionState, setConnectionState] =
    useState<WebRTCConnectionState>("new");

  const pcRef = useRef<RTCPeerConnection | null>(null);
  const remoteStreamRef = useRef<MediaStream | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);

  const cleanup = useCallback(() => {
    if (pcRef.current) {
      pcRef.current.close();
      pcRef.current = null;
    }
    localStreamRef.current?.getTracks().forEach((t) => t.stop());
    localStreamRef.current = null;
    setLocalStream(null);
    setRemoteStream(null);
    remoteStreamRef.current = null;
    setConnectionState("closed");
  }, []);

  const mute = useCallback(() => {
    localStream?.getAudioTracks().forEach((t) => {
      t.enabled = false;
    });
    setIsMuted(true);
  }, [localStream]);

  const unmute = useCallback(() => {
    localStream?.getAudioTracks().forEach((t) => {
      t.enabled = true;
    });
    setIsMuted(false);
  }, [localStream]);

  const enableVideo = useCallback(() => {
    localStream?.getVideoTracks().forEach((t) => {
      t.enabled = true;
    });
    setIsVideoDisabled(false);
  }, [localStream]);

  const disableVideo = useCallback(() => {
    localStream?.getVideoTracks().forEach((t) => {
      t.enabled = false;
    });
    setIsVideoDisabled(true);
  }, [localStream]);

  const endCall = useCallback(() => {
    if (socket && callId) {
      socket.emit("call_end", { callId });
    }
    cleanup();
  }, [socket, callId, cleanup]);

  useEffect(() => {
    if (!callId || !remoteUserId || !socket) {
      cleanup();
      return;
    }

    const wantVideo = callType === "video";
    let mounted = true;
    let pc: RTCPeerConnection | null = null;

    const setup = async () => {
      try {
        pc = createPeerConnection(getDefaultIceServers());
        pcRef.current = pc;

        pc.onconnectionstatechange = () => {
          if (!mounted || !pc) return;
          const state = pc.connectionState;
          if (state === "new") setConnectionState("new");
          else if (state === "connecting") setConnectionState("connecting");
          else if (state === "connected") setConnectionState("connected");
          else if (state === "disconnected") setConnectionState("disconnected");
          else if (state === "failed") setConnectionState("failed");
          else if (state === "closed") setConnectionState("closed");
        };

        pc.ontrack = (e) => {
          if (!mounted || !e.streams[0]) return;
          if (!remoteStreamRef.current) {
            remoteStreamRef.current = new MediaStream();
          }
          e.streams[0].getTracks().forEach((t) => {
            if (!remoteStreamRef.current) return;
            remoteStreamRef.current.addTrack(t);
          });
          setRemoteStream(remoteStreamRef.current);
        };

        pc.onicecandidate = (e) => {
          if (e.candidate && socket && callId && remoteUserId) {
            socket.emit("ice_candidate", {
              callId,
              targetUserId: remoteUserId,
              candidate: e.candidate.toJSON(),
            });
          }
        };

        const stream = await getLocalStream(true, wantVideo);
        if (!mounted || !pc) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        localStreamRef.current = stream;
        setLocalStream(stream);
        attachTracksToConnection(pc, stream);

        if (isCaller) {
          const offer = await createOffer(pc);
          if (mounted && socket && callId && remoteUserId) {
            socket.emit("call_offer", {
              callId,
              targetUserId: remoteUserId,
              sdp: offer,
            });
          }
        }
      } catch (err) {
        console.error("useWebRTC setup:", err);
        if (mounted) setConnectionState("failed");
        cleanup();
      }
    };

    void setup();

    const iceCandidateQueue: RTCIceCandidateInit[] = [];

    const flushIceCandidates = async (currentPc: RTCPeerConnection) => {
      while (iceCandidateQueue.length > 0) {
        const candidate = iceCandidateQueue.shift();
        if (candidate) await addIceCandidate(currentPc, candidate);
      }
    };

    const onCallOffer = async (payload: {
      callId: string;
      fromUserId: string;
      sdp: RTCSessionDescriptionInit;
    }) => {
      const currentPc = pcRef.current;
      if (payload.callId !== callId || payload.fromUserId !== remoteUserId || !currentPc) return;
      try {
        const answer = await createAnswer(currentPc, payload.sdp);
        if (mounted && socket && callId && remoteUserId) {
          socket.emit("call_answer", {
            callId,
            targetUserId: remoteUserId,
            sdp: answer,
          });
        }
        await flushIceCandidates(currentPc);
      } catch (err) {
        console.error("useWebRTC createAnswer:", err);
      }
    };

    const onCallAnswer = async (payload: {
      callId: string;
      fromUserId: string;
      sdp: RTCSessionDescriptionInit;
    }) => {
      const currentPc = pcRef.current;
      if (payload.callId !== callId || payload.fromUserId !== remoteUserId || !currentPc) return;
      try {
        await currentPc.setRemoteDescription(new RTCSessionDescription(payload.sdp));
        await flushIceCandidates(currentPc);
      } catch (err) {
        console.error("useWebRTC setRemoteDescription answer:", err);
      }
    };

    const onIceCandidate = async (payload: {
      callId: string;
      fromUserId: string;
      candidate: RTCIceCandidateInit | null;
    }) => {
      const currentPc = pcRef.current;
      if (payload.callId !== callId || payload.fromUserId !== remoteUserId || !currentPc) return;
      if (payload.candidate == null) return;
      const remoteDesc = currentPc.remoteDescription;
      if (remoteDesc) {
        await addIceCandidate(currentPc, payload.candidate);
      } else {
        iceCandidateQueue.push(payload.candidate);
      }
    };

    socket.on("call_offer", onCallOffer);
    socket.on("call_answer", onCallAnswer);
    socket.on("ice_candidate", onIceCandidate);

    return () => {
      mounted = false;
      socket.off("call_offer", onCallOffer);
      socket.off("call_answer", onCallAnswer);
      socket.off("ice_candidate", onIceCandidate);
      if (pc) {
        pc.close();
        pcRef.current = null;
      }
      localStreamRef.current?.getTracks().forEach((t) => t.stop());
      localStreamRef.current = null;
      setLocalStream(null);
      setRemoteStream(null);
      remoteStreamRef.current = null;
      setConnectionState("closed");
    };
  }, [callId, remoteUserId, socket, isCaller, callType]);

  return {
    localStream,
    remoteStream,
    isMuted,
    isVideoDisabled,
    connectionState,
    mute,
    unmute,
    enableVideo,
    disableVideo,
    endCall,
  };
}
