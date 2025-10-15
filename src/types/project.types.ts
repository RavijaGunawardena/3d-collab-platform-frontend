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
 * 3D Model Interface
 * Represents a 3D object in the project
 */
export interface Model3D {
  _id?: string;
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
  createdAt: Date;
}

/**
 * Project Interface
 * Represents a 3D collaborative project
 */
export interface Project {
  id: string;
  title: string;
  description?: string;
  createdBy:
    | string
    | {
        _id: string;
        username: string;
      };
  models: Model3D[];
  cameraState: CameraState;
  activeUsers: string[];
  modelCount?: number;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Project List Item Interface
 * Simplified project data for list views
 */
export interface ProjectListItem {
  id: string;
  title: string;
  description?: string;
  modelCount: number;
  createdBy:
    | string
    | {
        _id: string;
        username: string;
      };
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
 * Paginated Projects Response
 */
export interface PaginatedProjectsResponse {
  projects: ProjectListItem[];
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
