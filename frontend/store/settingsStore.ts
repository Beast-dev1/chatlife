"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

interface SettingsState {
  /** Show in-app toasts for new messages when tab is focused */
  notificationsEnabled: boolean;
  /** Request and use browser (desktop) notifications when tab is in background */
  browserNotificationsEnabled: boolean;
  setNotificationsEnabled: (v: boolean) => void;
  setBrowserNotificationsEnabled: (v: boolean) => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      notificationsEnabled: true,
      browserNotificationsEnabled: true,

      setNotificationsEnabled: (v) => set({ notificationsEnabled: v }),
      setBrowserNotificationsEnabled: (v) => set({ browserNotificationsEnabled: v }),
    }),
    { name: "letschat-settings" }
  )
);
