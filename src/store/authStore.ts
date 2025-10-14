import env from "@/config/env";
import authService from "@/services/authService";
import { User } from "@/types/auth.types";
import { create } from "zustand";
import { devtools } from "zustand/middleware";

/**
 * Auth Store State Interface
 */
interface AuthState {
  // State
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isInitialized: boolean;
  error: string | null;

  // Actions
  login: (username: string) => Promise<void>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
  refreshUser: () => Promise<void>;
  setUser: (user: User | null) => void;
  setError: (error: string | null) => void;
  clearError: () => void;
  reset: () => void;
}

/**
 * Initial State
 */
const initialState = {
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: false,
  isInitialized: false,
  error: null,
};

/**
 * Auth Store
 * Global state management for authentication
 */
export const useAuthStore = create<AuthState>()(
  devtools(
    (set, get) => ({
      ...initialState,

      /**
       * Login user with username
       */
      login: async (username: string) => {
        try {
          set({ isLoading: true, error: null });

          const response = await authService.login(username);

          set({
            user: {
              id: response.user.id,
              username: response.user.username,
              createdAt: response.user.createdAt,
              lastActive: new Date(), // Set current time for lastActive
            },
            token: response.token,
            isAuthenticated: true,
            isLoading: false,
            isInitialized: true,
            error: null,
          });
        } catch (error: any) {
          const errorMessage = error.meesage || "Login failed";

          set({
            user: null,
            token: null,
            isAuthenticated: false,
            isLoading: false,
            error: errorMessage,
          });

          throw error; // Re-throw for component handling
        }
      },

      /**
       * Logout user
       */
      logout: async () => {
        try {
          set({ isLoading: true, error: null });

          await authService.logout();

          // Reset to initial state
          set({
            ...initialState,
            isInitialized: true, // Keep initialized flag
          });
        } catch (error: any) {
          // Even if logout fails, clear local state
          set({
            ...initialState,
            isInitialized: true,
            error: "Logout failed, but local session cleared",
          });

          console.error("Logout error:", error);
        }
      },

      /**
       * Check authentication status
       * Validates token and fetches user data
       */
      checkAuth: async () => {
        try {
          set({ isLoading: true, error: null });

          // Check if token exists in localStorage
          const storedToken = authService.getStoredToken();
          const storedUser = authService.getStoredUser();

          if (!storedToken) {
            set({
              ...initialState,
              isInitialized: true,
            });
            return;
          }

          // Verify token with backend
          const isValid = await authService.checkAuth();

          if (isValid && storedUser) {
            // Fetch fresh user data
            const user = await authService.getCurrentUser();

            set({
              user,
              token: storedToken,
              isAuthenticated: true,
              isLoading: false,
              isInitialized: true,
              error: null,
            });
          } else {
            // Token invalid, reset state
            set({
              ...initialState,
              isInitialized: true,
            });
          }
        } catch (error: any) {
          console.error("Auth check failed:", error);

          // Clear auth on error
          set({
            ...initialState,
            isInitialized: true,
            error: "Authentication check failed",
          });
        }
      },

      /**
       * Refresh current user data
       * Fetches latest user information from backend
       */
      refreshUser: async () => {
        try {
          if (!get().isAuthenticated) {
            return;
          }

          const user = await authService.getCurrentUser();

          set({ user, error: null });
        } catch (error: any) {
          console.error("Failed to refresh user:", error);

          // If refresh fails with auth error, logout
          if (error.isAuthError && error.isAuthError()) {
            await get().logout();
          }
        }
      },

      /**
       * Set user manually
       * Useful for updating user data without API call
       */
      setUser: (user: User | null) => {
        set({ user });
      },

      /**
       * Set error message
       */
      setError: (error: string | null) => {
        set({ error });
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
      name: "auth-store",
      enabled: env.isDevelopment,
    }
  )
);

/**
 * Selectors
 * Optimized selectors for specific state slices
 */
export const authSelectors = {
  user: (state: AuthState) => state.user,
  isAuthenticated: (state: AuthState) => state.isAuthenticated,
  isLoading: (state: AuthState) => state.isLoading,
  isInitialized: (state: AuthState) => state.isInitialized,
  error: (state: AuthState) => state.error,
};

export default useAuthStore;
