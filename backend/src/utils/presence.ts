import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export const PRESENCE_ONLINE_KEY = "presence:online";
const USER_ROOM_PREFIX = "user:";

export function userRoom(userId: string) {
  return `${USER_ROOM_PREFIX}${userId}`;
}

/**
 * User IDs that should be notified when this user goes online/offline:
 * - Members of chats that this user is in
 * - Users who have this user as a contact
 */
export async function getRelevantUserIds(userId: string): Promise<string[]> {
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
}
