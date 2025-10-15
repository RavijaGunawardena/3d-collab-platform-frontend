import { create } from "zustand";
import { devtools } from "zustand/middleware";
import { projectService } from "@/services/projectService";
import {
  Project,
  ProjectListItem,
  CreateProjectInput,
  UpdateProjectInput,
  QueryProjectsInput,
} from "@/types/project.types";
import { env } from "@/config/env";

/**
 * Project Store State Interface
 */
interface ProjectState {
  // State
  projects: ProjectListItem[];
  currentProject: Project | null;
  isLoading: boolean;
  isCreating: boolean;
  isUpdating: boolean;
  isDeleting: boolean;
  error: string | null;

  // Pagination
  currentPage: number;
  totalPages: number;
  totalProjects: number;
  limit: number;

  // Search
  searchQuery: string;

  // Actions - Projects List
  fetchProjects: (query?: QueryProjectsInput) => Promise<void>;
  fetchMyProjects: () => Promise<void>;
  setSearchQuery: (query: string) => void;
  setPage: (page: number) => void;

  // Actions - Single Project
  fetchProjectById: (projectId: string) => Promise<void>;
  setCurrentProject: (project: Project | null) => void;

  // Actions - CRUD
  createProject: (data: CreateProjectInput) => Promise<Project>;
  updateProject: (projectId: string, data: UpdateProjectInput) => Promise<void>;
  deleteProject: (projectId: string) => Promise<void>;

  // Actions - Utility
  clearError: () => void;
  reset: () => void;
}

/**
 * Initial State
 */
const initialState = {
  projects: [],
  currentProject: null,
  isLoading: false,
  isCreating: false,
  isUpdating: false,
  isDeleting: false,
  error: null,
  currentPage: 1,
  totalPages: 1,
  totalProjects: 0,
  limit: 20,
  searchQuery: "",
};

/**
 * Project Store
 * Global state management for projects
 */
export const useProjectStore = create<ProjectState>()(
  devtools(
    (set, get) => ({
      ...initialState,

      /**
       * Fetch all projects with pagination
       */
      fetchProjects: async (query?: QueryProjectsInput) => {
        try {
          set({ isLoading: true, error: null });

          const { searchQuery, currentPage, limit } = get();

          const queryParams: QueryProjectsInput = {
            page: query?.page || currentPage,
            limit: query?.limit || limit,
            search: query?.search || searchQuery || undefined,
          };

          const response = await projectService.getAllProjects(queryParams);

          set({
            projects: response.projects,
            totalPages: response.totalPages,
            totalProjects: response.total,
            currentPage: response.page,
            isLoading: false,
            error: null,
          });
        } catch (error: any) {
          console.error("Failed to fetch projects:", error);
          set({
            projects: [],
            isLoading: false,
            error: error.message || "Failed to fetch projects",
          });
        }
      },

      /**
       * Fetch projects created by current user
       */
      fetchMyProjects: async () => {
        try {
          set({ isLoading: true, error: null });

          const projects = await projectService.getMyProjects();

          set({
            projects,
            totalProjects: projects.length,
            isLoading: false,
            error: null,
          });
        } catch (error: any) {
          console.error("Failed to fetch my projects:", error);
          set({
            projects: [],
            isLoading: false,
            error: error.message || "Failed to fetch your projects",
          });
        }
      },

      /**
       * Fetch single project by ID
       */
      fetchProjectById: async (projectId: string) => {
        try {
          set({ isLoading: true, error: null });

          const project = await projectService.getProjectById(projectId);

          set({
            currentProject: project,
            isLoading: false,
            error: null,
          });
        } catch (error: any) {
          console.error("Failed to fetch project:", error);
          set({
            currentProject: null,
            isLoading: false,
            error: error.message || "Failed to fetch project",
          });
          throw error; // Re-throw for component handling
        }
      },

      /**
       * Set current project manually
       */
      setCurrentProject: (project: Project | null) => {
        set({ currentProject: project });
      },

      /**
       * Create new project
       */
      createProject: async (data: CreateProjectInput): Promise<Project> => {
        try {
          set({ isCreating: true, error: null });

          const project = await projectService.createProject(data);

          // Add to projects list
          const { projects } = get();
          set({
            projects: [
              {
                id: project.id,
                title: project.title,
                description: project.description,
                modelCount: project.models?.length || 0,
                createdBy: project.createdBy,
                createdAt: project.createdAt,
              },
              ...projects,
            ],
            totalProjects: get().totalProjects + 1,
            isCreating: false,
            error: null,
          });

          return project;
        } catch (error: any) {
          console.error("Failed to create project:", error);
          set({
            isCreating: false,
            error: error.message || "Failed to create project",
          });
          throw error; // Re-throw for component handling
        }
      },

      /**
       * Update project
       */
      updateProject: async (projectId: string, data: UpdateProjectInput) => {
        try {
          set({ isUpdating: true, error: null });

          await projectService.updateProject(projectId, data);

          // Update in projects list
          const { projects, currentProject } = get();
          set({
            projects: projects.map((p) =>
              p.id === projectId ? { ...p, ...data } : p
            ),
            currentProject:
              currentProject?.id === projectId
                ? { ...currentProject, ...data }
                : currentProject,
            isUpdating: false,
            error: null,
          });
        } catch (error: any) {
          console.error("Failed to update project:", error);
          set({
            isUpdating: false,
            error: error.message || "Failed to update project",
          });
          throw error;
        }
      },

      /**
       * Delete project
       */
      deleteProject: async (projectId: string) => {
        try {
          set({ isDeleting: true, error: null });

          await projectService.deleteProject(projectId);

          // Remove from projects list
          const { projects, currentProject } = get();
          set({
            projects: projects.filter((p) => p.id !== projectId),
            currentProject:
              currentProject?.id === projectId ? null : currentProject,
            totalProjects: get().totalProjects - 1,
            isDeleting: false,
            error: null,
          });
        } catch (error: any) {
          console.error("Failed to delete project:", error);
          set({
            isDeleting: false,
            error: error.message || "Failed to delete project",
          });
          throw error;
        }
      },

      /**
       * Set search query and fetch projects
       */
      setSearchQuery: (query: string) => {
        set({ searchQuery: query, currentPage: 1 });
        get().fetchProjects({ page: 1, search: query });
      },

      /**
       * Set current page and fetch projects
       */
      setPage: (page: number) => {
        set({ currentPage: page });
        get().fetchProjects({ page });
      },

      /**
       * Clear error message
       */
      clearError: () => {
        set({ error: null });
      },

      /**
       * Reset store to initial state
       */
      reset: () => {
        set(initialState);
      },
    }),
    {
      name: "project-store",
      enabled: env.isDevelopment,
    }
  )
);

/**
 * Selectors
 * Optimized selectors for specific state slices
 */
export const projectSelectors = {
  projects: (state: ProjectState) => state.projects,
  currentProject: (state: ProjectState) => state.currentProject,
  isLoading: (state: ProjectState) => state.isLoading,
  error: (state: ProjectState) => state.error,
  pagination: (state: ProjectState) => ({
    currentPage: state.currentPage,
    totalPages: state.totalPages,
    totalProjects: state.totalProjects,
    limit: state.limit,
  }),
};

export default useProjectStore;
