"use client";

import { useRef, useState } from "react";
import { motion } from "framer-motion";
import { User, Bell, Mail, Pencil, FileText, Sparkles, Loader2, Check, X } from "lucide-react";
import { useAuthStore } from "@/store/authStore";
import { useSettingsStore } from "@/store/settingsStore";
import { uploadFile } from "@/lib/api";
import { uploadDisplayUrl } from "@/lib/utils";
import Image from "next/image";

const MAX_AVATAR_SIZE = 10 * 1024 * 1024; // 10MB
const IMAGE_TYPES = ["image/jpeg", "image/png", "image/gif", "image/webp"];
const STATUS_MAX = 100;
const BIO_MAX = 500;

export default function ProfilePage() {
  const user = useAuthStore((s) => s.user);
  const updateProfile = useAuthStore((s) => s.updateProfile);
  const notificationsEnabled = useSettingsStore((s) => s.notificationsEnabled);
  const browserNotificationsEnabled = useSettingsStore((s) => s.browserNotificationsEnabled);
  const setNotificationsEnabled = useSettingsStore((s) => s.setNotificationsEnabled);
  const setBrowserNotificationsEnabled = useSettingsStore((s) => s.setBrowserNotificationsEnabled);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [avatarLoading, setAvatarLoading] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [editingField, setEditingField] = useState<"status" | "bio" | null>(null);
  const [editStatusValue, setEditStatusValue] = useState("");
  const [editBioValue, setEditBioValue] = useState("");
  const [fieldSaving, setFieldSaving] = useState(false);

  const requestNotificationPermission = () => {
    if (typeof window !== "undefined" && "Notification" in window && Notification.permission === "default") {
      Notification.requestPermission();
    }
  };

  const handleAvatarClick = () => {
    setProfileError(null);
    fileInputRef.current?.click();
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = "";

    if (!IMAGE_TYPES.includes(file.type)) {
      setProfileError("Please choose a JPEG, PNG, GIF, or WebP image.");
      return;
    }
    if (file.size > MAX_AVATAR_SIZE) {
      setProfileError("Image must be 10MB or smaller.");
      return;
    }

    setAvatarLoading(true);
    setProfileError(null);
    try {
      const { url } = await uploadFile(file);
      const avatarUrl = url.startsWith("http") ? url : (typeof window !== "undefined" ? window.location.origin : "") + url;
      await updateProfile({ avatarUrl });
    } catch (err) {
      setProfileError(err instanceof Error ? err.message : "Failed to update photo.");
    } finally {
      setAvatarLoading(false);
    }
  };

  const startEditStatus = () => {
    setEditingField("status");
    setEditStatusValue(user?.status ?? "");
    setProfileError(null);
  };
  const startEditBio = () => {
    setEditingField("bio");
    setEditBioValue(user?.bio ?? "");
    setProfileError(null);
  };
  const cancelEdit = () => {
    setEditingField(null);
    setFieldSaving(false);
  };
  const saveStatus = async () => {
    const value = editStatusValue.trim().slice(0, STATUS_MAX);
    setFieldSaving(true);
    setProfileError(null);
    try {
      await updateProfile({ status: value || null });
      setEditingField(null);
    } catch (err) {
      setProfileError(err instanceof Error ? err.message : "Failed to update status.");
    } finally {
      setFieldSaving(false);
    }
  };
  const saveBio = async () => {
    const value = editBioValue.trim().slice(0, BIO_MAX);
    setFieldSaving(true);
    setProfileError(null);
    try {
      await updateProfile({ bio: value || null });
      setEditingField(null);
    } catch (err) {
      setProfileError(err instanceof Error ? err.message : "Failed to update bio.");
    } finally {
      setFieldSaving(false);
    }
  };

  if (!user) return null;

  const fieldRows: { icon: React.ReactNode; label: string; value: string; editable?: boolean; field?: "status" | "bio" }[] = [
    { icon: <User className="w-5 h-5 text-slate-500" />, label: "Name", value: user.username },
    { icon: <Mail className="w-5 h-5 text-slate-500" />, label: "Email address", value: user.email },
    { icon: <Sparkles className="w-5 h-5 text-slate-500" />, label: "Status", value: user.status || "—", editable: true, field: "status" },
    { icon: <FileText className="w-5 h-5 text-slate-500" />, label: "Bio", value: user.bio || "—", editable: true, field: "bio" },
  ];

  return (
    <div className="flex flex-col h-full bg-gradient-to-b from-slate-50/40 to-white/60 rounded-2xl overflow-y-auto">
      <div className="flex-1 max-w-2xl mx-auto w-full">
        {/* Header */}
        <motion.header
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease: "easeOut" }}
          className="px-4 pt-6 sm:px-6 pb-4"
        >
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Profile</h1>
          <div className="mt-3 h-px bg-slate-200/80" />
        </motion.header>

        {/* Banner + profile picture */}
        <motion.section
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05, duration: 0.35, ease: "easeOut" }}
          className="px-4 sm:px-6"
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            aria-hidden
            onChange={handleAvatarChange}
          />
          <div className="relative h-28 sm:h-32 rounded-2xl bg-gradient-to-br from-slate-100 via-slate-100 to-slate-200/90 border border-slate-200/60 flex items-center overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-primary-50/40 via-transparent to-slate-100/50" />
            <div className="relative flex items-center gap-4 pl-5 sm:pl-6">
              <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-white border-4 border-white shadow-soft overflow-hidden flex-shrink-0 ring-2 ring-slate-200/60">
                {avatarLoading ? (
                  <div className="w-full h-full flex items-center justify-center bg-slate-100">
                    <Loader2 className="w-10 h-10 text-slate-500 animate-spin" />
                  </div>
                ) : user.avatarUrl ? (
                  <Image src={uploadDisplayUrl(user.avatarUrl)} alt="" width={96} height={96} className="w-full h-full object-cover" unoptimized />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-slate-200 to-slate-300 flex items-center justify-center">
                    <User className="w-10 h-10 sm:w-12 sm:h-12 text-slate-500" />
                  </div>
                )}
              </div>
              <div className="min-w-0">
                <p className="font-semibold text-slate-800 text-lg truncate">{user.username}</p>
                <p className="text-sm text-slate-500 truncate">{user.email}</p>
              </div>
            </div>
            <button
              type="button"
              aria-label="Edit profile photo"
              disabled={avatarLoading}
              onClick={handleAvatarClick}
              className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/90 border border-slate-200/80 shadow-soft flex items-center justify-center text-slate-600 hover:text-primary-600 hover:bg-white hover:border-primary-200/80 transition-all duration-200 disabled:opacity-60 disabled:pointer-events-none"
            >
              <Pencil className="w-4 h-4" />
            </button>
          </div>
          {profileError && (
            <p className="mt-2 text-sm text-red-600 px-1" role="alert">
              {profileError}
            </p>
          )}
        </motion.section>

        {/* Field list */}
        <motion.section
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.35, ease: "easeOut" }}
          className="mt-6 px-4 sm:px-6 pb-6"
        >
          <div className="rounded-2xl bg-white/90 border border-slate-200/60 shadow-soft overflow-hidden">
            {fieldRows.map((row, i) => {
              const isEditing = row.field && editingField === row.field;
              return (
                <div
                  key={row.label}
                  className={`flex items-start gap-4 px-4 sm:px-5 py-4 ${i < fieldRows.length - 1 ? "border-b border-slate-100" : ""}`}
                >
                  <div className="flex-shrink-0 mt-0.5">{row.icon}</div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-0.5">{row.label}</p>
                    {row.field === "status" && isEditing ? (
                      <div className="space-y-2">
                        <input
                          type="text"
                          value={editStatusValue}
                          onChange={(e) => setEditStatusValue(e.target.value.slice(0, STATUS_MAX))}
                          placeholder="Hey there! I am using Let'sChat"
                          maxLength={STATUS_MAX}
                          className="w-full px-3 py-2 text-slate-800 font-medium border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 outline-none"
                          autoFocus
                        />
                        <p className="text-xs text-slate-500">{editStatusValue.length}/{STATUS_MAX}</p>
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={saveStatus}
                            disabled={fieldSaving}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary-500 text-white text-sm font-medium hover:bg-primary-600 disabled:opacity-60"
                          >
                            {fieldSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                            Save
                          </button>
                          <button type="button" onClick={cancelEdit} disabled={fieldSaving} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 text-slate-700 text-sm font-medium hover:bg-slate-200">
                            <X className="w-4 h-4" /> Cancel
                          </button>
                        </div>
                      </div>
                    ) : row.field === "bio" && isEditing ? (
                      <div className="space-y-2">
                        <textarea
                          value={editBioValue}
                          onChange={(e) => setEditBioValue(e.target.value.slice(0, BIO_MAX))}
                          placeholder="Tell others about yourself"
                          maxLength={BIO_MAX}
                          rows={3}
                          className="w-full px-3 py-2 text-slate-800 font-medium border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 outline-none resize-y"
                          autoFocus
                        />
                        <p className="text-xs text-slate-500">{editBioValue.length}/{BIO_MAX}</p>
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={saveBio}
                            disabled={fieldSaving}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary-500 text-white text-sm font-medium hover:bg-primary-600 disabled:opacity-60"
                          >
                            {fieldSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                            Save
                          </button>
                          <button type="button" onClick={cancelEdit} disabled={fieldSaving} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 text-slate-700 text-sm font-medium hover:bg-slate-200">
                            <X className="w-4 h-4" /> Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <p className="text-slate-800 font-medium break-words">{row.value}</p>
                        {row.label === "Name" && (
                          <p className="text-xs text-slate-500 mt-1.5">
                            Name and email are visible to your contacts and can be updated in account settings.
                          </p>
                        )}
                      </>
                    )}
                  </div>
                  {row.editable && !isEditing && (
                    <button
                      type="button"
                      aria-label={`Edit ${row.label}`}
                      onClick={row.field === "status" ? startEditStatus : row.field === "bio" ? startEditBio : undefined}
                      className="flex-shrink-0 w-9 h-9 rounded-full bg-slate-100 border border-slate-200/60 flex items-center justify-center text-slate-500 hover:text-primary-600 hover:bg-primary-50 hover:border-primary-200/80 transition-all duration-200"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </motion.section>

        {/* Notifications */}
        <motion.section
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15, duration: 0.35, ease: "easeOut" }}
          className="px-4 sm:px-6 pb-8"
        >
          <div className="rounded-2xl bg-white/90 border border-slate-200/60 shadow-soft overflow-hidden">
            <div className="flex items-center gap-2 px-4 sm:px-5 py-3.5 border-b border-slate-100 bg-slate-50/50">
              <Bell className="w-5 h-5 text-slate-500" />
              <h3 className="text-sm font-semibold text-slate-800">Notifications</h3>
            </div>
            <div className="p-4 sm:p-5 space-y-4">
              <label className="flex items-center justify-between gap-4 p-3 rounded-xl bg-slate-50/80 border border-slate-200/60 cursor-pointer hover:bg-slate-50 transition-colors duration-200">
                <span className="text-slate-700 text-sm">In-app toasts when a new message arrives (tab focused)</span>
                <input
                  type="checkbox"
                  checked={notificationsEnabled}
                  onChange={(e) => setNotificationsEnabled(e.target.checked)}
                  className="rounded border-slate-300 bg-white text-primary-500 focus:ring-primary-500/20 focus:ring-2"
                />
              </label>
              <label className="flex items-center justify-between gap-4 p-3 rounded-xl bg-slate-50/80 border border-slate-200/60 cursor-pointer hover:bg-slate-50 transition-colors duration-200">
                <span className="text-slate-700 text-sm">Browser notifications when tab is in background</span>
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
          </div>
        </motion.section>
      </div>
    </div>
  );
}
