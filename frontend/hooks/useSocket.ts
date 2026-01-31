"use client";

import { useEffect, useState, useRef } from "react";
import { useAuthStore } from "@/store/authStore";
import { getAccessToken } from "@/lib/api";
import { getSocket, disconnect, getSocketInstance, type SocketConnectionState } from "@/lib/socket";

export function useSocket() {
  const [connectionState, setConnectionState] = useState<SocketConnectionState>("disconnected");
  const user = useAuthStore((s) => s.user);
  const isInitialized = useAuthStore((s) => s.isInitialized);
  const triedConnect = useRef(false);

  useEffect(() => {
    if (typeof window === "undefined" || !isInitialized) return;
    if (!user) {
      disconnect();
      setConnectionState("disconnected");
      triedConnect.current = false;
      return;
    }

    const token = getAccessToken();
    if (!token) {
      setConnectionState("disconnected");
      return;
    }

    setConnectionState("connecting");
    triedConnect.current = true;
    const s = getSocket(token);
    if (!s) return;

    const onConnect = () => setConnectionState("connected");
    const onDisconnect = () => setConnectionState("disconnected");
    const onConnectError = () => setConnectionState("error");

    s.on("connect", onConnect);
    s.on("disconnect", onDisconnect);
    s.on("connect_error", onConnectError);

    if (s.connected) setConnectionState("connected");

    return () => {
      s.off("connect", onConnect);
      s.off("disconnect", onDisconnect);
      s.off("connect_error", onConnectError);
    };
  }, [user?.id, isInitialized]);

  useEffect(() => {
    if (!user) disconnect();
    return () => {
      if (!user) disconnect();
    };
  }, [user]);

  const socket = user ? getSocketInstance() : null;
  return { socket, connectionState, isConnected: connectionState === "connected" };
}
