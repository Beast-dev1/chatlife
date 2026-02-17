"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  X,
  Phone,
  Mail,
  Video,
  MoreHorizontal,
  UserPlus,
  LogOut,
  Pencil,
} from "lucide-react";
import { useChat, useUpdateChat, useAddMember, useRemoveMember, useDeleteChat } from "@/hooks/useChats";
import { useSearchUsers } from "@/hooks/useContacts";
import { useSocket } from "@/hooks/useSocket";
import { useAuthStore } from "@/store/authStore";
import { useFocusTrap } from "@/hooks/useFocusTrap";
import { useChatStore } from "@/store/chatStore";
import { useCallStore } from "@/store/callStore";
import { usePresenceStore } from "@/store/presenceStore";
import type { ChatWithDetails } from "@/types/chat";
import type { SearchUser } from "@/types/chat";

function getDisplayName(chat: ChatWithDetails | undefined, currentUserId: string): string {
  if (!chat) return "Chat";
  if (chat.name) return chat.name;
  const other = chat.members?.find((m) => m.userId !== currentUserId);
  return other?.user?.username ?? "Chat";
}

function getAvatarUrl(chat: ChatWithDetails | undefined, currentUserId: string): string | null {
  if (!chat) return null;
  if (chat.avatarUrl) return chat.avatarUrl;
  const other = chat.members?.find((m) => m.userId !== currentUserId);
  return other?.user?.avatarUrl ?? null;
}

function formatJoinedDate(iso: string): string {
  const d = new Date(iso);
  const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const day = days[d.getDay()];
  const date = d.getDate();
  const suffix = date === 1 || date === 21 || date === 31 ? "st" : date === 2 || date === 22 ? "nd" : date === 3 || date === 23 ? "rd" : "th";
  const month = d.toLocaleDateString("en-US", { month: "short" });
  const year = d.getFullYear();
  return `${day} ${date}${suffix} ${month} ${year}`;
}

function formatLastSeen(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const mins = Math.floor(diffMs / 60000);
  const hours = Math.floor(diffMs / 3600000);
  if (diffMs < 60000) return "Last seen just now";
  if (mins === 1) return "Last seen 1 min ago";
  if (diffMs < 3600000) return `Last seen ${mins} min ago`;
  if (hours === 1) return "Last seen 1 hr ago";
  if (diffMs < 86400000) return `Last seen ${hours} hr ago`;
  if (diffMs < 172800000) return "Last seen yesterday";
  return `Last seen ${d.toLocaleDateString()}`;
}

