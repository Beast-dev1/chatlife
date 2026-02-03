"use client";

import { motion } from "framer-motion";
import { User, Bell, Mail, MessageSquare } from "lucide-react";
import { useAuthStore } from "@/store/authStore";
import { useSettingsStore } from "@/store/settingsStore";
import Image from "next/image";

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
    <div className="flex flex-col h-full bg-gradient-to-b from-slate-50/40 to-white/60 rounded-2xl overflow-y-auto">
      <div className="flex-1 px-4 py-6 sm:px-6 lg:px-8 max-w-2xl mx-auto w-full">
        {/* Header */}
        <motion.header
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease: "easeOut" }}
          className="flex items-center gap-3 mb-8"
        >
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center shadow-soft border border-slate-200/60">
            <User className="w-6 h-6 text-slate-500" />
          </div>
          <div>
            <h1 className="text-xl font-semibold text-slate-800 tracking-tight">Profile</h1>
            <p className="text-sm text-slate-500">Your account and preferences</p>
          </div>
        </motion.header>

        {/* Profile card */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.35, ease: "easeOut" }}
          className="rounded-2xl bg-white/90 border border-slate-200/60 shadow-soft overflow-hidden"
        >
          <div className="p-6 sm:p-8">
            <div className="flex items-center gap-5 mb-8">
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center flex-shrink-0 overflow-hidden border border-slate-200/60 shadow-inner">
                {user.avatarUrl ? (
                  <Image src={user.avatarUrl} alt="" width={80} height={80} className="w-full h-full object-cover" unoptimized />
                ) : (
                  <User className="w-10 h-10 text-slate-500" />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <h2 className="text-xl font-semibold text-slate-800 truncate">{user.username}</h2>
                <p className="text-slate-500 text-sm flex items-center gap-1.5 mt-0.5 truncate">
                  <Mail className="w-4 h-4 flex-shrink-0 text-slate-400" />
                  {user.email}
                </p>
              </div>
            </div>

            <dl className="space-y-5">
              <div>
                <dt className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-1">Status</dt>
                <dd className="text-slate-800 font-medium">{user.status || "—"}</dd>
              </div>
              <div>
                <dt className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-1">Bio</dt>
                <dd className="text-slate-700">{user.bio || "—"}</dd>
              </div>
            </dl>

            {/* Notifications */}
            <section className="mt-8 pt-8 border-t border-slate-200/70">
              <h3 className="flex items-center gap-2 text-sm font-semibold text-slate-700 mb-4">
                <Bell className="w-4 h-4 text-slate-500" />
                Notifications
              </h3>
              <div className="space-y-4">
                <label className="flex items-center justify-between gap-4 p-3 rounded-xl bg-slate-50/80 border border-slate-200/60 cursor-pointer hover:bg-slate-50 transition-colors duration-200">
                  <span className="text-slate-700 text-sm flex items-center gap-2">
                    <MessageSquare className="w-4 h-4 text-slate-400" />
                    In-app toasts when a new message arrives (tab focused)
                  </span>
                  <input
                    type="checkbox"
                    checked={notificationsEnabled}
                    onChange={(e) => setNotificationsEnabled(e.target.checked)}
                    className="rounded border-slate-300 bg-white text-primary-500 focus:ring-primary-500/20 focus:ring-2"
                  />
                </label>
                <label className="flex items-center justify-between gap-4 p-3 rounded-xl bg-slate-50/80 border border-slate-200/60 cursor-pointer hover:bg-slate-50 transition-colors duration-200">
                  <span className="text-slate-700 text-sm flex items-center gap-2">
                    <Bell className="w-4 h-4 text-slate-400" />
                    Browser notifications when tab is in background
                  </span>
                  <input
                    type="checkbox"
                    checked={browserNotificationsEnabled}
                    onChange={(e) => {
                      const checked = e.target.checked;
                      setBrowserNotificationsEnabled(checked);
                      if (checked) requestNotificationPermission();
                    }}
                    className="rounded border-slate-300 bg-white text-primary-500 focus:ring-primary-500/20 focus:ring-2"
                  />
                </label>
                {typeof window !== "undefined" && "Notification" in window && (
                  <p className="text-xs text-slate-500 px-3">
                    Permission: {Notification.permission === "granted" ? "Granted" : Notification.permission === "denied" ? "Denied" : "Not asked yet"}
                  </p>
                )}
              </div>
            </section>

            <p className="mt-6 text-sm text-slate-500">
              Profile editing will be enhanced in later phases.
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
