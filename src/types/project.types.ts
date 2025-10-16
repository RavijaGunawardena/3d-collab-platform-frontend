/**
 * 3D Vector Interface
 * Represents a point or direction in 3D space
 */
export interface Vector3 {
  x: number;
  y: number;
  z: number;
}

/**
 * Camera State Interface
 * Represents the camera position and orientation in 3D space
 */
export interface CameraState {
  position: Vector3;
  rotation: Vector3;
  target: Vector3;
  zoom: number;
}

/**
 * Geometry Types for Primitive Models
 */
export type GeometryType = "box" | "sphere" | "cylinder" | "cone" | "torus";

/**
 * Model Type
 */
export type ModelType = "primitive" | "uploaded";

/**
 * Geometry Parameters Interface
 */
export interface GeometryParameters {
  [key: string]: any;
}

/**
 * 3D Model Interface (Backend Response Format)
 * Represents a 3D object in the project
 */
export interface Model3D {
  _id?: string; // Backend uses _id
  name: string;
  type: ModelType;
  geometry?: {
    type: GeometryType;
    parameters?: GeometryParameters;
  };
  fileUrl?: string;
  fileName?: string;
  fileSize?: number;
  position: Vector3;
  rotation: Vector3;
  scale: Vector3;
  color?: string;
  visible: boolean;
  createdAt: string; // Backend sends ISO string
}

/**
 * User Info Interface (for populated createdBy field)
 */
export interface UserInfo {
  _id: string; // Backend uses _id
  username: string;
  id?: string; // Some responses might include this
}

/**
 * Project Interface (Backend Response Format)
 * Represents a 3D collaborative project
 */
export interface Project {
  _id: string; // Backend uses _id
  id: string; // Transformed frontend field
  title: string;
  description?: string;
  createdBy: string | UserInfo; // Can be ObjectId string or populated user
  models: Model3D[];
  cameraState: CameraState;
  activeUsers: string[]; // Array of user IDs
  modelCount?: number; // Virtual field from backend
  createdAt: string; // Backend sends ISO string
  updatedAt: string; // Backend sends ISO string
}

/**
 * Project List Item Interface (Backend Response Format)
 * Simplified project data for list views (matches backend controller response)
 */
export interface ProjectListItem {
  id: string; // Backend transforms _id to id in controller
  title: string;
  description?: string;
  modelCount: number;
  createdBy: string | UserInfo; // Can be string ID or populated user object
  createdAt: string; // Backend sends ISO string
}

/**
 * Frontend Project Interface (for UI display)
 * Project with Date objects for easier manipulation
 */
export interface ProjectDisplay
  extends Omit<Project, "createdAt" | "updatedAt"> {
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Frontend Project List Item (for UI display)
 */
export interface ProjectListItemDisplay
  extends Omit<ProjectListItem, "createdAt"> {
  createdAt: Date;
}

/**
 * Create Project Input
 */
export interface CreateProjectInput {
  title: string;
  description?: string;
  cameraState?: Partial<CameraState>;
}

/**
 * Update Project Input
 */
export interface UpdateProjectInput {
  title?: string;
  description?: string;
}

/**
 * Add Model Input
 */
export interface AddModelInput {
  name: string;
  type: ModelType;
  geometry?: {
    type: GeometryType;
    parameters?: GeometryParameters;
  };
  fileUrl?: string;
  fileName?: string;
  fileSize?: number;
  position?: Vector3;
  rotation?: Vector3;
  scale?: Vector3;
  color?: string;
  visible?: boolean;
}

/**
 * Update Model Input
 */
export interface UpdateModelInput {
  modelId: string;
  position?: Vector3;
  rotation?: Vector3;
  scale?: Vector3;
  color?: string;
  visible?: boolean;
}

/**
 * Update Camera Input
 */
export interface UpdateCameraInput {
  position?: Vector3;
  rotation?: Vector3;
  target?: Vector3;
  zoom?: number;
}

/**
 * Query Projects Input
 */
export interface QueryProjectsInput {
  page?: number;
  limit?: number;
  search?: string;
}

/**
 * Backend API Response Interface (matches ApiResponse.util.ts)
 */
export interface BackendApiResponse<T = any> {
  status: "success" | "error";
  message?: string;
  data?: T;
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
    totalPages?: number;
  };
  timestamp: string;
}

/**
 * Backend Paginated Response (matches backend controller response)
 */
export interface BackendPaginatedResponse {
  projects: ProjectListItem[];
  total: number;
  page: number;
  totalPages: number;
}

/**
 * Frontend Paginated Projects Response (for UI)
 */
export interface PaginatedProjectsResponse {
  projects: ProjectListItemDisplay[];
  total: number;
  page: number;
  totalPages: number;
}

/**
 * Default Camera State
 */
export const DEFAULT_CAMERA_STATE: CameraState = {
  position: { x: 0, y: 5, z: 10 },
  rotation: { x: 0, y: 0, z: 0 },
  target: { x: 0, y: 0, z: 0 },
  zoom: 1,
};

/**
 * Default Vector3
 */
export const DEFAULT_VECTOR3: Vector3 = {
  x: 0,
  y: 0,
  z: 0,
};

/**
 * Default Model Scale
 */
export const DEFAULT_SCALE: Vector3 = {
  x: 1,
  y: 1,
  z: 1,
};

/**
 * Utility functions for data transformation
 */

/**
 * Transform backend project to frontend project
 */
export function transformProject(backendProject: Project): ProjectDisplay {
  return {
    ...backendProject,
    createdAt: new Date(backendProject.createdAt),
    updatedAt: new Date(backendProject.updatedAt),
  };
}

/**
 * Transform backend project list item to frontend format
 */
export function transformProjectListItem(
  backendItem: ProjectListItem
): ProjectListItemDisplay {
  return {
    ...backendItem,
    createdAt: new Date(backendItem.createdAt),
  };
}

/**
 * Transform backend projects array to frontend format
 */
export function transformProjectsList(
  backendProjects: ProjectListItem[]
): ProjectListItemDisplay[] {
  return backendProjects.map(transformProjectListItem);
}

/**
 * Type guards for better type safety
 */
export function isUserInfo(
  createdBy: string | UserInfo | null
): createdBy is UserInfo {
  return (
    createdBy !== null &&
    typeof createdBy === "object" &&
    "username" in createdBy
  );
}

export function isStringId(
  createdBy: string | UserInfo | null
): createdBy is string {
  return typeof createdBy === "string";
}

/**
 * Get user display name from createdBy field
 */
export function getUserDisplayName(
  createdBy: string | UserInfo | null
): string {
  if (createdBy === null) {
    return "Unknown";
  }
  if (typeof createdBy === "string") {
    return "Unknown"; // We only have ID, not username
  }
  return createdBy?.username || "Unknown";
}

/**
 * Check if user is the creator of a project
 */
export function isProjectCreator(
  createdBy: string | UserInfo | null,
  currentUserId: string | null
): boolean {
  if (!currentUserId || createdBy === null) return false;

  if (typeof createdBy === "string") {
    return createdBy === currentUserId;
  }

  return createdBy?._id === currentUserId || createdBy?.id === currentUserId;
}