function DirectChatPanel({
  chatId,
  chat,
  user,
}: {
  chatId: string;
  chat: ChatWithDetails | undefined;
  user: { id: string; username: string; avatarUrl?: string | null };
}) {
  const { socket, isConnected } = useSocket();
  const activeCall = useCallStore((s) => s.activeCall);
  const incomingCall = useCallStore((s) => s.incomingCall);
  const isOnline = usePresenceStore((s) => s.isOnline);
  const getLastSeen = usePresenceStore((s) => s.getLastSeen);

  const name = getDisplayName(chat, user.id);
  const avatarUrl = getAvatarUrl(chat, user.id);
  const otherMember = chat?.members?.find((m) => m.userId !== user.id);
  const otherUserId = otherMember?.userId;
  const activeNow = otherUserId ? isOnline(otherUserId) : false;
  const lastSeenIso = otherUserId ? getLastSeen(otherUserId) : undefined;
  const joinedAt = otherMember?.joinedAt ?? "";

  const canCall =
    chat?.type === "DIRECT" &&
    !!otherUserId &&
    isConnected &&
    !activeCall &&
    !incomingCall;

  const handleStartCall = (callType: "audio" | "video") => {
    if (!socket || !chatId || !canCall) return;
    socket.emit("call_initiate", { chatId, callType });
  };

  const actions = [
    { icon: Phone, label: "Call", onClick: () => handleStartCall("audio") },
    { icon: Mail, label: "Email", onClick: undefined },
    { icon: Video, label: "Video", onClick: () => handleStartCall("video") },
    { icon: MoreHorizontal, label: "More", onClick: undefined },
  ];

  const details = [
    { label: "EMAIL", value: (otherMember?.user as { email?: string } | undefined)?.email ?? "—" },
    { label: "PHONE", value: "—" },
    { label: "ADDRESS", value: "—" },
    { label: "PLAN", value: "—" },
    { label: "JOINED", value: joinedAt ? formatJoinedDate(joinedAt) : "—" },
  ];

  return (
    <>
      <div className="flex-1 overflow-y-auto p-6">
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="flex flex-col items-center text-center mb-6"
        >
          <div className="p-1 rounded-full bg-gradient-to-br from-primary-400 via-primary-500 to-primary-600 shadow-soft mb-4">
            <div className="w-28 h-28 rounded-full bg-slate-100 overflow-hidden flex items-center justify-center ring-4 ring-white">
              {avatarUrl ? (
                <Image src={avatarUrl} alt="" width={112} height={112} className="w-full h-full object-cover" />
              ) : (
                <span className="text-4xl font-semibold text-slate-400">
                  {name.slice(0, 1).toUpperCase()}
                </span>
              )}
            </div>
          </div>
          <h2 className="text-lg font-bold text-slate-800 uppercase tracking-wide">{name}</h2>
          <p className={`flex items-center gap-1.5 mt-2 text-sm font-semibold ${activeNow ? "text-green-500" : "text-slate-500"}`}>
            <span className={`w-2 h-2 rounded-full ${activeNow ? "bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]" : "bg-slate-400"}`} />
            {activeNow ? "Active Now" : lastSeenIso ? formatLastSeen(lastSeenIso) : "Offline"}
          </p>
        </motion.div>

        <div className="flex justify-center gap-3 mb-8">
          {actions.map(({ icon: Icon, label, onClick }, i) => (
            <motion.button
              key={label}
              type="button"
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.08 + i * 0.03 }}
              whileHover={{ scale: 1.08 }}
              whileTap={{ scale: 0.95 }}
              onClick={onClick}
              disabled={onClick ? !canCall : false}
              className={`flex flex-col items-center gap-1.5 transition-colors ${
                onClick && canCall
                  ? "text-slate-600 hover:text-slate-800 cursor-pointer"
                  : onClick
                    ? "text-slate-400 cursor-not-allowed"
                    : "text-slate-600 hover:text-slate-800"
              }`}
            >
              <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center hover:bg-slate-200 transition-colors duration-200">
                <Icon className="w-5 h-5" />
              </div>
              <span className="text-xs font-semibold">{label}</span>
            </motion.button>
          ))}
        </div>

        <div className="space-y-4">
          {details.map(({ label, value }, i) => (
            <motion.div
              key={label}
              initial={{ opacity: 0, x: -4 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.12 + i * 0.02 }}
              className="rounded-xl bg-slate-50/80 px-4 py-3 border border-slate-100"
            >
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">{label}</p>
              <p className="text-sm text-slate-800 font-medium">{value}</p>
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.25 }}
          className="mt-8 pt-6 border-t border-slate-100"
        >
          <motion.button
            type="button"
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
            className="w-full py-3 rounded-xl bg-pink-100 text-pink-700 font-bold text-sm hover:bg-pink-200 transition-colors duration-200"
          >
            BLOCK
          </motion.button>
        </motion.div>
      </div>
    </>
  );
}

