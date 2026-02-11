"use client";

import { useId, useState } from "react";
import { motion } from "framer-motion";
import {
  Bell,
  Shield,
  User,
  Palette,
  MessageSquare,
  Phone,
  Database,
  Info,
  Moon,
  Sun,
  Monitor,
  Key,
  LogOut,
} from "lucide-react";
import { useSettingsStore } from "@/store/settingsStore";
import type { Theme, LastSeenVisibility, ProfileVisibility, MediaAutoDownload, ImageQuality, FontSize, ChatDensity } from "@/store/settingsStore";
import { useAuthStore } from "@/store/authStore";

function SectionCard({
  title,
  icon: Icon,
  children,
  delay = 0,
}: {
  title: string;
  icon: React.ElementType;
  children: React.ReactNode;
  delay?: number;
}) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: "easeOut", delay }}
      className="rounded-2xl bg-white/90 dark:bg-slate-800/90 border border-slate-200/60 dark:border-slate-600/60 shadow-soft overflow-hidden"
    >
      <div className="flex items-center gap-2 px-4 sm:px-5 py-3.5 border-b border-slate-100 dark:border-slate-600 bg-slate-50/50 dark:bg-slate-700/50">
        <Icon className="w-5 h-5 text-slate-500 dark:text-slate-400" />
        <h2 className="text-sm font-semibold text-slate-800 dark:text-slate-100">{title}</h2>
      </div>
      <div className="p-4 sm:p-5">{children}</div>
    </motion.section>
  );
}

