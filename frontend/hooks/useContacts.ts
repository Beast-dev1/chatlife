"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type {
  ContactWithUser,
  IncomingRequestWithUser,
  SearchUser,
} from "@/types/chat";

const CONTACTS_QUERY_KEY = ["contacts"];
const CONTACT_REQUESTS_QUERY_KEY = ["contacts", "requests"];

export function useContacts() {
  return useQuery({
    queryKey: CONTACTS_QUERY_KEY,
    queryFn: () => api.get<ContactWithUser[]>("/api/contacts"),
  });
}

export function useContactRequests() {
  return useQuery({
    queryKey: CONTACT_REQUESTS_QUERY_KEY,
    queryFn: () =>
      api.get<IncomingRequestWithUser[]>("/api/contacts/requests"),
  });
}

export function useSearchUsers(q: string) {
  return useQuery({
    queryKey: ["users", "search", q],
    queryFn: () => api.get<SearchUser[]>(`/api/users/search?q=${encodeURIComponent(q)}&limit=20`),
    enabled: q.length >= 1,
  });
}

export function useAddContact() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (contactUserId: string) =>
      api.post<ContactWithUser>("/api/contacts", { contactUserId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CONTACTS_QUERY_KEY });
    },
  });
}

export function useUpdateContact() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      api.put<ContactWithUser>(`/api/contacts/${id}`, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CONTACTS_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: CONTACT_REQUESTS_QUERY_KEY });
    },
  });
}

export function useDeleteContact() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/api/contacts/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CONTACTS_QUERY_KEY });
    },
  });
}

export function contactsQueryKey() {
  return CONTACTS_QUERY_KEY;
}
