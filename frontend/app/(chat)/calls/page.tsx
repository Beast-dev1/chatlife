"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Phone } from "lucide-react";
import { useAuthStore } from "@/store/authStore";
import { useCalls } from "@/hooks/useCalls";
import CallLogCard, {
  type CallLogCardData,
  type CallLogStatus,
  type CallLogType,
} from "@/components/chat/CallLogCard";
import type { CallLogItem } from "@/types/call";

function mapCallToCardData(call: CallLogItem, currentUserId: string): CallLogCardData {
  const isOwnCall = call.callerId === currentUserId;
  let status: CallLogStatus = "completed";
  if (call.status === "MISSED") {
    status = "missed";
  } else if (call.status === "INITIATED" && isOwnCall) {
    status = "outgoing";
  } else if (call.status === "ENDED" || call.status === "ACCEPTED") {
    status = "completed";
  }

  return {
    id: call.id,
    type: call.callType === "VIDEO" ? "video" : "audio",
    status,
    duration: call.duration ?? undefined,
    createdAt: call.startedAt,
    callerId: call.callerId,
    isOwnCall,
  };
}

export default function CallsPage() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const { data, isLoading, error, fetchNextPage, hasNextPage, isFetchingNextPage } = useCalls();

  if (!user) return null;

  const items =
    data?.pages.flatMap((p) =>
      p.calls.map((c) => ({
        card: mapCallToCardData(c, user.id),
        chatId: c.chatId,
      }))
    ) ?? [];

  return (
    <div className="flex flex-col h-full bg-slate-900">
      <header className="px-4 py-3 border-b border-slate-700/50 bg-slate-800/80">
        <h1 className="font-semibold text-white">Call history</h1>
        <p className="text-xs text-slate-400 mt-0.5">Your recent calls</p>
      </header>

      <div className="flex-1 overflow-y-auto p-4">
        {isLoading && (
          <div className="flex justify-center py-12 text-slate-400 text-sm">
            Loading calls…
          </div>
        )}
        {error && (
          <div className="flex justify-center py-12 text-red-400 text-sm">
            Failed to load calls
          </div>
        )}
        {!isLoading && !error && items.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12 text-slate-400 text-sm text-center px-4">
            <Phone className="w-12 h-12 text-slate-600 mb-3" />
            <p>No calls yet</p>
            <p className="text-xs mt-1">Start a call from a chat to see history here.</p>
          </div>
        )}
        {calls.length > 0 && (
          <div className="space-y-2">
            {calls.map((call) => {
              const page = data?.pages.find((p) => p.calls.some((c) => c.id === call.id));
              const fullCall = page?.calls.find((c) => c.id === call.id);
              return (
                <div
                  key={call.id}
                  className="rounded-xl bg-slate-800/60 border border-slate-700/50 overflow-hidden"
                >
                  <CallLogCard
                    callLog={call}
                    onCallBack={
                      fullCall
                        ? () => router.push(`/chat/${fullCall.chatId}`)
                        : undefined
                    }
                  />
                </div>
              );
            })}
            {hasNextPage && (
              <div className="flex justify-center py-4">
                <button
                  type="button"
                  onClick={() => fetchNextPage()}
                  disabled={isFetchingNextPage}
                  className="px-4 py-2 rounded-lg bg-slate-700/50 text-slate-300 hover:bg-slate-700 disabled:opacity-50 text-sm"
                >
                  {isFetchingNextPage ? "Loading…" : "Load more"}
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="p-4 border-t border-slate-700/50">
        <Link
          href="/chat"
          className="block text-center text-sm text-emerald-400 hover:text-emerald-300"
        >
          Back to chats
        </Link>
      </div>
    </div>
  );
}
