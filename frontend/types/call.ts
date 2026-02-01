export type CallLogStatusBackend =
  | "INITIATED"
  | "ACCEPTED"
  | "REJECTED"
  | "ENDED"
  | "MISSED";

export interface CallLogItem {
  id: string;
  chatId: string;
  callerId: string;
  calleeId: string | null;
  callType: "AUDIO" | "VIDEO";
  status: CallLogStatusBackend;
  startedAt: string;
  endedAt: string | null;
  duration: number | null;
  chat: { id: string; type: string; name: string | null };
  caller: { id: string; username: string; avatarUrl: string | null };
  callee: { id: string; username: string; avatarUrl: string | null } | null;
}

export interface CallsListResponse {
  calls: CallLogItem[];
  nextCursor: string | null;
  hasMore: boolean;
}
