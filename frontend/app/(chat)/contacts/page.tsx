"use client";

import { useState } from "react";
import { useContacts, useSearchUsers, useAddContact } from "@/hooks/useContacts";
import type { ContactWithUser, SearchUser } from "@/types/chat";

export default function ContactsPage() {
  const [searchQ, setSearchQ] = useState("");
  const { data: contacts, isLoading } = useContacts();
  const { data: searchResults } = useSearchUsers(searchQ);
  const addContact = useAddContact();

  const showSearch = searchQ.length >= 1;
  const searchUsers: SearchUser[] = searchResults ?? [];
  const contactUserIds = new Set(contacts?.map((c) => c.contactUserId) ?? []);

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b border-slate-700/50">
        <h1 className="text-xl font-semibold text-white mb-3">Contacts</h1>
        <input
          type="text"
          placeholder="Search by username or email"
          value={searchQ}
          onChange={(e) => setSearchQ(e.target.value)}
          className="w-full rounded-lg bg-slate-700 border border-slate-600 px-3 py-2 text-slate-100 placeholder-slate-500"
        />
      </div>
      <div className="flex-1 overflow-y-auto p-2">
        {showSearch && (
          <div className="mb-4">
            <h2 className="text-sm font-medium text-slate-500 px-2 mb-2">Search results</h2>
            {searchUsers.length === 0 && (
              <p className="text-slate-500 text-sm px-2">No users found</p>
            )}
            {searchUsers.map((u) => (
              <div
                key={u.id}
                className="flex items-center justify-between gap-3 px-3 py-2 rounded-lg hover:bg-slate-700/50"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-full bg-slate-600 flex items-center justify-center flex-shrink-0">
                    {u.avatarUrl ? (
                      <img src={u.avatarUrl} alt="" className="w-full h-full rounded-full object-cover" />
                    ) : (
                      <span className="text-slate-400">{u.username.slice(0, 1).toUpperCase()}</span>
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="font-medium text-white truncate">{u.username}</p>
                    <p className="text-xs text-slate-500 truncate">{u.email}</p>
                  </div>
                </div>
                {contactUserIds.has(u.id) ? (
                  <span className="text-xs text-slate-500">Added</span>
                ) : (
                  <button
                    type="button"
                    onClick={() => addContact.mutate(u.id)}
                    disabled={addContact.isPending}
                    className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-sm disabled:opacity-50"
                  >
                    Add
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
        <h2 className="text-sm font-medium text-slate-500 px-2 mb-2">Your contacts</h2>
        {isLoading && (
          <p className="text-slate-500 text-sm px-2">Loading…</p>
        )}
        {!isLoading && (!contacts || contacts.length === 0) && !showSearch && (
          <p className="text-slate-500 text-sm px-2">No contacts yet. Search and add someone!</p>
        )}
        {contacts && contacts.length > 0 && (
          <div className="space-y-1">
            {contacts.map((c: ContactWithUser) => (
              <div
                key={c.id}
                className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-slate-700/50"
              >
                <div className="w-10 h-10 rounded-full bg-slate-600 flex items-center justify-center flex-shrink-0">
                  {c.contact.avatarUrl ? (
                    <img src={c.contact.avatarUrl} alt="" className="w-full h-full rounded-full object-cover" />
                  ) : (
                    <span className="text-slate-400">{c.contact.username.slice(0, 1).toUpperCase()}</span>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-white truncate">{c.contact.username}</p>
                  <p className="text-xs text-slate-500">{c.status}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
