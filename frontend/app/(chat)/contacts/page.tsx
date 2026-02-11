"use client";

import { useState } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { Users, Search, UserPlus, MessageCircle, Loader2, UserCheck, UserX } from "lucide-react";
import { useContacts, useContactRequests, useSearchUsers, useAddContact, useUpdateContact } from "@/hooks/useContacts";
import { useCreateChat } from "@/hooks/useChats";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/authStore";
import type { ContactWithUser, IncomingRequestWithUser, SearchUser } from "@/types/chat";

export default function ContactsPage() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const [searchQ, setSearchQ] = useState("");
  const { data: contacts, isLoading } = useContacts();
  const { data: requests = [] } = useContactRequests();
  const { data: searchResults } = useSearchUsers(searchQ);
  const addContact = useAddContact();
  const updateContact = useUpdateContact();
  const createChat = useCreateChat();

  const showSearch = searchQ.length >= 1;
  const searchUsers: SearchUser[] = searchResults ?? [];
  const contactUserIds = new Set(
    contacts?.map((c) => (c.userId === user?.id ? c.contactUserId : c.userId)) ?? []
  );

  const getOtherUser = (c: ContactWithUser) => c.contact ?? c.user!;
  const getOtherUserId = (c: ContactWithUser) =>
    c.userId === user?.id ? c.contactUserId : c.userId;

  const handleMessage = async (userId: string) => {
    try {
      const chat = await createChat.mutateAsync({
        type: "DIRECT",
        memberIds: [userId],
      });
      router.push(`/chat/${chat.id}`);
    } catch {
      // error handled by mutation
    }
  };

  return (
    <div className="flex flex-col h-full bg-gradient-to-b from-slate-50/40 to-white/60 rounded-2xl overflow-hidden">
      {/* Header */}
      <motion.header
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: "easeOut" }}
        className="shrink-0 px-6 pt-6 pb-4 border-b border-slate-200/70 bg-white/50 backdrop-blur-sm"
      >
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center shadow-soft border border-slate-200/60">
            <Users className="w-6 h-6 text-slate-500" />
          </div>
          <div>
            <h1 className="text-xl font-semibold text-slate-800 tracking-tight">Contacts</h1>
            <p className="text-sm text-slate-500">Find and manage your contacts</p>
          </div>
        </div>
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <input
            type="text"
            placeholder="Search by username or email"
            value={searchQ}
            onChange={(e) => setSearchQ(e.target.value)}
            className="w-full rounded-xl bg-white border border-slate-200/80 pl-10 pr-4 py-2.5 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-400/50 transition-all duration-200 shadow-inner"
          />
        </div>
      </motion.header>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-4 py-4 min-h-0">
        <AnimatePresence mode="wait">
          {!showSearch && requests.length > 0 && (
            <motion.section
              key="requests"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.25 }}
              className="mb-6"
            >
              <h2 className="text-sm font-medium text-slate-500 px-2 mb-3 flex items-center gap-2">
                <UserPlus className="w-4 h-4" />
                Connection requests
                <span className="ml-1.5 px-2 py-0.5 rounded-full bg-primary-500/15 text-primary-600 text-xs font-semibold">
                  {requests.length}
                </span>
              </h2>
              <div className="space-y-2">
                {(requests as IncomingRequestWithUser[]).map((req, i) => (
                  <motion.div
                    key={req.id}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.04, duration: 0.25 }}
                    className="flex items-center justify-between gap-3 px-4 py-3 rounded-xl bg-white/90 border border-slate-200/60 shadow-soft hover:shadow-glow hover:border-slate-200 transition-all duration-200"
                  >
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center flex-shrink-0 overflow-hidden border border-slate-200/60">
                        {req.user.avatarUrl ? (
                          <Image src={req.user.avatarUrl} alt="" width={44} height={44} className="w-full h-full object-cover" />
                        ) : (
                          <span className="text-base font-semibold text-slate-500">{req.user.username.slice(0, 1).toUpperCase()}</span>
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="font-medium text-slate-800 truncate">{req.user.username}</p>
                        <p className="text-xs text-slate-500 truncate">{req.user.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => updateContact.mutate({ id: req.id, status: "BLOCKED" })}
                        disabled={updateContact.isPending && updateContact.variables?.id === req.id}
                        className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-slate-600 hover:bg-slate-100 border border-slate-200/80 text-sm font-medium transition-all duration-200 disabled:opacity-50"
                        aria-label="Decline"
                      >
                        {updateContact.isPending && updateContact.variables?.id === req.id ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <UserX className="w-4 h-4" />
                        )}
                        Decline
                      </button>
                      <button
                        type="button"
                        onClick={() => updateContact.mutate({ id: req.id, status: "ACCEPTED" })}
                        disabled={updateContact.isPending && updateContact.variables?.id === req.id}
                        className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-gradient-to-br from-primary-500 to-primary-600 text-white text-sm font-medium shadow-soft hover:shadow-glow disabled:opacity-50 transition-all duration-200"
                        aria-label="Accept"
                      >
                        {updateContact.isPending && updateContact.variables?.id === req.id ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <UserCheck className="w-4 h-4" />
                        )}
                        Accept
                      </button>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.section>
          )}

          {showSearch && (
            <motion.section
              key="search"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.25 }}
              className="mb-6"
            >
              <h2 className="text-sm font-medium text-slate-500 px-2 mb-3 flex items-center gap-2">
                <Search className="w-4 h-4" />
                Search results
              </h2>
              {searchUsers.length === 0 && (
                <div className="rounded-2xl bg-white/80 border border-slate-200/60 px-4 py-8 text-center">
                  <p className="text-slate-500 text-sm">No users found</p>
                </div>
              )}
              <div className="space-y-2">
                {searchUsers.map((u, i) => (
                  <motion.div
                    key={u.id}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.04, duration: 0.25 }}
                    className="flex items-center justify-between gap-3 px-4 py-3 rounded-xl bg-white/90 border border-slate-200/60 shadow-soft hover:shadow-glow hover:border-slate-200 transition-all duration-200"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center flex-shrink-0 overflow-hidden border border-slate-200/60">
                        {u.avatarUrl ? (
                          <Image src={u.avatarUrl} alt="" width={44} height={44} className="w-full h-full object-cover" />
                        ) : (
                          <span className="text-base font-semibold text-slate-500">{u.username.slice(0, 1).toUpperCase()}</span>
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="font-medium text-slate-800 truncate">{u.username}</p>
                        <p className="text-xs text-slate-500 truncate">{u.email}</p>
                      </div>
                    </div>
                    {contactUserIds.has(u.id) ? (
                      <span className="text-xs font-medium text-slate-400 bg-slate-100 px-2.5 py-1 rounded-lg">Added</span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => addContact.mutate(u.id)}
                        disabled={addContact.isPending}
                        className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-gradient-to-br from-primary-500 to-primary-600 text-white text-sm font-medium shadow-soft hover:shadow-glow disabled:opacity-50 transition-all duration-200"
                      >
                        {addContact.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />}
                        Add
                      </button>
                    )}
                  </motion.div>
                ))}
              </div>
            </motion.section>
          )}

          <motion.section
            key="contacts"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
          >
            <h2 className="text-sm font-medium text-slate-500 px-2 mb-3 flex items-center gap-2">
              <Users className="w-4 h-4" />
              Your contacts
            </h2>
            {isLoading && (
              <div className="flex flex-col items-center justify-center py-12 gap-3">
                <div className="flex gap-1.5">
                  {[0, 1, 2].map((j) => (
                    <span
                      key={j}
                      className="w-2.5 h-2.5 rounded-full bg-primary-400 animate-bounce"
                      style={{ animationDelay: `${j * 0.12}s` }}
                    />
                  ))}
                </div>
                <p className="text-sm text-slate-500">Loading contacts…</p>
              </div>
            )}
            {!isLoading && (!contacts || contacts.length === 0) && !showSearch && (
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-col items-center text-center py-12 px-6 rounded-2xl bg-white/60 border border-slate-200/60"
              >
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center mb-4 shadow-soft border border-slate-200/60">
                  <Users className="w-8 h-8 text-slate-400" />
                </div>
                <p className="text-slate-600 font-medium mb-1">No contacts yet</p>
                <p className="text-sm text-slate-500 max-w-xs">Search above and add someone to get started.</p>
              </motion.div>
            )}
            {contacts && contacts.length > 0 && (
              <div className="space-y-2">
                {contacts.map((c: ContactWithUser, i: number) => {
                  const other = getOtherUser(c);
                  const otherId = getOtherUserId(c);
                  const isAccepted = c.status === "ACCEPTED";
                  const isPendingOutgoing = c.status === "PENDING" && c.userId === user?.id;
                  return (
                    <motion.div
                      key={c.id}
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.03, duration: 0.25 }}
                      className="flex items-center justify-between gap-3 px-4 py-3 rounded-xl bg-white/90 border border-slate-200/60 shadow-soft hover:shadow-glow hover:border-slate-200 transition-all duration-200 group"
                    >
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center flex-shrink-0 overflow-hidden border border-slate-200/60">
                          {other.avatarUrl ? (
                            <Image src={other.avatarUrl} alt="" width={44} height={44} className="w-full h-full object-cover" />
                          ) : (
                            <span className="text-base font-semibold text-slate-500">{other.username.slice(0, 1).toUpperCase()}</span>
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="font-medium text-slate-800 truncate">{other.username}</p>
                          <div className="flex items-center gap-2 flex-wrap">
                            {isPendingOutgoing && (
                              <span className="text-xs font-medium text-amber-600 bg-amber-50 px-2 py-0.5 rounded-lg border border-amber-200/80">
                                Pending
                              </span>
                            )}
                            {isAccepted && (
                              <span className="text-xs text-slate-500">Connected</span>
                            )}
                          </div>
                        </div>
                      </div>
                      {isAccepted && (
                        <button
                          type="button"
                          onClick={() => handleMessage(otherId)}
                          disabled={createChat.isPending}
                          className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-slate-600 hover:bg-primary-500 hover:text-white text-sm font-medium transition-all duration-200 opacity-0 group-hover:opacity-100 focus:opacity-100 disabled:opacity-50"
                          aria-label="Message"
                        >
                          {createChat.isPending ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <>
                              <MessageCircle className="w-4 h-4" />
                              Message
                            </>
                          )}
                        </button>
                      )}
                    </motion.div>
                  );
                })}
              </div>
            )}
          </motion.section>
        </AnimatePresence>
      </div>
    </div>
  );
}
