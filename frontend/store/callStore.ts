"use client";

import { create } from "zustand";

export interface IncomingCallPayload {
  callId: string;
  chatId: string;
  callerId: string;
  caller: { id: string; username: string; avatarUrl: string | null };
  callType: "audio" | "video";
}

export interface ActiveCallPayload {
  callId: string;
  chatId: string;
  remoteUserId: string;
  isCaller: boolean;
  callType: "audio" | "video";
}

interface CallState {
  incomingCall: IncomingCallPayload | null;
  activeCall: ActiveCallPayload | null;
  setIncomingCall: (payload: IncomingCallPayload | null) => void;
  clearIncomingCall: () => void;
  setActiveCall: (payload: ActiveCallPayload | null) => void;
  clearActiveCall: () => void;
  clearAll: () => void;
}

export const useCallStore = create<CallState>((set) => ({
  incomingCall: null,
  activeCall: null,
  setIncomingCall: (payload) => set({ incomingCall: payload }),
  clearIncomingCall: () => set({ incomingCall: null }),
  setActiveCall: (payload) => set({ activeCall: payload }),
  clearActiveCall: () => set({ activeCall: null }),
  clearAll: () => set({ incomingCall: null, activeCall: null }),
}));