function GroupChatPanel({
  chatId,
  chat,
  user,
  setRightSidebarOpen,
}: {
  chatId: string;
  chat: ChatWithDetails;
  user: { id: string; username: string; avatarUrl?: string | null };
  setRightSidebarOpen: (open: boolean) => void;
}) {
  const router = useRouter();
  const updateChat = useUpdateChat(chatId);
  const addMember = useAddMember(chatId);
  const removeMember = useRemoveMember(chatId);
  const deleteChat = useDeleteChat(chatId);

  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(chat.name ?? "");
  const [editAvatarUrl, setEditAvatarUrl] = useState(chat.avatarUrl ?? "");
  const [addMemberOpen, setAddMemberOpen] = useState(false);
  const [addMemberSearch, setAddMemberSearch] = useState("");

  const { data: searchResults } = useSearchUsers(addMemberSearch);
  const memberIds = new Set(chat.members.map((m) => m.userId));
  const candidates: SearchUser[] = (searchResults ?? []).filter((u) => !memberIds.has(u.id) && u.id !== user.id);

  const currentMember = chat.members.find((m) => m.userId === user.id);
  const isAdmin = currentMember?.role === "admin";

  const handleSaveEdit = async () => {
    try {
      await updateChat.mutateAsync({
        name: editName.trim() || null,
        avatarUrl: editAvatarUrl.trim() || null,
      });
      setIsEditing(false);
    } catch {
      // Error could be shown via toast
    }
  };

  const handleAddMember = async (userId: string) => {
    try {
      await addMember.mutateAsync({ userId, role: "member" });
      setAddMemberOpen(false);
      setAddMemberSearch("");
    } catch {
      // Error could be shown via toast
    }
  };

  const handleRemoveMember = (userId: string) => {
    if (!confirm("Remove this member from the group?")) return;
    removeMember.mutate(userId, {
      onSuccess: (_, removedUserId) => {
        if (removedUserId === user.id) {
          setRightSidebarOpen(false);
          router.push("/chat");
        }
      },
    });
  };

  const handleLeave = () => {
    if (!confirm("Leave this group? You will stop receiving messages.")) return;
    removeMember.mutate(user.id, {
      onSuccess: () => {
        setRightSidebarOpen(false);
        router.push("/chat");
      },
    });
  };

  const handleDeleteGroup = () => {
    if (!confirm("Delete this group? This cannot be undone. All members will lose access.")) return;
    deleteChat.mutate(undefined, {
      onSuccess: () => {
        setRightSidebarOpen(false);
        router.push("/chat");
      },
    });
  };

  const displayName = chat.name || "Group";
  const displayAvatarUrl = chat.avatarUrl ?? null;

  return (
    <div className="flex-1 overflow-y-auto p-6 flex flex-col">
      {/* Group header with optional edit */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col items-center text-center mb-6"
      >
        <div className="p-1 rounded-full bg-gradient-to-br from-primary-400 via-primary-500 to-primary-600 shadow-soft mb-4">
          <div className="w-28 h-28 rounded-full bg-slate-100 overflow-hidden flex items-center justify-center ring-4 ring-white">
            {isEditing ? (
              <input
                type="text"
                value={editAvatarUrl}
                onChange={(e) => setEditAvatarUrl(e.target.value)}
                placeholder="Avatar URL"
                className="w-full h-full text-center text-xs bg-slate-200/80 px-2"
              />
            ) : displayAvatarUrl ? (
              <Image src={displayAvatarUrl} alt="" width={112} height={112} className="w-full h-full object-cover" />
            ) : (
              <span className="text-4xl font-semibold text-slate-400">
                {displayName.slice(0, 1).toUpperCase()}
              </span>
            )}
          </div>
        </div>

        {isEditing ? (
          <div className="w-full space-y-2 mt-2">
            <input
              type="text"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              placeholder="Group name"
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-800"
            />
            <div className="flex gap-2 justify-center">
              <button
                type="button"
                onClick={() => {
                  setEditName(chat.name ?? "");
                  setEditAvatarUrl(chat.avatarUrl ?? "");
                  setIsEditing(false);
                }}
                className="px-3 py-1.5 rounded-lg border border-slate-300 text-slate-600 text-sm"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveEdit}
                disabled={updateChat.isPending}
                className="px-3 py-1.5 rounded-lg bg-primary-500 text-white text-sm disabled:opacity-50"
              >
                {updateChat.isPending ? "Saving…" : "Save"}
              </button>
            </div>
          </div>
        ) : (
          <>
            <h2 className="text-lg font-bold text-slate-800 uppercase tracking-wide">{displayName}</h2>
            {isAdmin && (
              <button
                type="button"
                onClick={() => setIsEditing(true)}
                className="mt-2 flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700"
              >
                <Pencil className="w-4 h-4" />
                Edit name & photo
              </button>
            )}
          </>
        )}
      </motion.div>

      {/* Members */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
            Members ({chat.members.length})
          </span>
          {isAdmin && (
            <button
              type="button"
              onClick={() => setAddMemberOpen(!addMemberOpen)}
              className="flex items-center gap-1.5 text-sm text-primary-600 hover:text-primary-700 font-medium"
            >
              <UserPlus className="w-4 h-4" />
              Add member
            </button>
          )}
        </div>

        {addMemberOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            className="mb-3 rounded-xl bg-slate-50/80 border border-slate-100 p-3"
          >
            <input
              type="text"
              placeholder="Search by username or email"
              value={addMemberSearch}
              onChange={(e) => setAddMemberSearch(e.target.value)}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-800 placeholder-slate-400 mb-2"
            />
            <div className="max-h-32 overflow-y-auto space-y-1">
              {addMemberSearch.trim().length < 1 ? (
                <p className="text-xs text-slate-500">Type to search users</p>
              ) : (
                candidates.slice(0, 8).map((u) => (
                  <button
                    key={u.id}
                    type="button"
                    onClick={() => handleAddMember(u.id)}
                    disabled={addMember.isPending}
                    className="w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-left hover:bg-slate-200/80 text-slate-800 disabled:opacity-50"
                  >
                    <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center flex-shrink-0">
                      {u.avatarUrl ? (
                        <Image src={u.avatarUrl} alt="" width={32} height={32} className="w-full h-full rounded-full object-cover" />
                      ) : (
                        <span className="text-xs text-slate-500">{u.username.slice(0, 1).toUpperCase()}</span>
                      )}
                    </div>
                    <span className="text-sm font-medium truncate">{u.username}</span>
                  </button>
                ))
              )}
            </div>
          </motion.div>
        )}

        <ul className="space-y-2">
          {chat.members.map((m) => {
            const isSelf = m.userId === user.id;
            return (
              <li
                key={m.id}
                className="flex items-center gap-3 rounded-xl bg-slate-50/80 px-3 py-2 border border-slate-100"
              >
                <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center flex-shrink-0 overflow-hidden">
                  {m.user.avatarUrl ? (
                    <Image src={m.user.avatarUrl} alt="" width={40} height={40} className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-sm font-semibold text-slate-500">
                      {m.user.username?.slice(0, 1).toUpperCase() ?? "?"}
                    </span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-800 truncate">{m.user.username}</p>
                  <span className="text-xs text-slate-500">{m.role === "admin" ? "Admin" : "Member"}</span>
                </div>
                <div className="flex items-center gap-1">
                  {isSelf ? (
                    <button
                      type="button"
                      onClick={handleLeave}
                      disabled={removeMember.isPending}
                      className="p-2 rounded-lg text-slate-500 hover:bg-red-50 hover:text-red-600 transition-colors"
                      title="Leave group"
                    >
                      <LogOut className="w-4 h-4" />
                    </button>
                  ) : isAdmin ? (
                    <button
                      type="button"
                      onClick={() => handleRemoveMember(m.userId)}
                      disabled={removeMember.isPending}
                      className="p-2 rounded-lg text-slate-500 hover:bg-red-50 hover:text-red-600 transition-colors"
                      title="Remove member"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  ) : null}
                </div>
              </li>
            );
          })}
        </ul>
      </div>

      {/* Leave group (for non-admin) and Delete group (admin) */}
      <div className="mt-auto pt-6 border-t border-slate-100 space-y-2">
        {!isAdmin && (
          <button
            type="button"
            onClick={handleLeave}
            disabled={removeMember.isPending}
            className="w-full py-3 rounded-xl border border-slate-300 text-slate-600 font-medium text-sm hover:bg-slate-50 transition-colors disabled:opacity-50"
          >
            {removeMember.isPending ? "Leaving…" : "Leave group"}
          </button>
        )}
        {isAdmin && (
          <button
            type="button"
            onClick={handleDeleteGroup}
            disabled={deleteChat.isPending}
            className="w-full py-3 rounded-xl bg-red-100 text-red-700 font-bold text-sm hover:bg-red-200 transition-colors disabled:opacity-50"
          >
            {deleteChat.isPending ? "Deleting…" : "Delete group"}
          </button>
        )}
      </div>
    </div>
  );
}

export default function ChatInfoSidebar({ chatId }: { chatId: string | null }) {
  const user = useAuthStore((s) => s.user);
  const { data: chat } = useChat(chatId);
  const setRightSidebarOpen = useChatStore((s) => s.setRightSidebarOpen);
  const containerRef = useRef<HTMLElement>(null);
  const closeSidebar = () => setRightSidebarOpen(false);
  useFocusTrap(containerRef, true, closeSidebar);

  if (!chatId || !user) return null;

  return (
    <motion.aside
      ref={containerRef}
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      transition={{ duration: 0.2 }}
      role="dialog"
      aria-modal="true"
      aria-label="Chat info"
      className="w-80 min-w-[280px] max-w-[360px] bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm shadow-edge-l flex flex-col rounded-l-2xl shadow-soft"
    >
      <div className="p-3 shadow-edge-b flex items-center justify-between shrink-0">
        <a href="#" className="text-sm font-semibold text-slate-600 hover:text-primary-500 transition-colors duration-200">
          {chat?.type === "GROUP" ? "Group info" : "NEED HELP"}
        </a>
        <div className="flex items-center gap-1">
          <div className="w-9 h-9 rounded-full bg-slate-100 overflow-hidden flex items-center justify-center ring-2 ring-white shadow-inner">
            {user.avatarUrl ? (
              <Image src={user.avatarUrl} alt="" width={36} height={36} className="w-full h-full object-cover" />
            ) : (
              <span className="text-sm font-semibold text-slate-500">{user.username?.slice(0, 1).toUpperCase()}</span>
            )}
          </div>
        </div>
      </div>

      {chat?.type === "GROUP" ? (
        <GroupChatPanel
          chatId={chatId}
          chat={chat}
          user={user}
          setRightSidebarOpen={setRightSidebarOpen}
        />
      ) : (
        <DirectChatPanel chatId={chatId} chat={chat} user={user} />
      )}

      <div className="p-2 shadow-edge-t flex justify-end shrink-0">
        <motion.button
          type="button"
          onClick={closeSidebar}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="p-2.5 rounded-xl text-slate-500 hover:bg-slate-100 hover:text-slate-700 transition-colors"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </motion.button>
      </div>
    </motion.aside>
  );
}