function ToggleRow({
  label,
  description,
  checked,
  onChange,
}: {
  label: string;
  description?: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  const inputId = useId();
  const descId = useId();
  return (
    <label htmlFor={inputId} className="flex items-start justify-between gap-4 py-3 first:pt-0 last:pb-0 border-b border-slate-100 dark:border-slate-600 last:border-0 cursor-pointer group">
      <div className="min-w-0">
        <span className="text-slate-800 dark:text-slate-100 font-medium text-sm">{label}</span>
        {description && <p id={descId} className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{description}</p>}
      </div>
      <input
        id={inputId}
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        aria-describedby={description ? descId : undefined}
        className="mt-0.5 rounded border-slate-300 dark:border-slate-500 bg-white dark:bg-slate-600 text-primary-500 focus:ring-primary-500/20 focus:ring-2 flex-shrink-0"
      />
    </label>
  );
}

function SelectRow<T extends string>({
  label,
  description,
  value,
  options,
  onChange,
}: {
  label: string;
  description?: string;
  value: T;
  options: { value: T; label: string }[];
  onChange: (v: T) => void;
}) {
  const selectId = useId();
  const descId = useId();
  return (
    <div className="py-3 first:pt-0 border-b border-slate-100 dark:border-slate-600 last:border-0">
      <label htmlFor={selectId} className="text-slate-800 dark:text-slate-100 font-medium text-sm mb-1 block">
        {label}
      </label>
      {description && <p id={descId} className="text-xs text-slate-500 dark:text-slate-400 mb-2">{description}</p>}
      <select
        id={selectId}
        value={value}
        onChange={(e) => onChange(e.target.value as T)}
        aria-describedby={description ? descId : undefined}
        className="w-full rounded-xl border border-slate-200/80 dark:border-slate-500 px-3 py-2 text-sm text-slate-800 dark:text-slate-100 bg-white dark:bg-slate-600 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-400/50"
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  );
}

export default function SettingsPage() {
  const user = useAuthStore((s) => s.user);
  const {
    notificationsEnabled,
    browserNotificationsEnabled,
    soundEnabled,
    doNotDisturb,
    setNotificationsEnabled,
    setBrowserNotificationsEnabled,
    setSoundEnabled,
    setDoNotDisturb,
    lastSeenVisibility,
    readReceiptsEnabled,
    profileVisibility,
    setLastSeenVisibility,
    setReadReceiptsEnabled,
    setProfileVisibility,
    theme,
    fontSize,
    chatDensity,
    setTheme,
    setFontSize,
    setChatDensity,
    enterToSend,
    mediaAutoDownload,
    imageQuality,
    setEnterToSend,
    setMediaAutoDownload,
    setImageQuality,
    callSoundEnabled,
    setCallSoundEnabled,
  } = useSettingsStore();

  const [clearCacheConfirm, setClearCacheConfirm] = useState(false);
  const [deleteAccountConfirm, setDeleteAccountConfirm] = useState(false);

  const requestNotificationPermission = () => {
    if (typeof window !== "undefined" && "Notification" in window && Notification.permission === "default") {
      Notification.requestPermission();
    }
  };

  const handleClearCache = () => {
    if (!clearCacheConfirm) {
      setClearCacheConfirm(true);
      return;
    }
    if (typeof caches !== "undefined") {
      caches.keys().then((names) => names.forEach((name) => caches.delete(name)));
    }
    setClearCacheConfirm(false);
  };

  if (!user) return null;

  return (
    <div className="flex flex-col h-full bg-gradient-to-b from-slate-50/40 to-white/60 dark:from-slate-900/40 dark:to-slate-800/60 rounded-2xl overflow-y-auto">
      <div className="flex-1 w-full px-4 py-6 sm:px-6 pb-10">
        <motion.header
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease: "easeOut" }}
          className="mb-6"
        >
          <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100 tracking-tight">Settings</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Manage your preferences and account</p>
          <div className="mt-3 h-px bg-slate-200/80 dark:bg-slate-600/80" />
        </motion.header>

        <div className="space-y-6">
          {/* Notifications */}
          <SectionCard title="Notifications" icon={Bell} delay={0.05}>
            <ToggleRow
              label="In-app toasts"
              description="Show toasts when a new message arrives (tab focused)"
              checked={notificationsEnabled}
              onChange={setNotificationsEnabled}
            />
            <ToggleRow
              label="Browser notifications"
              description="Desktop notifications when tab is in background"
              checked={browserNotificationsEnabled}
              onChange={(v) => {
                setBrowserNotificationsEnabled(v);
                if (v) requestNotificationPermission();
              }}
            />
            <ToggleRow
              label="Sound"
              description="Play sound for new messages"
              checked={soundEnabled}
              onChange={setSoundEnabled}
            />
            <ToggleRow
              label="Do not disturb"
              description="Mute all notifications temporarily"
              checked={doNotDisturb}
              onChange={setDoNotDisturb}
            />
          </SectionCard>

          {/* Privacy */}
          <SectionCard title="Privacy" icon={Shield} delay={0.08}>
            <SelectRow<LastSeenVisibility>
              label="Last seen"
              description="Who can see your last seen time"
              value={lastSeenVisibility}
              options={[
                { value: "everyone", label: "Everyone" },
                { value: "contacts", label: "Contacts only" },
                { value: "nobody", label: "Nobody" },
              ]}
              onChange={setLastSeenVisibility}
            />
            <ToggleRow
              label="Read receipts"
              description="Let others see when you've read their messages"
              checked={readReceiptsEnabled}
              onChange={setReadReceiptsEnabled}
            />
            <SelectRow<ProfileVisibility>
              label="Profile visibility"
              description="Who can see your profile and status"
              value={profileVisibility}
              options={[
                { value: "everyone", label: "Everyone" },
                { value: "contacts", label: "Contacts only" },
              ]}
              onChange={setProfileVisibility}
            />
          </SectionCard>

          {/* Appearance */}
          <SectionCard title="Appearance" icon={Palette} delay={0.1}>
            <div className="py-3 first:pt-0 border-b border-slate-100 dark:border-slate-600">
              <p className="text-slate-800 dark:text-slate-100 font-medium text-sm mb-2">Theme</p>
              <div className="flex gap-2" role="radiogroup" aria-label="Theme">
                {([
                  { value: "light" as Theme, icon: Sun, label: "Light" },
                  { value: "dark" as Theme, icon: Moon, label: "Dark" },
                  { value: "system" as Theme, icon: Monitor, label: "System" },
                ]).map(({ value, icon: Icon, label }) => (
                  <button
                    key={value}
                    type="button"
                    role="radio"
                    aria-checked={theme === value}
                    aria-label={label}
                    onClick={() => setTheme(value)}
                    className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500/20 ${
                      theme === value
                        ? "bg-primary-500 text-white shadow-sm"
                        : "bg-slate-100 dark:bg-slate-600 text-slate-600 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-500"
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {label}
                  </button>
                ))}
              </div>
            </div>
            <SelectRow<FontSize>
              label="Font size"
              value={fontSize}
              options={[
                { value: "small", label: "Small" },
                { value: "medium", label: "Medium" },
                { value: "large", label: "Large" },
              ]}
              onChange={setFontSize}
            />
            <SelectRow<ChatDensity>
              label="Chat density"
              description="Spacing of messages in chat"
              value={chatDensity}
              options={[
                { value: "comfortable", label: "Comfortable" },
                { value: "compact", label: "Compact" },
              ]}
              onChange={setChatDensity}
            />
          </SectionCard>

          {/* Chat & messaging */}
          <SectionCard title="Chat & messaging" icon={MessageSquare} delay={0.12}>
            <ToggleRow
              label="Enter to send"
              description="Press Enter to send; Shift+Enter for new line"
              checked={enterToSend}
              onChange={setEnterToSend}
            />
            <SelectRow<MediaAutoDownload>
              label="Media auto-download"
              value={mediaAutoDownload}
              options={[
                { value: "wifi", label: "Wi‑Fi only" },
                { value: "always", label: "Always" },
                { value: "never", label: "Never" },
              ]}
              onChange={setMediaAutoDownload}
            />
            <SelectRow<ImageQuality>
              label="Image quality"
              value={imageQuality}
              options={[
                { value: "standard", label: "Standard" },
                { value: "data_saver", label: "Data saver" },
              ]}
              onChange={setImageQuality}
            />
          </SectionCard>

          {/* Calls */}
          <SectionCard title="Calls" icon={Phone} delay={0.14}>
            <ToggleRow
              label="Call sound"
              description="Play ringtone for incoming calls"
              checked={callSoundEnabled}
              onChange={setCallSoundEnabled}
            />
          </SectionCard>

          {/* Data */}
          <SectionCard title="Data & storage" icon={Database} delay={0.16}>
            <div className="py-3 first:pt-0">
              <p className="text-slate-800 dark:text-slate-100 font-medium text-sm mb-1">Clear cache</p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-2">Remove cached images and data. App will reload if needed.</p>
              <button
                type="button"
                onClick={handleClearCache}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500/20 ${
                  clearCacheConfirm
                    ? "bg-amber-500 text-white hover:bg-amber-600"
                    : "bg-slate-100 dark:bg-slate-600 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-500"
                }`}
              >
                {clearCacheConfirm ? "Confirm clear cache" : "Clear cache"}
              </button>
            </div>
          </SectionCard>

          {/* Account */}
          <SectionCard title="Account" icon={User} delay={0.18}>
            <div className="space-y-3">
              <button
                type="button"
                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-700/50 border border-slate-200/60 dark:border-slate-600 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-600/50 transition-colors duration-200 text-sm font-medium focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500/20"
              >
                <Key className="w-5 h-5 text-slate-500 dark:text-slate-400" />
                Change password
              </button>
              <button
                type="button"
                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-700/50 border border-slate-200/60 dark:border-slate-600 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-600/50 transition-colors duration-200 text-sm font-medium focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500/20"
              >
                <LogOut className="w-5 h-5 text-slate-500 dark:text-slate-400" />
                Log out other sessions
              </button>
              <div className="pt-2">
                <p className="text-slate-800 dark:text-slate-100 font-medium text-sm mb-1">Delete account</p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mb-2">Permanently delete your account and all data. This cannot be undone.</p>
                <button
                  type="button"
                  onClick={() => setDeleteAccountConfirm(!deleteAccountConfirm)}
                  className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500/20 ${
                    deleteAccountConfirm ? "bg-rose-500 text-white hover:bg-rose-600" : "bg-rose-50 dark:bg-rose-900/30 text-rose-600 dark:text-rose-300 hover:bg-rose-100 dark:hover:bg-rose-900/50"
                  }`}
                >
                  {deleteAccountConfirm ? "Click again to confirm" : "Delete account"}
                </button>
              </div>
            </div>
          </SectionCard>

          {/* About */}
          <SectionCard title="About" icon={Info} delay={0.2}>
            <div className="space-y-2 text-sm text-slate-600 dark:text-slate-400">
              <p>
                <span className="font-medium text-slate-800 dark:text-slate-100">Let&apos;sChat</span> — Real-time messaging
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400">Version 1.0.0</p>
              <div className="flex gap-3 pt-2">
                <a href="#" className="text-primary-600 dark:text-primary-400 hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500/20 rounded">
                  Terms of service
                </a>
                <a href="#" className="text-primary-600 dark:text-primary-400 hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500/20 rounded">
                  Privacy policy
                </a>
                <a href="#" className="text-primary-600 dark:text-primary-400 hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500/20 rounded">
                  Help
                </a>
              </div>
            </div>
          </SectionCard>
        </div>
      </div>
    </div>
  );
}
