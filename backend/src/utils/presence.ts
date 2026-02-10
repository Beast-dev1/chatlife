import { PrismaClient } from "@prisma/client";
import { getRedisClients } from "../config/redis";

const prisma = new PrismaClient();

export const PRESENCE_ONLINE_KEY = "presence:online";
const USER_ROOM_PREFIX = "user:";

/** In-memory fallback when Redis is unavailable (e.g. dev without Redis) */
const inMemoryOnlineSet = new Set<string>();

export function userRoom(userId: string) {
  return `${USER_ROOM_PREFIX}${userId}`;
}

export function addOnlineUser(userId: string): void {
  inMemoryOnlineSet.add(userId);
}

export function removeOnlineUser(userId: string): void {
  inMemoryOnlineSet.delete(userId);
}

/**
 * User IDs that should be notified when this user goes online/offline:
 * - Members of chats that this user is in
 * - Users who have this user as a contact
 * Returns [] on error so callers (e.g. disconnect handler) can still complete.
 */
export async function getRelevantUserIds(userId: string): Promise<string[]> {
  try {
    const [chatMemberIds, contactOwnerIds] = await Promise.all([
      prisma.chatMember
        .findMany({
          where: {
            chat: { members: { some: { userId } } },
            userId: { not: userId },
          },
          select: { userId: true },
          distinct: ["userId"],
        })
        .then((rows) => rows.map((r) => r.userId)),
      prisma.contact
        .findMany({
          where: { contactUserId: userId },
          select: { userId: true },
        })
        .then((rows) => rows.map((r) => r.userId)),
    ]);

    const set = new Set<string>([...chatMemberIds, ...contactOwnerIds]);
    return Array.from(set);
  } catch (err) {
    console.error("Presence getRelevantUserIds:", err);
    return [];
  }
}

/**
 * Returns user IDs that are both (1) relevant to this user and (2) currently online.
 * Used to send initial presence to a connecting client.
 */
export async function getOnlineUserIdsRelevantTo(userId: string): Promise<string[]> {
  const relevantIds = await getRelevantUserIds(userId);
  const relevantSet = new Set(relevantIds);
  let onlineIds: string[] = [];
  try {
    const { pubClient } = await getRedisClients();
    onlineIds = await pubClient.sMembers(PRESENCE_ONLINE_KEY);
  } catch {
    onlineIds = Array.from(inMemoryOnlineSet);
  }
  return onlineIds.filter((id) => id !== userId && relevantSet.has(id));
}
