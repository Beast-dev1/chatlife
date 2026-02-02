"use client";

import { motion } from "framer-motion";
import { MessageCircle } from "lucide-react";
import { useAuthStore } from "@/store/authStore";

export default function ChatPage() {
  const user = useAuthStore((s) => s.user);

  if (!user) return null;

  return (
    <div className="flex flex-col h-full items-center justify-center bg-gradient-to-b from-slate-50/40 to-white/60 rounded-2xl">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: "easeOut" }}
        className="flex flex-col items-center text-center px-8"
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.1, duration: 0.3 }}
          className="w-24 h-24 rounded-2xl bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center mb-5 shadow-soft border border-slate-200/60"
        >
          <MessageCircle className="w-12 h-12 text-slate-500" />
        </motion.div>
        <h2 className="text-xl font-semibold text-slate-800 mb-2">Select a chat</h2>
        <p className="text-slate-500 text-sm max-w-xs font-medium">
          Choose a conversation from the list or start a new chat to get started.
        </p>
      </motion.div>
    </div>
  );
}
