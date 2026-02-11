"use client";

import { useRef, useState } from "react";
import Image from "next/image";
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div ref={containerRef} className="w-full max-w-md rounded-2xl bg-slate-800 border border-slate-700 shadow-xl" role="dialog" aria-modal="true" aria-label="New chat">
        <div className="flex items-center justify-between p-4 border-b border-slate-700">
          <h2 className="text-lg font-semibold text-white">New chat</h2>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-lg text-slate-400 hover:bg-slate-700 hover:text-white"
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
                className="flex-1 flex flex-col items-center gap-2 p-4 rounded-xl border border-slate-600 hover:bg-slate-700/50 text-slate-200"
              >
                <User className="w-10 h-10 text-emerald-400" />
                <span>1:1 Chat</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setChatType("GROUP");
                  setStep("select");
                  setSelectedIds([]);
                }}
                className="flex-1 flex flex-col items-center gap-2 p-4 rounded-xl border border-slate-600 hover:bg-slate-700/50 text-slate-200"
              >
                <Users className="w-10 h-10 text-emerald-400" />
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
                className="w-full rounded-lg bg-slate-700 border border-slate-600 px-3 py-2 text-slate-100 placeholder-slate-500 mb-3"
              />
              <div className="max-h-48 overflow-y-auto space-y-1 mb-4">
                {candidates.map((u) => (
                  <button
                    key={u.id}
                    type="button"
                    onClick={() => toggleUser(u.id)}
                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left ${
                      selectedIds.includes(u.id) ? "bg-emerald-500/20 text-emerald-300" : "hover:bg-slate-700/50 text-slate-200"
                    }`}
                  >
                    <div className="w-9 h-9 rounded-full bg-slate-600 flex items-center justify-center">
                      {u.avatarUrl ? (
                        <Image src={u.avatarUrl} alt="" width={36} height={36} className="w-full h-full rounded-full object-cover" />
                      ) : (
                        <span className="text-sm text-slate-400">{u.username.slice(0, 1).toUpperCase()}</span>
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
                  className="px-4 py-2 rounded-lg border border-slate-600 text-slate-300 hover:bg-slate-700"
                >
                  Back
                </button>
                {chatType === "GROUP" ? (
                  <button
                    type="button"
                    onClick={() => selectedIds.length > 0 && setStep("name")}
                    disabled={selectedIds.length === 0}
                    className="flex-1 px-4 py-2 rounded-lg bg-emerald-600 text-white disabled:opacity-50"
                  >
                    Next
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleCreate}
                    disabled={selectedIds.length !== 1 || createChat.isPending}
                    aria-busy={createChat.isPending}
                    className="flex-1 px-4 py-2 rounded-lg bg-emerald-600 text-white disabled:opacity-50"
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
                className="w-full rounded-lg bg-slate-700 border border-slate-600 px-3 py-2 text-slate-100 placeholder-slate-500 mb-4"
              />
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setStep("select")}
                  className="px-4 py-2 rounded-lg border border-slate-600 text-slate-300 hover:bg-slate-700"
                >
                  Back
                </button>
                <button
                  type="button"
                  onClick={handleCreate}
                  disabled={createChat.isPending}
                  aria-busy={createChat.isPending}
                  className="flex-1 px-4 py-2 rounded-lg bg-emerald-600 text-white disabled:opacity-50"
                >
                  {createChat.isPending ? "Creating…" : "Create group"}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
