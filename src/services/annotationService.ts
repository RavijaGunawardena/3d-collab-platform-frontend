import { api } from "@/services/api";
import {
  Annotation,
  CreateAnnotationInput,
  UpdateAnnotationInput,
  QueryAnnotationsInput,
  PaginatedAnnotationsResponse,
} from "@/types/annotation.types";

/**
 * Annotation Service
 * Handles all annotation-related API calls
 */
class AnnotationService {
  /**
   * Create a new annotation
   *
   * @param data - Annotation creation data
   * @returns Created annotation
   */
  async createAnnotation(data: CreateAnnotationInput): Promise<Annotation> {
    const response = await api.post<Annotation>("/annotations", data);
    return response;
  }

  /**
   * Query annotations with filters
   *
   * @param query - Query parameters
   * @returns Paginated annotations
   */
  async queryAnnotations(
    query?: QueryAnnotationsInput
  ): Promise<PaginatedAnnotationsResponse> {
    const params = new URLSearchParams();

    if (query?.projectId) params.append("projectId", query.projectId);
    if (query?.modelId) params.append("modelId", query.modelId);
    if (query?.userId) params.append("userId", query.userId);
    if (query?.visible !== undefined)
      params.append("visible", query.visible.toString());
    if (query?.page) params.append("page", query.page.toString());
    if (query?.limit) params.append("limit", query.limit.toString());

    const response = await api.get<PaginatedAnnotationsResponse>(
      `/annotations?${params.toString()}`
    );

    return response;
  }

  /**
   * Get all annotations for a project
   *
   * @param projectId - Project ID
   * @returns Array of annotations
   */
  async getAnnotationsByProject(projectId: string): Promise<Annotation[]> {
    const response = await api.get<Annotation[]>(
      `/annotations/project/${projectId}`
    );
    return response;
  }

  /**
   * Get annotation by ID
   *
   * @param annotationId - Annotation ID
   * @returns Annotation details
   */
  async getAnnotationById(annotationId: string): Promise<Annotation> {
    const response = await api.get<Annotation>(`/annotations/${annotationId}`);
    return response;
  }

  /**
   * Update annotation
   *
   * @param annotationId - Annotation ID
   * @param data - Update data
   * @returns Updated annotation
   */
  async updateAnnotation(
    annotationId: string,
    data: UpdateAnnotationInput
  ): Promise<Annotation> {
    const response = await api.put<Annotation>(
      `/annotations/${annotationId}`,
      data
    );
    return response;
  }

  /**
   * Delete annotation
   *
   * @param annotationId - Annotation ID
   */
  async deleteAnnotation(annotationId: string): Promise<void> {
    await api.delete<void>(`/annotations/${annotationId}`);
  }

  /**
   * Toggle annotation visibility
   *
   * @param annotationId - Annotation ID
   * @returns Updated annotation
   */
  async toggleVisibility(annotationId: string): Promise<Annotation> {
    const response = await api.patch<Annotation>(
      `/annotations/${annotationId}/visibility`
    );
    return response;
  }

  /**
   * Count annotations for a project
   *
   * @param projectId - Project ID
   * @returns Annotation count
   */
  async countAnnotations(projectId: string): Promise<number> {
    const response = await api.get<{ count: number }>(
      `/annotations/project/${projectId}/count`
    );
    return response.count;
  }
}

// Export singleton instance
export const annotationService = new AnnotationService();
export default annotationService;
