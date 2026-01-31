"use client";

import { User } from "lucide-react";
import { useAuthStore } from "@/store/authStore";

export default function ProfilePage() {
  const user = useAuthStore((s) => s.user);
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

          <p className="mt-6 text-sm text-slate-500">
            Profile editing will be enhanced in later phases.
          </p>
        </div>
      </div>
    </div>
  );
}
