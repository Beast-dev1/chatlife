"use client";

import { User, Bell } from "lucide-react";
import { useAuthStore } from "@/store/authStore";
import { useSettingsStore } from "@/store/settingsStore";

export default function ProfilePage() {
  const user = useAuthStore((s) => s.user);
  const notificationsEnabled = useSettingsStore((s) => s.notificationsEnabled);
  const browserNotificationsEnabled = useSettingsStore((s) => s.browserNotificationsEnabled);
  const setNotificationsEnabled = useSettingsStore((s) => s.setNotificationsEnabled);
  const setBrowserNotificationsEnabled = useSettingsStore((s) => s.setBrowserNotificationsEnabled);

  const requestNotificationPermission = () => {
    if (typeof window !== "undefined" && "Notification" in window && Notification.permission === "default") {
      Notification.requestPermission();
    }
  };

  if (!user) return null;

  return (
    <div className="flex-1 overflow-y-auto p-8">
      <div className="max-w-xl mx-auto">
        <h1 className="text-2xl font-bold text-white mb-8">Profile</h1>

        <div className="bg-slate-800/50 rounded-2xl border border-slate-700/50 p-8">
          <div className="flex items-center gap-6 mb-8">
            <div className="w-20 h-20 rounded-full bg-emerald-500/30 flex items-center justify-center flex-shrink-0">
              <User className="w-10 h-10 text-emerald-400" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-white">
                {user.username}
              </h2>
              <p className="text-slate-400">{user.email}</p>
            </div>
          </div>

          <dl className="space-y-4">
            <div>
              <dt className="text-sm text-slate-400">Status</dt>
              <dd className="text-slate-200">
                {user.status || "—"}
              </dd>
            </div>
            <div>
              <dt className="text-sm text-slate-400">Bio</dt>
              <dd className="text-slate-200">{user.bio || "—"}</dd>
            </div>
          </dl>

          <section className="mt-8 pt-8 border-t border-slate-700/50">
            <h3 className="flex items-center gap-2 text-sm font-medium text-slate-300 mb-4">
              <Bell className="w-4 h-4" />
              Notifications
            </h3>
            <div className="space-y-4">
              <label className="flex items-center justify-between gap-4 cursor-pointer">
                <span className="text-slate-200 text-sm">In-app toasts when a new message arrives (tab focused)</span>
                <input
                  type="checkbox"
                  checked={notificationsEnabled}
                  onChange={(e) => setNotificationsEnabled(e.target.checked)}
                  className="rounded border-slate-600 bg-slate-700 text-emerald-500 focus:ring-emerald-500"
                />
              </label>
              <label className="flex items-center justify-between gap-4 cursor-pointer">
                <span className="text-slate-200 text-sm">Browser notifications when tab is in background</span>
                <input
                  type="checkbox"
                  checked={browserNotificationsEnabled}
                  onChange={(e) => {
                    const checked = e.target.checked;
                    setBrowserNotificationsEnabled(checked);
                    if (checked) requestNotificationPermission();
                  }}
                  className="rounded border-slate-600 bg-slate-700 text-emerald-500 focus:ring-emerald-500"
                />
              </label>
              {typeof window !== "undefined" && "Notification" in window && (
                <p className="text-xs text-slate-500">
                  Permission: {Notification.permission === "granted" ? "Granted" : Notification.permission === "denied" ? "Denied" : "Not asked yet"}
                </p>
              )}
            </div>
          </section>

          <p className="mt-6 text-sm text-slate-500">
            Profile editing will be enhanced in later phases.
          </p>
        </div>
      </div>
    </div>
  );
}
