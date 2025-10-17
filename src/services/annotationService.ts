import {
  Annotation,
  CreateAnnotationInput,
  UpdateAnnotationInput,
  QueryAnnotationsInput,
  PaginatedAnnotationsResponse,
} from "@/types/annotation.types";
import { BackendApiResponse } from "@/types/project.types";
import { apiClient } from "./api";
import { apiEndpoints } from "@/config/env";

/**
 * Annotation Service
 * Handles all annotation-related API calls to match backend structure
 */
class AnnotationService {
  /**
   * Create a new annotation
   */
  async createAnnotation(data: CreateAnnotationInput): Promise<Annotation> {
    const response = await apiClient.post<BackendApiResponse<Annotation>>(
      apiEndpoints.annotations.create,
      data
    );

    if (!response.data.data) {
      throw new Error("No annotation data received from server");
    }

    return this.transformAnnotation(response.data.data);
  }

  /**
   * Get annotations for a project
   */
  async getAnnotationsByProject(projectId: string): Promise<Annotation[]> {
    const response = await apiClient.get<BackendApiResponse<Annotation[]>>(
      apiEndpoints.annotations.byProject(projectId)
    );

    return (response.data.data || []).map(this.transformAnnotation);
  }

  /**
   * Get annotations for a project and model
   */
  // async getAnnotationsByProjectAndModel(
  //   projectId: string,
  //   modelId: string
  // ): Promise<Annotation[]> {
  //   const response = await apiClient.get<BackendApiResponse<Annotation[]>>(
  //     `${apiEndpoints.annotations.projectModel}/${projectId}/${modelId}`
  //   );

  //   return (response.data.data || []).map(this.transformAnnotation);
  // }

  /**
   * Query annotations with filters and pagination
   */
  async queryAnnotations(
    query: QueryAnnotationsInput
  ): Promise<PaginatedAnnotationsResponse> {
    const params = new URLSearchParams();

    if (query.projectId) params.append("projectId", query.projectId);
    if (query.modelId) params.append("modelId", query.modelId);
    if (query.userId) params.append("userId", query.userId);
    if (query.visible !== undefined)
      params.append("visible", query.visible.toString());
    if (query.page) params.append("page", query.page.toString());
    if (query.limit) params.append("limit", query.limit.toString());

    const response = await apiClient.get<BackendApiResponse<Annotation[]>>(
      `${apiEndpoints.annotations.query}?${params.toString()}`
    );

    const { data: annotations, meta } = response.data;

    return {
      annotations: (annotations || []).map(this.transformAnnotation),
      total: meta?.total || 0,
      page: meta?.page || 1,
      totalPages: meta?.totalPages || 1,
    };
  }

  /**
   * Get annotation by ID
   */
  async getAnnotationById(annotationId: string): Promise<Annotation> {
    const response = await apiClient.get<BackendApiResponse<Annotation>>(
      `${apiEndpoints.annotations.detail}/${annotationId}`
    );

    if (!response.data.data) {
      throw new Error("Annotation not found");
    }

    return this.transformAnnotation(response.data.data);
  }

  /**
   * Update annotation
   */
  async updateAnnotation(
    annotationId: string,
    data: UpdateAnnotationInput
  ): Promise<Annotation> {
    const response = await apiClient.put<BackendApiResponse<Annotation>>(
      `${apiEndpoints.annotations.update}/${annotationId}`,
      data
    );

    if (!response.data.data) {
      throw new Error("No annotation data received from server");
    }

    return this.transformAnnotation(response.data.data);
  }

  /**
   * Delete annotation
   */
  async deleteAnnotation(annotationId: string): Promise<void> {
    await apiClient.delete(
      `${apiEndpoints.annotations.delete(annotationId)}`
    );
  }

  /**
   * Toggle annotation visibility
   */
  async toggleVisibility(annotationId: string): Promise<Annotation> {
    const response = await apiClient.patch<BackendApiResponse<Annotation>>(
      `${apiEndpoints.annotations.toggleVisibility(annotationId)}`
    );

    if (!response.data.data) {
      throw new Error("No annotation data received from server");
    }

    return this.transformAnnotation(response.data.data);
  }

  /**
   * Count annotations for a project
   */
  async countAnnotations(projectId: string): Promise<number> {
    const response = await apiClient.get<BackendApiResponse<{ count: number }>>(
      `${apiEndpoints.annotations.count}/${projectId}`
    );

    return response.data.data?.count || 0;
  }

  /**
   * Transform backend annotation to frontend format
   * Handles date conversion and field mapping
   */
  private transformAnnotation(backendAnnotation: any): Annotation {
    return {
      id: backendAnnotation._id,
      projectId: backendAnnotation.projectId,
      modelId: backendAnnotation.modelId,
      userId: backendAnnotation.userId,
      username: backendAnnotation.username,
      text: backendAnnotation.text,
      position: backendAnnotation.position,
      attachmentType: backendAnnotation.attachmentType,
      style: backendAnnotation.style,
      color: backendAnnotation.color,
      visible: backendAnnotation.visible,
      createdAt: new Date(backendAnnotation.createdAt),
      updatedAt: new Date(backendAnnotation.updatedAt),
    };
  }
}

// Export singleton instance
export const annotationService = new AnnotationService();
export default annotationService;
