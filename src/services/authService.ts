import { api, tokenManager } from "@/services/api";
import { apiEndpoints } from "@/config/env";
import {
  LoginRequest,
  LoginResponse,
  User,
  ActiveUser,
} from "@/types/auth.types";

/**
 * Auth Service
 * Handles all authentication-related API calls
 */
class AuthService {
  /**
   * Login user with username (dummy authentication)
   *
   * @param username - User's username
   * @returns Login response with user and token
   */
  async login(username: string): Promise<LoginResponse> {
    try {
      const payload: LoginRequest = { username };

      const response = await api.post<LoginResponse>(
        apiEndpoints.auth.login,
        payload
      );

      // Store token and user in localStorage
      if (response.token) {
        tokenManager.setToken(response.token);
        tokenManager.setUser(response.user);
      }

      return response;
    } catch (error) {
      // Clear any stale auth data on login failure
      tokenManager.clearAuth();
      throw error;
    }
  }

  /**
   * Logout current user
   * Clears local storage and notifies backend
   */
  async logout(): Promise<void> {
    try {
      // Call backend logout endpoint
      await api.post<null>(apiEndpoints.auth.logout);
    } catch (error) {
      // Log error but don't throw - we still want to clear local auth
      console.error("Logout API call failed:", error);
    } finally {
      // Always clear local auth data
      tokenManager.clearAuth();
    }
  }

  /**
   * Get current authenticated user
   *
   * @returns Current user information
   */
  async getCurrentUser(): Promise<User> {
    const response = await api.get<User>(apiEndpoints.auth.me);

    // Update stored user data
    tokenManager.setUser(response);

    return response;
  }

  /**
   * Get all active users
   * Users who have been active in the last 30 minutes
   *
   * @returns Array of active users
   */
  async getActiveUsers(): Promise<ActiveUser[]> {
    const response = await api.get<ActiveUser[]>(apiEndpoints.auth.activeUsers);

    return response;
  }

  /**
   * Check if user is authenticated
   * Validates token by attempting to fetch current user
   *
   * @returns true if authenticated, false otherwise
   */
  async checkAuth(): Promise<boolean> {
    try {
      const token = tokenManager.getToken();

      if (!token) {
        return false;
      }

      // Verify token is valid by fetching current user
      await this.getCurrentUser();

      return true;
    } catch (error) {
      // Token is invalid or expired
      tokenManager.clearAuth();
      return false;
    }
  }

  /**
   * Get stored token from localStorage
   *
   * @returns Token string or null
   */
  getStoredToken(): string | null {
    return tokenManager.getToken();
  }

  /**
   * Get stored user from localStorage
   *
   * @returns User object or null
   */
  getStoredUser(): User | null {
    return tokenManager.getUser();
  }

  /**
   * Check if user has a valid token stored locally
   * Note: This does not validate the token with the server
   *
   * @returns true if token exists, false otherwise
   */
  hasStoredToken(): boolean {
    return !!tokenManager.getToken();
  }
}

// Export singleton instance
export const authService = new AuthService();
export default authService;
