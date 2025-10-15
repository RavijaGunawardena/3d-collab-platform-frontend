import { Vector3 } from "./project.types";

/**
 * Annotation Attachment Type
 * Where the annotation is attached on the 3D model
 */
export type AnnotationAttachmentType = "vertex" | "edge" | "face" | "position";

/**
 * Annotation Style Type
 * Visual representation of the annotation
 */
export type AnnotationStyle = "pin" | "arrow" | "note" | "marker";

/**
 * Annotation Interface
 * Represents an annotation on a 3D model
 */
export interface Annotation {
  id: string;
  projectId: string;
  modelId?: string;
  userId:
    | string
    | {
        _id: string;
        username: string;
      };
  username?: string;
  text: string;
  position: Vector3;
  attachmentType: AnnotationAttachmentType;
  style: AnnotationStyle;
  color?: string;
  visible: boolean;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Create Annotation Input
 */
export interface CreateAnnotationInput {
  projectId: string;
  modelId?: string;
  text: string;
  position: Vector3;
  attachmentType?: AnnotationAttachmentType;
  style?: AnnotationStyle;
  color?: string;
  visible?: boolean;
}

/**
 * Update Annotation Input
 */
export interface UpdateAnnotationInput {
  text?: string;
  position?: Vector3;
  attachmentType?: AnnotationAttachmentType;
  style?: AnnotationStyle;
  color?: string;
  visible?: boolean;
}

/**
 * Query Annotations Input
 */
export interface QueryAnnotationsInput {
  projectId?: string;
  modelId?: string;
  userId?: string;
  visible?: boolean;
  page?: number;
  limit?: number;
}

/**
 * Paginated Annotations Response
 */
export interface PaginatedAnnotationsResponse {
  annotations: Annotation[];
  total: number;
  page: number;
  totalPages: number;
}

/**
 * Default Annotation Color
 */
export const DEFAULT_ANNOTATION_COLOR = "#ff6b6b";

/**
 * Annotation Style Options
 */
export const ANNOTATION_STYLES: AnnotationStyle[] = [
  "pin",
  "arrow",
  "note",
  "marker",
];

/**
 * Annotation Attachment Type Options
 */
export const ANNOTATION_ATTACHMENT_TYPES: AnnotationAttachmentType[] = [
  "vertex",
  "edge",
  "face",
  "position",
];

/**
 * Annotation Color Presets
 */
export const ANNOTATION_COLOR_PRESETS = [
  "#ff6b6b", // Red
  "#4ecdc4", // Teal
  "#45b7d1", // Blue
  "#f9ca24", // Yellow
  "#6c5ce7", // Purple
  "#00d2d3", // Cyan
  "#ff9ff3", // Pink
  "#feca57", // Orange
  "#48dbfb", // Light Blue
  "#1dd1a1", // Green
] as const;
