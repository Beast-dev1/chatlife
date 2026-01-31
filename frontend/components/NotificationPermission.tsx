"use client";

import { useEffect, useRef } from "react";
import { useSettingsStore } from "@/store/settingsStore";

/**
 * Requests browser notification permission once when user is in the app and
 * browser notifications are enabled in settings. Does not block UI.
 */
export default function NotificationPermission() {
  const requested = useRef(false);
  const browserNotificationsEnabled = useSettingsStore((s) => s.browserNotificationsEnabled);

  useEffect(() => {
    if (typeof window === "undefined" || !("Notification" in window)) return;
    if (!browserNotificationsEnabled || requested.current) return;
    if (Notification.permission !== "default") return;

    requested.current = true;
    Notification.requestPermission().catch(() => {
      requested.current = false;
    });
  }, [browserNotificationsEnabled]);

  return null;
}
