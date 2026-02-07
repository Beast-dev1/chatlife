// Shared TypeScript types for Let'sChat

export type ChatType = "DIRECT" | "GROUP";
export type MessageType = "TEXT" | "IMAGE" | "FILE" | "AUDIO" | "VIDEO";
export type ContactStatus = "PENDING" | "ACCEPTED" | "BLOCKED";
export type CallStatus =
  | "INITIATED"
  | "ACCEPTED"
  | "REJECTED"
  | "ENDED"
  | "MISSED";

export interface User {
  id: string;
  email: string;
  username: string;
  avatarUrl?: string | null;
  status?: string | null;
  bio?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserPublic {
  id: string;
  email: string;
  username: string;
  avatarUrl?: string | null;
  status?: string | null;
  bio?: string | null;
}

export interface Chat {
  id: string;
  type: ChatType;
  name?: string | null;
  avatarUrl?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface MessageReplyTo {
  id: string;
  content: string | null;
  senderId: string;
  sender: { id: string; username: string };
}

export interface Message {
  id: string;
  chatId: string;
  senderId: string;
  type: MessageType;
  content?: string | null;
  fileUrl?: string | null;
  replyToId?: string | null;
  replyTo?: MessageReplyTo | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}
