import { create } from "zustand";
import { devtools } from "zustand/middleware";
import { projectService } from "@/services/projectService";
import {
  ProjectDisplay,
  ProjectListItemDisplay,
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
  projects: ProjectListItemDisplay[];
  myProjects: ProjectListItemDisplay[]; // Store user's projects separately
  currentProject: ProjectDisplay | null;
  isLoading: boolean;
  isCreating: boolean;
  isUpdating: boolean;
  isDeleting: boolean;
  error: string | null;

  // Pagination (for all projects view)
  currentPage: number;
  totalPages: number;
  totalProjects: number;
  limit: number;

  // Search
  searchQuery: string;

  // View state
  currentView: "all" | "my"; // Track current view

  // Actions - Projects List
  fetchProjects: (query?: QueryProjectsInput) => Promise<void>;
  fetchMyProjects: () => Promise<void>;
  setSearchQuery: (query: string) => void;
  setPage: (page: number) => void;
  setView: (view: "all" | "my") => void;

  // Actions - Single Project
  fetchProjectById: (projectId: string) => Promise<void>;
  setCurrentProject: (project: ProjectDisplay | null) => void;

  // Actions - CRUD
  createProject: (data: CreateProjectInput) => Promise<ProjectDisplay>;
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
  myProjects: [],
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
  currentView: "all" as const,
};

/**
 * Project Store
 * Global state management for projects with proper type handling
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
          set({ isLoading: true, error: null, currentView: "all" });

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
          set({ isLoading: true, error: null, currentView: "my" });

          const projects = await projectService.getMyProjects();

          set({
            myProjects: projects,
            projects: projects, // Also update projects for unified display
            totalProjects: projects.length,
            totalPages: 1, // No pagination for my projects
            currentPage: 1,
            isLoading: false,
            error: null,
          });
        } catch (error: any) {
          console.error("Failed to fetch my projects:", error);
          set({
            myProjects: [],
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
      setCurrentProject: (project: ProjectDisplay | null) => {
        set({ currentProject: project });
      },

      /**
       * Create new project
       */
      createProject: async (
        data: CreateProjectInput
      ): Promise<ProjectDisplay> => {
        try {
          set({ isCreating: true, error: null });

          const project = await projectService.createProject(data);

          // Convert ProjectDisplay to ProjectListItemDisplay for list views
          const newProjectItem: ProjectListItemDisplay = {
            id: project.id,
            title: project.title,
            description: project.description,
            modelCount: project.models?.length || 0,
            createdBy: project.createdBy,
            createdAt: project.createdAt,
          };

          // Update both all projects and my projects lists
          const { projects, myProjects, currentView } = get();

          set({
            // Add to all projects if in all view, otherwise keep existing
            projects:
              currentView === "all"
                ? [newProjectItem, ...projects]
                : [newProjectItem, ...projects],
            // Always add to my projects
            myProjects: [newProjectItem, ...myProjects],
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

          const updatedProject = await projectService.updateProject(
            projectId,
            data
          );

          const updateProjectInList = (
            projectsList: ProjectListItemDisplay[]
          ) =>
            projectsList.map((p) =>
              p.id === projectId ? { ...p, ...data } : p
            );

          // Update in both lists and current project
          const { projects, myProjects, currentProject } = get();
          set({
            projects: updateProjectInList(projects),
            myProjects: updateProjectInList(myProjects),
            currentProject:
              currentProject?.id === projectId
                ? updatedProject
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

          const removeProjectFromList = (
            projectsList: ProjectListItemDisplay[]
          ) => projectsList.filter((p) => p.id !== projectId);

          // Remove from both lists and current project
          const { projects, myProjects, currentProject } = get();
          set({
            projects: removeProjectFromList(projects),
            myProjects: removeProjectFromList(myProjects),
            currentProject:
              currentProject?.id === projectId ? null : currentProject,
            totalProjects: Math.max(0, get().totalProjects - 1),
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
       * Set search query and fetch projects based on current view
       */
      setSearchQuery: (query: string) => {
        set({ searchQuery: query, currentPage: 1 });

        const { currentView } = get();
        if (currentView === "all") {
          get().fetchProjects({ page: 1, search: query });
        } else {
          // For "my" view, we don't need to refetch as we have all data locally
          // The filtering will be handled in the component
        }
      },

      /**
       * Set current page and fetch projects (only for all projects view)
       */
      setPage: (page: number) => {
        set({ currentPage: page });

        const { currentView } = get();
        if (currentView === "all") {
          get().fetchProjects({ page });
        }
      },

      /**
       * Set current view
       */
      setView: (view: "all" | "my") => {
        set({ currentView: view });

        // Reset search and pagination when switching views
        set({ searchQuery: "", currentPage: 1 });

        // Fetch appropriate data
        if (view === "all") {
          get().fetchProjects();
        } else {
          get().fetchMyProjects();
        }
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
  myProjects: (state: ProjectState) => state.myProjects,
  currentProject: (state: ProjectState) => state.currentProject,
  isLoading: (state: ProjectState) => state.isLoading,
  error: (state: ProjectState) => state.error,
  currentView: (state: ProjectState) => state.currentView,
  pagination: (state: ProjectState) => ({
    currentPage: state.currentPage,
    totalPages: state.totalPages,
    totalProjects: state.totalProjects,
    limit: state.limit,
  }),
};

export default useProjectStore;
