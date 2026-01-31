import { io, Socket } from "socket.io-client";

const SOCKET_URL =
  typeof window !== "undefined"
    ? (process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000").replace(
        /^https?/,
        (m) => (m === "https" ? "wss" : "ws")
      )
    : "";

let socket: Socket | null = null;

export type SocketConnectionState = "disconnected" | "connecting" | "connected" | "error";

export function getSocket(token: string | null): Socket | null {
  if (typeof window === "undefined") return null;
  if (!token) {
    disconnect();
    return null;
  }
  if (socket?.connected) {
    return socket;
  }
  if (socket) {
    socket.removeAllListeners();
    socket.disconnect();
  }

  socket = io(SOCKET_URL, {
    path: "/socket.io",
    auth: { token },
    transports: ["websocket", "polling"],
    reconnection: true,
    reconnectionAttempts: 10,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
    timeout: 20000,
  });

  return socket;
}

export function disconnect(): void {
  if (socket) {
    socket.removeAllListeners();
    socket.disconnect();
    socket = null;
  }
}

export function getSocketInstance(): Socket | null {
  return socket;
}
