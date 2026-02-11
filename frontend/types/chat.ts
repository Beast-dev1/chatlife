export type ChatType = "DIRECT" | "GROUP";
export type MessageType = "TEXT" | "IMAGE" | "FILE" | "AUDIO" | "VIDEO";

export interface UserBrief {
  id: string;
  username: string;
  avatarUrl?: string | null;
  status?: string | null;
}

export interface ChatMemberWithUser {
  id: string;
  chatId: string;
  userId: string;
  role: string;
  joinedAt: string;
  lastReadAt: string | null;
  user: UserBrief;
}

export interface LastMessage {
  id: string;
  chatId: string;
  senderId: string;
  type: MessageType;
  content: string | null;
  fileUrl: string | null;
  createdAt: string;
  updatedAt: string;
  sender: { id: string; username: string };
}

export interface ChatWithDetails {
  id: string;
  type: ChatType;
  name: string | null;
  avatarUrl: string | null;
  createdAt: string;
  updatedAt: string;
  members: ChatMemberWithUser[];
  messages: LastMessage[];
}

export interface MessageReadItem {
  id: string;
  messageId: string;
  userId: string;
  readAt: string;
}

export interface MessageReaction {
  id: string;
  messageId: string;
  userId: string;
  emoji: string;
  createdAt: string;
  user: UserBrief;
}

export interface MessageReplyTo {
  id: string;
  content: string | null;
  senderId: string;
  sender: { id: string; username: string };
}

export interface MessageWithSender {
  id: string;
  chatId: string;
  senderId: string;
  type: MessageType;
  content: string | null;
  fileUrl: string | null;
  replyToId?: string | null;
  replyTo?: MessageReplyTo | null;
  createdAt: string;
  updatedAt: string;
  sender: UserBrief;
  reads: MessageReadItem[];
  reactions: MessageReaction[];
}

export interface MessagesResponse {
  messages: MessageWithSender[];
  nextCursor: string | null;
  hasMore: boolean;
}

export interface ContactWithUser {
  id: string;
  userId: string;
  contactUserId: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  contact: {
    id: string;
    username: string;
    email: string;
    avatarUrl: string | null;
    status: string | null;
  };
  /** Present when this row is "received" (contactUserId = me); the requester */
  user?: {
    id: string;
    username: string;
    email: string;
    avatarUrl: string | null;
    status: string | null;
  };
}

export interface IncomingRequestWithUser {
  id: string;
  userId: string;
  contactUserId: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  user: {
    id: string;
    username: string;
    email: string;
    avatarUrl: string | null;
    status: string | null;
  };
}

export interface SearchUser {
  id: string;
  username: string;
  email: string;
  avatarUrl: string | null;
  status: string | null;
}
