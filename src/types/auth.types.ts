/**
 * User Interface
 * Represents a user in the system
 */
export interface User {
  id: string;
  username: string;
  lastActive: Date;
  createdAt: Date;
}

/**
 * Login Request Payload
 */
export interface LoginRequest {
  username: string;
}

/**
 * Login Response
 * Response from the login endpoint
 */
export interface LoginResponse {
  user: {
    id: string;
    username: string;
    createdAt: Date;
  };
  token: string;
  expiresIn: string;
}

/**
 * Auth State Interface
 * Used for managing authentication state
 */
export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

/**
 * Active User Response
 * Response from the active users endpoint
 */
export interface ActiveUser {
  id: string;
  username: string;
  lastActive: Date;
}
