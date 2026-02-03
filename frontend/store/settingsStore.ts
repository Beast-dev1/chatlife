"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

export type Theme = "light" | "dark" | "system";
export type LastSeenVisibility = "everyone" | "contacts" | "nobody";
export type ProfileVisibility = "everyone" | "contacts";
export type MediaAutoDownload = "wifi" | "always" | "never";
export type ImageQuality = "standard" | "data_saver";
export type FontSize = "small" | "medium" | "large";
export type ChatDensity = "comfortable" | "compact";

interface SettingsState {
  // Notifications
  notificationsEnabled: boolean;
  browserNotificationsEnabled: boolean;
  soundEnabled: boolean;
  doNotDisturb: boolean;
  doNotDisturbUntil: string | null; // ISO time or null
  setNotificationsEnabled: (v: boolean) => void;
  setBrowserNotificationsEnabled: (v: boolean) => void;
  setSoundEnabled: (v: boolean) => void;
  setDoNotDisturb: (v: boolean) => void;
  setDoNotDisturbUntil: (v: string | null) => void;

  // Privacy
  lastSeenVisibility: LastSeenVisibility;
  readReceiptsEnabled: boolean;
  profileVisibility: ProfileVisibility;
  setLastSeenVisibility: (v: LastSeenVisibility) => void;
  setReadReceiptsEnabled: (v: boolean) => void;
  setProfileVisibility: (v: ProfileVisibility) => void;

  // Appearance
  theme: Theme;
  fontSize: FontSize;
  chatDensity: ChatDensity;
  setTheme: (v: Theme) => void;
  setFontSize: (v: FontSize) => void;
  setChatDensity: (v: ChatDensity) => void;

  // Chat & messaging
  enterToSend: boolean;
  mediaAutoDownload: MediaAutoDownload;
  imageQuality: ImageQuality;
  setEnterToSend: (v: boolean) => void;
  setMediaAutoDownload: (v: MediaAutoDownload) => void;
  setImageQuality: (v: ImageQuality) => void;

  // Calls
  callSoundEnabled: boolean;
  callRingtone: string; // id or "default"
  setCallSoundEnabled: (v: boolean) => void;
  setCallRingtone: (v: string) => void;
}

const defaultUntil = () => {
  const d = new Date();
  d.setHours(d.getHours() + 1);
  return d.toISOString();
};

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      notificationsEnabled: true,
      browserNotificationsEnabled: true,
      soundEnabled: true,
      doNotDisturb: false,
      doNotDisturbUntil: null,
      setNotificationsEnabled: (v) => set({ notificationsEnabled: v }),
      setBrowserNotificationsEnabled: (v) => set({ browserNotificationsEnabled: v }),
      setSoundEnabled: (v) => set({ soundEnabled: v }),
      setDoNotDisturb: (v) => set({ doNotDisturb: v, doNotDisturbUntil: v ? defaultUntil() : null }),
      setDoNotDisturbUntil: (v) => set({ doNotDisturbUntil: v }),

      lastSeenVisibility: "everyone",
      readReceiptsEnabled: true,
      profileVisibility: "everyone",
      setLastSeenVisibility: (v) => set({ lastSeenVisibility: v }),
      setReadReceiptsEnabled: (v) => set({ readReceiptsEnabled: v }),
      setProfileVisibility: (v) => set({ profileVisibility: v }),

      theme: "system",
      fontSize: "medium",
      chatDensity: "comfortable",
      setTheme: (v) => set({ theme: v }),
      setFontSize: (v) => set({ fontSize: v }),
      setChatDensity: (v) => set({ chatDensity: v }),

      enterToSend: true,
      mediaAutoDownload: "wifi",
      imageQuality: "standard",
      setEnterToSend: (v) => set({ enterToSend: v }),
      setMediaAutoDownload: (v) => set({ mediaAutoDownload: v }),
      setImageQuality: (v) => set({ imageQuality: v }),

      callSoundEnabled: true,
      callRingtone: "default",
      setCallSoundEnabled: (v) => set({ callSoundEnabled: v }),
      setCallRingtone: (v) => set({ callRingtone: v }),
    }),
    { name: "letschat-settings" }
  )
);
