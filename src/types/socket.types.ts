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
 * PROJECT EVENTS (matches backend exactly)
 * ==========================================
 */

/**
 * Join Project Data (matches backend JoinProjectData)
 */
export interface JoinProjectData {
  projectId: string;
  token: string;
}

/**
 * Join Project Response (matches backend response)
 */
export interface JoinProjectResponse {
  success: boolean;
  activeUsers?: ActiveUser[];
  error?: string;
}

/**
 * Leave Project Data (matches backend LeaveProjectData)
 */
export interface LeaveProjectData {
  projectId: string;
}

/**
 * User Joined Event (matches backend emit)
 */
export interface UserJoinedEvent {
  userId: string;
  username: string;
  timestamp: string;
}

/**
 * User Left Event (matches backend emit)
 */
export interface UserLeftEvent {
  userId: string;
  username: string;
  timestamp: string;
}

/**
 * ==========================================
 * CAMERA EVENTS (matches backend exactly)
 * ==========================================
 */

/**
 * Camera Update Data (matches backend CameraUpdateData)
 */
export interface CameraUpdateData {
  projectId: string;
  cameraState: Partial<CameraState>;
  userId: string;
  username: string;
}

/**
 * Camera Update Event (matches backend broadcast)
 */
export interface CameraUpdateEvent {
  projectId: string;
  cameraState: Partial<CameraState>;
  userId: string;
  username: string;
  timestamp: string;
}

/**
 * ==========================================
 * ANNOTATION EVENTS (matches backend exactly)
 * ==========================================
 */

/**
 * Attachment Type (matches backend AttachmentType)
 */
export type AnnotationAttachmentType = "vertex" | "edge" | "face" | "position";

/**
 * Annotation Style (matches backend AnnotationStyle)
 */
export type AnnotationStyle = "pin" | "arrow" | "note" | "marker";

/**
 * Create Annotation Data (matches backend CreateAnnotationData)
 */
export interface CreateAnnotationData {
  projectId: string;
  modelId?: string;
  text: string;
  position: Vector3;
  attachmentType?: AnnotationAttachmentType;
  style?: AnnotationStyle;
  color?: string;
}

/**
 * Annotation Created Event (matches backend broadcast)
 */
export interface AnnotationCreatedEvent {
  projectId: string;
  annotation: any; // Full annotation object from backend
  userId: string;
  username: string;
  timestamp: string;
}

/**
 * Update Annotation Data (matches backend UpdateAnnotationData)
 */
export interface UpdateAnnotationData {
  projectId: string;
  annotationId: string;
  updates: {
    text?: string;
    position?: Vector3;
    attachmentType?: AnnotationAttachmentType;
    style?: AnnotationStyle;
    color?: string;
    visible?: boolean;
  };
}

/**
 * Annotation Updated Event (matches backend broadcast)
 */
export interface AnnotationUpdatedEvent {
  projectId: string;
  annotationId: string;
  updates: {
    text?: string;
    position?: Vector3;
    attachmentType?: AnnotationAttachmentType;
    style?: AnnotationStyle;
    color?: string;
    visible?: boolean;
  };
  userId: string;
  username: string;
  timestamp: string;
}

/**
 * Delete Annotation Data (matches backend DeleteAnnotationData)
 */
export interface DeleteAnnotationData {
  projectId: string;
  annotationId: string;
}

/**
 * Annotation Deleted Event (matches backend broadcast)
 */
export interface AnnotationDeletedEvent {
  projectId: string;
  annotationId: string;
  userId: string;
  username: string;
  timestamp: string;
}

/**
 * ==========================================
 * CHAT EVENTS (matches backend exactly)
 * ==========================================
 */

/**
 * Chat Message Data (matches backend ChatMessageData)
 */
export interface ChatMessageData {
  projectId: string;
  message: string;
}

/**
 * Chat Message Response (matches backend callback)
 */
export interface ChatMessageResponse {
  success: boolean;
  message?: any; // Full message object from backend
  error?: string;
}

/**
 * Chat Message Event (matches backend broadcast)
 */
export interface ChatMessageEvent {
  projectId: string;
  message: any; // Full message object from backend
  timestamp: string;
}

/**
 * Typing Data (matches backend TypingData)
 */
export interface TypingData {
  projectId: string;
  isTyping: boolean;
}

/**
 * Typing Event (matches backend broadcast)
 */
export interface TypingEvent {
  projectId: string;
  userId: string;
  username: string;
  isTyping: boolean;
}

/**
 * ==========================================
 * CLIENT TO SERVER EVENTS (matches backend handlers)
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
    callback: (response: ChatMessageResponse) => void
  ) => void;
  "chat:typing": (data: TypingData) => void;
}

/**
 * ==========================================
 * SERVER TO CLIENT EVENTS (matches backend emits)
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
  "chat:typing": (data: TypingEvent) => void;

  // Error events
  error: (data: { message: string; code: string; details?: string }) => void;

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

  // Error
  ERROR: "error",
} as const;
