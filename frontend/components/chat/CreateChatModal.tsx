"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { AnimatePresence, motion } from "framer-motion";
import { X, Users, User } from "lucide-react";
import { useCreateChat } from "@/hooks/useChats";
import { useContacts, useSearchUsers } from "@/hooks/useContacts";
import { useFocusTrap } from "@/hooks/useFocusTrap";
import type { SearchUser } from "@/types/chat";

export default function CreateChatModal({
  onClose,
  onCreated,
}: {
  onClose: () => void;
  onCreated: (chatId: string) => void;
}) {
  const [step, setStep] = useState<"type" | "select" | "name">("type");
  const [chatType, setChatType] = useState<"DIRECT" | "GROUP">("DIRECT");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [searchQ, setSearchQ] = useState("");
  const [groupName, setGroupName] = useState("");
  const createChat = useCreateChat();
  const { data: contacts } = useContacts();
  const { data: searchResults } = useSearchUsers(searchQ);

  const candidates: SearchUser[] = searchQ.length >= 1
    ? (searchResults ?? [])
    : (contacts?.map((c) => c.contact) ?? []);

  const toggleUser = (id: string) => {
    if (chatType === "DIRECT") {
      setSelectedIds([id]);
      return;
    }
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const handleCreate = async () => {
    if (chatType === "DIRECT" && selectedIds.length !== 1) return;
    if (chatType === "GROUP" && selectedIds.length === 0) return;
    try {
      const chat = await createChat.mutateAsync({
        type: chatType,
        memberIds: selectedIds,
        name: chatType === "GROUP" ? groupName || undefined : undefined,
      });
      onCreated(chat.id);
      onClose();
    } catch {
      // error handled by mutation
    }
  };

  const containerRef = useRef<HTMLDivElement>(null);
  useFocusTrap(containerRef, true, onClose);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
    >
      <motion.div
        ref={containerRef}
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.98 }}
        transition={{ duration: 0.2, ease: "easeOut" }}
        className="w-full max-w-md rounded-2xl bg-popover border border-border shadow-modal"
        role="dialog"
        aria-modal="true"
        aria-label="New chat"
      >
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h2 className="text-title font-semibold text-popover-foreground">New chat</h2>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-muted-foreground hover:bg-muted hover:text-foreground transition-colors duration-normal"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-4">
          {step === "type" && (
            <div className="flex gap-4">
              <button
                type="button"
                onClick={() => {
                  setChatType("DIRECT");
                  setStep("select");
                  setSelectedIds([]);
                }}
                className="flex-1 flex flex-col items-center gap-2 p-4 rounded-xl border border-input hover:bg-muted/50 text-foreground transition-colors duration-normal"
              >
                <User className="w-10 h-10 text-primary-500" />
                <span>1:1 Chat</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setChatType("GROUP");
                  setStep("select");
                  setSelectedIds([]);
                }}
                className="flex-1 flex flex-col items-center gap-2 p-4 rounded-xl border border-input hover:bg-muted/50 text-foreground transition-colors duration-normal"
              >
                <Users className="w-10 h-10 text-primary-500" />
                <span>Group</span>
              </button>
            </div>
          )}
          {step === "select" && (
            <>
              <input
                type="text"
                placeholder="Search by username or email"
                value={searchQ}
                onChange={(e) => setSearchQ(e.target.value)}
                className="w-full rounded-xl bg-background border border-input px-3 py-2 text-foreground placeholder-muted-foreground mb-3 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all duration-normal"
              />
              <div className="max-h-48 overflow-y-auto scrollbar-thin space-y-1 mb-4">
                {candidates.map((u) => (
                  <button
                    key={u.id}
                    type="button"
                    onClick={() => toggleUser(u.id)}
                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-left transition-colors duration-normal ${
                      selectedIds.includes(u.id) ? "bg-primary-500/20 text-primary-600 dark:text-primary-400" : "hover:bg-muted text-foreground"
                    }`}
                  >
                    <div className="w-9 h-9 rounded-full bg-muted flex items-center justify-center">
                      {u.avatarUrl ? (
                        <Image src={u.avatarUrl} alt="" width={36} height={36} className="w-full h-full rounded-full object-cover" />
                      ) : (
                        <span className="text-body text-muted-foreground">{u.username.slice(0, 1).toUpperCase()}</span>
                      )}
                    </div>
                    <span className="font-medium">{u.username}</span>
                  </button>
                ))}
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setStep("type")}
                  className="px-4 py-2 rounded-xl border border-input text-foreground hover:bg-muted transition-colors duration-normal"
                >
                  Back
                </button>
                {chatType === "GROUP" ? (
                  <button
                    type="button"
                    onClick={() => selectedIds.length > 0 && setStep("name")}
                    disabled={selectedIds.length === 0}
                    className="flex-1 px-4 py-2 rounded-xl bg-primary-500 text-white hover:bg-primary-600 disabled:opacity-50 transition-colors duration-normal"
                  >
                    Next
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleCreate}
                    disabled={selectedIds.length !== 1 || createChat.isPending}
                    aria-busy={createChat.isPending}
                    className="flex-1 px-4 py-2 rounded-xl bg-primary-500 text-white hover:bg-primary-600 disabled:opacity-50 transition-colors duration-normal"
                  >
                    {createChat.isPending ? "Creating…" : "Create chat"}
                  </button>
                )}
              </div>
            </>
          )}
          {step === "name" && chatType === "GROUP" && (
            <>
              <input
                type="text"
                placeholder="Group name"
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
                className="w-full rounded-xl bg-background border border-input px-3 py-2 text-foreground placeholder-muted-foreground mb-4 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all duration-normal"
              />
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setStep("select")}
                  className="px-4 py-2 rounded-xl border border-input text-foreground hover:bg-muted transition-colors duration-normal"
                >
                  Back
                </button>
                <button
                  type="button"
                  onClick={handleCreate}
                  disabled={createChat.isPending}
                  aria-busy={createChat.isPending}
                  className="flex-1 px-4 py-2 rounded-xl bg-primary-500 text-white hover:bg-primary-600 disabled:opacity-50 transition-colors duration-normal"
                >
                  {createChat.isPending ? "Creating…" : "Create group"}
                </button>
              </div>
            </>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}
