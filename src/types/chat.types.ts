/**
 * Message Type (matches backend exactly)
 */
export type MessageType = "text" | "system" | "notification";

/**
 * Chat Message Interface (matches backend IChatMessage)
 */
export interface ChatMessage {
  _id: string; // Backend uses _id
  id?: string; // Frontend transformed field
  projectId: string;
  userId?:
    | string
    | {
        _id: string;
        username: string;
      };
  username?: string; // Fallback field
  message: string;
  type: MessageType;
  metadata?: {
    action?: string;
    [key: string]: any;
  };
  createdAt: string; // Backend sends ISO string
  updatedAt: string; // Backend sends ISO string
}

/**
 * Frontend Chat Message (for UI display)
 */
export interface ChatMessageDisplay
  extends Omit<ChatMessage, "createdAt" | "updatedAt"> {
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Send Message Input (matches backend SendMessageInput)
 */
export interface SendMessageInput {
  projectId: string;
  message: string;
}

/**
 * Get Messages Input (matches backend GetMessagesInput)
 */
export interface GetMessagesInput {
  projectId: string;
  limit?: number;
  skip?: number;
  type?: MessageType | "all";
}

/**
 * Message Action Metadata (matches backend)
 */
export type MessageAction =
  | "user_joined"
  | "user_left"
  | "annotation_created"
  | "model_added";

/**
 * System Message Metadata (matches backend)
 */
export interface SystemMessageMetadata {
  action: MessageAction;
  username?: string;
  [key: string]: any;
}

/**
 * Default Message Limits (matches backend)
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

/**
 * Transform backend message to frontend format
 */
export function transformChatMessage(
  backendMessage: ChatMessage
): ChatMessageDisplay {
  return {
    ...backendMessage,
    id: backendMessage._id,
    createdAt: new Date(backendMessage.createdAt),
    updatedAt: new Date(backendMessage.updatedAt),
  };
}

/**
 * Get username from message
 */
export function getChatMessageUsername(message: ChatMessage): string {
  if (typeof message.userId === "object") {
    return message.userId.username;
  }
  return message.username || "Unknown";
}
