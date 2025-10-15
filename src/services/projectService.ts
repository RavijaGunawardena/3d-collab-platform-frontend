import {
  AddModelInput,
  CreateProjectInput,
  PaginatedProjectsResponse,
  Project,
  ProjectListItem,
  QueryProjectsInput,
  UpdateCameraInput,
  UpdateModelInput,
  UpdateProjectInput,
} from "@/types/project.types";
import api from "./api";
import { apiEndpoints } from "@/config/env";

/**
 * Project Service
 * Handles all project-related API calls
 */
class ProjectService {
  /**
   * Create a new project
   *
   * @param data - Project creation data
   * @returns Created project
   */
  async createProject(data: CreateProjectInput): Promise<Project> {
    const response = await api.post<Project>(
      apiEndpoints.projects.create,
      data
    );
    return response;
  }

  /**
   * Get all projects with pagination
   *
   * @param query - Query parameters (page, limit, search)
   * @returns Paginated projects
   */
  async getAllProjects(
    query?: QueryProjectsInput
  ): Promise<PaginatedProjectsResponse> {
    const params = new URLSearchParams();

    if (query?.page) params.append("page", query.page.toString());
    if (query?.limit) params.append("limit", query.limit.toString());
    if (query?.search) params.append("search", query.search);

    const response = await api.get<PaginatedProjectsResponse>(
      `${apiEndpoints.projects.list}?${params.toString()}`
    );

    return response;
  }

  /**
   * Get projects created by current user
   *
   * @returns User's projects
   */
  async getMyProjects(): Promise<ProjectListItem[]> {
    const response = await api.get<ProjectListItem[]>(
      apiEndpoints.projects.myProjects
    );
    return response;
  }

  /**
   * Get project by ID
   *
   * @param projectId - Project ID
   * @returns Project details
   */
  async getProjectById(projectId: string): Promise<Project> {
    const response = await api.get<Project>(
      apiEndpoints.projects.detail(projectId)
    );
    return response;
  }

  /**
   * Update project
   *
   * @param projectId - Project ID
   * @param data - Update data
   * @returns Updated project
   */
  async updateProject(
    projectId: string,
    data: UpdateProjectInput
  ): Promise<Project> {
    const response = await api.put<Project>(
      apiEndpoints.projects.update(projectId),
      data
    );
    return response;
  }

  /**
   * Delete project
   *
   * @param projectId - Project ID
   */
  async deleteProject(projectId: string): Promise<void> {
    await api.delete<void>(apiEndpoints.projects.delete(projectId));
  }

  /**
   * Add model to project
   *
   * @param projectId - Project ID
   * @param modelData - Model data
   * @returns Updated project with new model
   */
  async addModel(
    projectId: string,
    modelData: AddModelInput
  ): Promise<Project> {
    const response = await api.post<Project>(
      apiEndpoints.projects.addModel(projectId),
      modelData
    );
    return response;
  }

  /**
   * Update model in project
   *
   * @param projectId - Project ID
   * @param modelId - Model ID
   * @param updates - Model updates
   * @returns Updated project
   */
  async updateModel(
    projectId: string,
    modelId: string,
    updates: Omit<UpdateModelInput, "modelId">
  ): Promise<Project> {
    const response = await api.put<Project>(
      apiEndpoints.projects.updateModel(projectId, modelId),
      { modelId, ...updates }
    );
    return response;
  }

  /**
   * Delete model from project
   *
   * @param projectId - Project ID
   * @param modelId - Model ID
   * @returns Updated project without the model
   */
  async deleteModel(projectId: string, modelId: string): Promise<Project> {
    const response = await api.delete<Project>(
      apiEndpoints.projects.deleteModel(projectId, modelId)
    );
    return response;
  }

  /**
   * Update camera state in project
   *
   * @param projectId - Project ID
   * @param cameraState - Camera state updates
   * @returns Updated project with new camera state
   */
  async updateCamera(
    projectId: string,
    cameraState: UpdateCameraInput
  ): Promise<Project> {
    const response = await api.patch<Project>(
      apiEndpoints.projects.addCamera(projectId),
      cameraState
    );
    return response;
  }
}

// Export singleton instance
export const projectService = new ProjectService();
export default projectService;
