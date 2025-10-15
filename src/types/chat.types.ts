/**
 * Message Type
 * Different types of chat messages
 */
export type MessageType = "text" | "system" | "notification";

/**
 * Chat Message Interface
 * Represents a message in the chat
 */
export interface ChatMessage {
  id: string;
  projectId: string;
  userId?: string;
  username?: string;
  message: string;
  type: MessageType;
  metadata?: {
    action?: string;
    [key: string]: any;
  };
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Send Message Input
 */
export interface SendMessageInput {
  projectId: string;
  message: string;
}

/**
 * Get Messages Input
 */
export interface GetMessagesInput {
  projectId?: string;
  limit?: number;
  skip?: number;
  type?: MessageType | "all";
}

/**
 * Chat Message Event (from Socket.IO)
 */
export interface ChatMessageEvent {
  messageId?: string;
  projectId: string;
  userId: string;
  username: string;
  message: string | ChatMessage;
  type?: MessageType;
  timestamp: string;
}

/**
 * Typing Event (from Socket.IO)
 */
export interface TypingEvent {
  userId: string;
  username: string;
  isTyping: boolean;
}

/**
 * Message Action Metadata
 */
export type MessageAction =
  | "user_joined"
  | "user_left"
  | "annotation_created"
  | "model_added";

/**
 * System Message Metadata
 */
export interface SystemMessageMetadata {
  action: MessageAction;
  username?: string;
  [key: string]: any;
}

/**
 * Default Message Limits
 */
export const DEFAULT_MESSAGE_LIMIT = 50;
export const MAX_MESSAGE_LIMIT = 100;
export const MAX_MESSAGE_LENGTH = 1000;

/**
 * Message Type Colors (for UI)
 */
export const MESSAGE_TYPE_COLORS = {
  text: "text-foreground",
  system: "text-muted-foreground",
  notification: "text-blue-500",
} as const;
