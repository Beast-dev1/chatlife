"use client";

import { motion, useReducedMotion } from "framer-motion";
import { MessageCircle } from "lucide-react";
import { useAuthStore } from "@/store/authStore";

export default function ChatPage() {
  const user = useAuthStore((s) => s.user);
  const reduceMotion = useReducedMotion();

  if (!user) return null;

  return (
    <div className="flex flex-col h-full items-center justify-center bg-gradient-to-b from-muted/30 to-background rounded-2xl">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: reduceMotion ? 0 : 0.35, ease: "easeOut" }}
        className="flex flex-col items-center text-center px-8"
      >
        <motion.div
          initial={reduceMotion ? false : { scale: 0.9, opacity: 0 }}
          animate={{
            scale: 1,
            opacity: 1,
            ...(reduceMotion ? {} : { y: [0, -4, 0] }),
          }}
          transition={
            reduceMotion
              ? { duration: 0 }
              : {
                  scale: { delay: 0.1, duration: 0.3 },
                  opacity: { delay: 0.1, duration: 0.3 },
                  y: { repeat: Infinity, duration: 2.5, ease: "easeInOut" },
                }
          }
          className="w-24 h-24 rounded-2xl bg-muted flex items-center justify-center mb-5 shadow-soft border border-border"
        >
          <MessageCircle className="w-12 h-12 text-muted-foreground" />
        </motion.div>
        <h2 className="text-xl font-semibold text-foreground mb-2">Select a chat</h2>
        <p className="text-muted-foreground text-sm max-w-xs font-medium">
          Choose a conversation from the list or start a new chat to get started.
        </p>
      </motion.div>
    </div>
  );
}
