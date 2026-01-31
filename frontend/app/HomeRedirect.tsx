"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/authStore";

export default function HomeRedirect() {
  const router = useRouter();
  const { user, isInitialized, init } = useAuthStore();

  useEffect(() => {
    init();
  }, [init]);

  useEffect(() => {
    if (!isInitialized) return;
    router.replace(user ? "/chat" : "/login");
  }, [user, isInitialized, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-900">
      <div className="animate-pulse text-slate-400">Loading...</div>
    </div>
  );
}
