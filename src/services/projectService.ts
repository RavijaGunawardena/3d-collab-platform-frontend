import {
  AddModelInput,
  CreateProjectInput,
  PaginatedProjectsResponse,
  Project,
  ProjectDisplay,
  ProjectListItem,
  ProjectListItemDisplay,
  QueryProjectsInput,
  UpdateCameraInput,
  UpdateModelInput,
  UpdateProjectInput,
  BackendApiResponse,
  transformProject,
  transformProjectsList,
} from "@/types/project.types";
import { apiClient } from "./api";
import { apiEndpoints } from "@/config/env";

/**
 * Project Service
 * Handles all project-related API calls with proper type transformations
 */
class ProjectService {
  /**
   * Create a new project
   *
   * @param data - Project creation data
   * @returns Created project with transformed types
   */
  async createProject(data: CreateProjectInput): Promise<ProjectDisplay> {
    const response = await apiClient.post<BackendApiResponse<Project>>(
      apiEndpoints.projects.create,
      data
    );

    if (!response.data.data) {
      throw new Error("No project data received from server");
    }

    // Transform backend response to frontend format
    return transformProject(response.data.data);
  }

  /**
   * Get all projects with pagination
   *
   * @param query - Query parameters (page, limit, search)
   * @returns Paginated projects with transformed types
   */
  async getAllProjects(
    query?: QueryProjectsInput
  ): Promise<PaginatedProjectsResponse> {
    const params = new URLSearchParams();

    if (query?.page) params.append("page", query.page.toString());
    if (query?.limit) params.append("limit", query.limit.toString());
    if (query?.search) params.append("search", query.search);

    const response = await apiClient.get<BackendApiResponse<ProjectListItem[]>>(
      `${apiEndpoints.projects.list}?${params.toString()}`
    );

    // Extract data and meta from the API response
    const { data: projects = [], meta } = response.data;

    // Transform projects to frontend format with Date objects
    const transformedProjects = transformProjectsList(projects);

    return {
      projects: transformedProjects,
      total: meta?.total || 0,
      page: meta?.page || 1,
      totalPages: meta?.totalPages || 1,
    };
  }

  /**
   * Get projects created by current user
   *
   * @returns User's projects with transformed types
   */
  async getMyProjects(): Promise<ProjectListItemDisplay[]> {
    const response = await apiClient.get<BackendApiResponse<ProjectListItem[]>>(
      apiEndpoints.projects.myProjects
    );

    if (!response.data.data) {
      return [];
    }

    // Transform to frontend format
    return transformProjectsList(response.data.data);
  }

  /**
   * Get project by ID
   *
   * @param projectId - Project ID
   * @returns Project details with transformed types
   */
  async getProjectById(projectId: string): Promise<ProjectDisplay> {
    const response = await apiClient.get<BackendApiResponse<Project>>(
      apiEndpoints.projects.detail(projectId)
    );

    if (!response.data.data) {
      throw new Error("Project not found");
    }

    // Transform backend response to frontend format
    return transformProject(response.data.data);
  }

  /**
   * Update project
   *
   * @param projectId - Project ID
   * @param data - Update data
   * @returns Updated project with transformed types
   */
  async updateProject(
    projectId: string,
    data: UpdateProjectInput
  ): Promise<ProjectDisplay> {
    const response = await apiClient.put<BackendApiResponse<Project>>(
      apiEndpoints.projects.update(projectId),
      data
    );

    if (!response.data.data) {
      throw new Error("No project data received from server");
    }

    // Transform backend response to frontend format
    return transformProject(response.data.data);
  }

  /**
   * Delete project
   *
   * @param projectId - Project ID
   */
  async deleteProject(projectId: string): Promise<void> {
    await apiClient.delete(apiEndpoints.projects.delete(projectId));
  }

  /**
   * Add model to project
   *
   * @param projectId - Project ID
   * @param modelData - Model data
   * @returns Updated project with new model and transformed types
   */
  async addModel(
    projectId: string,
    modelData: AddModelInput
  ): Promise<ProjectDisplay> {
    const response = await apiClient.post<BackendApiResponse<Project>>(
      apiEndpoints.projects.addModel(projectId),
      modelData
    );

    if (!response.data.data) {
      throw new Error("No project data received from server");
    }

    // Transform backend response to frontend format
    return transformProject(response.data.data);
  }

  /**
   * Update model in project
   *
   * @param projectId - Project ID
   * @param modelId - Model ID
   * @param updates - Model updates
   * @returns Updated project with transformed types
   */
  async updateModel(
    projectId: string,
    modelId: string,
    updates: Omit<UpdateModelInput, "modelId">
  ): Promise<ProjectDisplay> {
    const response = await apiClient.put<BackendApiResponse<Project>>(
      apiEndpoints.projects.updateModel(projectId, modelId),
      { modelId, ...updates }
    );

    if (!response.data.data) {
      throw new Error("No project data received from server");
    }

    // Transform backend response to frontend format
    return transformProject(response.data.data);
  }

  /**
   * Delete model from project
   *
   * @param projectId - Project ID
   * @param modelId - Model ID
   * @returns Updated project without the model and transformed types
   */
  async deleteModel(
    projectId: string,
    modelId: string
  ): Promise<ProjectDisplay> {
    const response = await apiClient.delete<BackendApiResponse<Project>>(
      apiEndpoints.projects.deleteModel(projectId, modelId)
    );

    if (!response.data.data) {
      throw new Error("No project data received from server");
    }

    // Transform backend response to frontend format
    return transformProject(response.data.data);
  }

  /**
   * Update camera state in project
   *
   * @param projectId - Project ID
   * @param cameraState - Camera state updates
   * @returns Updated project with new camera state and transformed types
   */
  async updateCamera(
    projectId: string,
    cameraState: UpdateCameraInput
  ): Promise<ProjectDisplay> {
    const response = await apiClient.patch<BackendApiResponse<Project>>(
      apiEndpoints.projects.addCamera(projectId),
      cameraState
    );

    if (!response.data.data) {
      throw new Error("No project data received from server");
    }

    // Transform backend response to frontend format
    return transformProject(response.data.data);
  }
}

// Export singleton instance
export const projectService = new ProjectService();
export default projectService;
