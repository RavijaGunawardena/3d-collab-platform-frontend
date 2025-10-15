import { CameraState, Vector3 } from "./project.types";

/**
 * Socket Connection Status
 */
export type SocketStatus =
  | "disconnected"
  | "connecting"
  | "connected"
  | "error";

/**
 * User Info Interface
 */
export interface SocketUser {
  userId: string;
  username: string;
}

/**
 * Active User in Project
 */
export interface ActiveUser extends SocketUser {
  socketId?: string;
}

/**
 * ==========================================
 * PROJECT EVENTS
 * ==========================================
 */

/**
 * Join Project Data
 */
export interface JoinProjectData {
  projectId: string;
  token: string;
}

/**
 * Join Project Response
 */
export interface JoinProjectResponse {
  success: boolean;
  activeUsers?: ActiveUser[];
  error?: string;
}

/**
 * Leave Project Data
 */
export interface LeaveProjectData {
  projectId: string;
}

/**
 * User Joined Event
 */
export interface UserJoinedEvent {
  userId: string;
  username: string;
  timestamp: string;
}

/**
 * User Left Event
 */
export interface UserLeftEvent {
  userId: string;
  username: string;
  timestamp: string;
}

/**
 * ==========================================
 * CAMERA EVENTS
 * ==========================================
 */

/**
 * Camera Update Data
 */
export interface CameraUpdateData {
  projectId: string;
  cameraState: Partial<CameraState>;
  userId: string;
  username: string;
}

/**
 * Camera Update Event (broadcast)
 */
export interface CameraUpdateEvent {
  userId: string;
  username: string;
  cameraState: Partial<CameraState>;
  timestamp: string;
}

/**
 * ==========================================
 * ANNOTATION EVENTS
 * ==========================================
 */

/**
 * Annotation Attachment Type
 */
export type AnnotationAttachmentType = "edge" | "face" | "vertex" | "random";

/**
 * Create Annotation Data
 */
export interface CreateAnnotationData {
  projectId: string;
  position: Vector3;
  text: string;
  attachmentType: AnnotationAttachmentType;
  modelId?: string;
}

/**
 * Annotation Created Event
 */
export interface AnnotationCreatedEvent {
  annotationId: string;
  projectId: string;
  userId: string;
  username: string;
  position: Vector3;
  text: string;
  attachmentType: AnnotationAttachmentType;
  modelId?: string;
  createdAt: string;
}

/**
 * Update Annotation Data
 */
export interface UpdateAnnotationData {
  projectId: string;
  annotationId: string;
  text?: string;
  position?: Vector3;
}

/**
 * Annotation Updated Event
 */
export interface AnnotationUpdatedEvent {
  annotationId: string;
  projectId: string;
  userId: string;
  username: string;
  updates: {
    text?: string;
    position?: Vector3;
  };
  timestamp: string;
}

/**
 * Delete Annotation Data
 */
export interface DeleteAnnotationData {
  projectId: string;
  annotationId: string;
}

/**
 * Annotation Deleted Event
 */
export interface AnnotationDeletedEvent {
  annotationId: string;
  projectId: string;
  userId: string;
  username: string;
  timestamp: string;
}

/**
 * ==========================================
 * CHAT EVENTS
 * ==========================================
 */

/**
 * Chat Message Data
 */
export interface ChatMessageData {
  projectId: string;
  message: string;
}

/**
 * Chat Message Event
 */
export interface ChatMessageEvent {
  messageId: string;
  projectId: string;
  userId: string;
  username: string;
  message: string;
  type: "user" | "system";
  timestamp: string;
}

/**
 * Chat Typing Data
 */
export interface ChatTypingData {
  projectId: string;
  isTyping: boolean;
}

/**
 * Chat Typing Event
 */
export interface ChatTypingEvent {
  userId: string;
  username: string;
  isTyping: boolean;
}

/**
 * ==========================================
 * CLIENT TO SERVER EVENTS
 * ==========================================
 */
export interface ClientToServerEvents {
  // Project events
  "project:join": (
    data: JoinProjectData,
    callback: (response: JoinProjectResponse) => void
  ) => void;
  "project:leave": (data: LeaveProjectData) => void;

  // Camera events
  "camera:update": (data: CameraUpdateData) => void;

  // Annotation events
  "annotation:create": (
    data: CreateAnnotationData,
    callback: (response: any) => void
  ) => void;
  "annotation:update": (data: UpdateAnnotationData) => void;
  "annotation:delete": (data: DeleteAnnotationData) => void;

  // Chat events
  "chat:message": (
    data: ChatMessageData,
    callback: (response: any) => void
  ) => void;
  "chat:typing": (data: ChatTypingData) => void;
}

/**
 * ==========================================
 * SERVER TO CLIENT EVENTS
 * ==========================================
 */
export interface ServerToClientEvents {
  // Project events
  "project:user-joined": (data: UserJoinedEvent) => void;
  "project:user-left": (data: UserLeftEvent) => void;

  // Camera events
  "camera:updated": (data: CameraUpdateEvent) => void;

  // Annotation events
  "annotation:created": (data: AnnotationCreatedEvent) => void;
  "annotation:updated": (data: AnnotationUpdatedEvent) => void;
  "annotation:deleted": (data: AnnotationDeletedEvent) => void;

  // Chat events
  "chat:message": (data: ChatMessageEvent) => void;
  "chat:typing": (data: ChatTypingEvent) => void;

  // Connection events
  connect: () => void;
  disconnect: () => void;
  connect_error: (error: Error) => void;
}

/**
 * ==========================================
 * SOCKET EVENT NAMES
 * ==========================================
 */
export const SOCKET_EVENTS = {
  // Connection
  CONNECT: "connect",
  DISCONNECT: "disconnect",
  CONNECT_ERROR: "connect_error",

  // Project
  PROJECT_JOIN: "project:join",
  PROJECT_LEAVE: "project:leave",
  PROJECT_USER_JOINED: "project:user-joined",
  PROJECT_USER_LEFT: "project:user-left",

  // Camera
  CAMERA_UPDATE: "camera:update",
  CAMERA_UPDATED: "camera:updated",

  // Annotation
  ANNOTATION_CREATE: "annotation:create",
  ANNOTATION_CREATED: "annotation:created",
  ANNOTATION_UPDATE: "annotation:update",
  ANNOTATION_UPDATED: "annotation:updated",
  ANNOTATION_DELETE: "annotation:delete",
  ANNOTATION_DELETED: "annotation:deleted",

  // Chat
  CHAT_MESSAGE: "chat:message",
  CHAT_TYPING: "chat:typing",
} as const;
