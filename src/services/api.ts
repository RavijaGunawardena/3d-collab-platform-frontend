import axios, {
  AxiosInstance,
  AxiosError,
  AxiosRequestConfig,
  InternalAxiosRequestConfig,
  AxiosResponse,
} from "axios";
import { env, apiEndpoints } from "@/config/env";
import {
  ApiResponse,
  ApiErrorResponse,
  ApiRequestConfig,
} from "@/types/api.types";

/**
 * Token Storage Keys
 */
const TOKEN_KEY = "auth_token";
const USER_KEY = "auth_user";

/**
 * Token Management
 */
export const tokenManager = {
  getToken: (): string | null => {
    return localStorage.getItem(TOKEN_KEY);
  },

  setToken: (token: string): void => {
    localStorage.setItem(TOKEN_KEY, token);
  },

  removeToken: (): void => {
    localStorage.removeItem(TOKEN_KEY);
  },

  getUser: (): any | null => {
    const user = localStorage.getItem(USER_KEY);
    return user ? JSON.parse(user) : null;
  },

  setUser: (user: any): void => {
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  },

  removeUser: (): void => {
    localStorage.removeItem(USER_KEY);
  },

  clearAuth: (): void => {
    tokenManager.removeToken();
    tokenManager.removeUser();
  },
};

/**
 * Custom API Error Class
 */
export class ApiError extends Error {
  constructor(
    public statusCode: number,
    public code: string,
    message: string,
    public details?: any,
    public errors?: Record<string, string[]>
  ) {
    super(message);
    this.name = "ApiError";
    Object.setPrototypeOf(this, ApiError.prototype);
  }

  /**
   * Check if error is a validation error
   */
  isValidationError(): boolean {
    return this.code === "VALIDATION_ERROR" && !!this.errors;
  }

  /**
   * Check if error is an authentication error
   */
  isAuthError(): boolean {
    return this.statusCode === 401 || this.code === "UNAUTHORIZED";
  }

  /**
   * Get first validation error message
   */
  getFirstValidationError(): string | null {
    if (!this.errors) return null;
    const fields = Object.keys(this.errors);
    if (fields.length === 0) return null;
    const firstField = fields[0];
    if (firstField === undefined) return null;
    return this.errors[firstField]?.[0] || null;
  }
}

/**
 * Create Axios Instance
 */
const createAxiosInstance = (): AxiosInstance => {
  const instance = axios.create({
    baseURL: apiEndpoints.base,
    timeout: env.apiTimeout,
    headers: {
      "Content-Type": "application/json",
    },
  });

  /**
   * Request Interceptor
   * Attach JWT token to requests
   */
  instance.interceptors.request.use(
    (config: InternalAxiosRequestConfig) => {
      const token = tokenManager.getToken();

      if (token && config.headers) {
        config.headers.Authorization = `Bearer ${token}`;
      }

      // Log request in development
      if (env.enableLogging) {
        // console.log(
        //   `🚀 API Request: ${config.method?.toUpperCase()} ${config.url}`
        // );
      }

      return config;
    },
    (error: AxiosError) => {
      if (env.enableLogging) {
        console.error("❌ Request Error:", error);
      }
      return Promise.reject(error);
    }
  );

  /**
   * Response Interceptor
   * Handle responses and errors globally
   */
  instance.interceptors.response.use(
    (response: AxiosResponse<ApiResponse>) => {
      // Log response in development
      if (env.enableLogging) {
        console.log(`✅ API Response: ${response.config.url}`, response.data);
      }

      return response;
    },
    async (error: AxiosError<ApiErrorResponse>) => {
      // Log error in development
      if (env.enableLogging) {
        console.error("❌ API Error:", error.response?.data || error.message);
      }

      // Handle network errors
      if (!error.response) {
        throw new ApiError(
          0,
          "NETWORK_ERROR",
          "Network error. Please check your connection.",
          { originalError: error.message }
        );
      }

      const { status, data } = error.response;

      // Handle 401 Unauthorized - Auto logout
      if (status === 401) {
        tokenManager.clearAuth();

        // Redirect to login if not already there
        if (window.location.pathname !== "/login") {
          window.location.href = "/login";
        }

        throw new ApiError(
          status,
          data?.code || "UNAUTHORIZED",
          data?.message || "Authentication required",
          data?.details
        );
      }

      // Handle 403 Forbidden
      if (status === 403) {
        throw new ApiError(
          status,
          data?.code || "FORBIDDEN",
          data?.message || "You do not have permission to perform this action",
          data?.details
        );
      }

      // Handle 404 Not Found
      if (status === 404) {
        throw new ApiError(
          status,
          data?.code || "NOT_FOUND",
          data?.message || "Resource not found",
          data?.details
        );
      }

      // Handle 422 Validation Error
      if (status === 422 || status === 400) {
        throw new ApiError(
          status,
          data?.code || "VALIDATION_ERROR",
          data?.message || "Validation failed",
          data?.details,
          data?.errors
        );
      }

      // Handle 429 Too Many Requests
      if (status === 429) {
        throw new ApiError(
          status,
          data?.code || "TOO_MANY_REQUESTS",
          data?.message || "Too many requests. Please try again later.",
          data?.details
        );
      }

      // Handle 500 Internal Server Error
      if (status >= 500) {
        throw new ApiError(
          status,
          data?.code || "INTERNAL_SERVER_ERROR",
          data?.message || "Something went wrong on our end. Please try again.",
          data?.details
        );
      }

      // Handle other errors
      throw new ApiError(
        status,
        data?.code || "UNKNOWN_ERROR",
        data?.message || "An unexpected error occurred",
        data?.details
      );
    }
  );

  return instance;
};

/**
 * API Instance
 */
export const apiClient = createAxiosInstance();

/**
 * Generic API Request Handler
 * Provides type-safe wrapper around axios with custom config
 */
export async function apiRequest<T>(
  config: AxiosRequestConfig,
  options?: ApiRequestConfig
): Promise<T> {
  try {
    const response = await apiClient.request<ApiResponse<T>>({
      ...config,
      timeout: options?.timeout || env.apiTimeout,
    });

    // Extract data from response
    return response.data.data as T;
  } catch (error) {
    // Re-throw ApiError
    if (error instanceof ApiError) {
      throw error;
    }

    // Handle unexpected errors
    console.error("Unexpected API error:", error);
    throw new ApiError(
      500,
      "UNEXPECTED_ERROR",
      "An unexpected error occurred",
      { originalError: error }
    );
  }
}

/**
 * API Methods
 * Convenience methods for common HTTP operations
 */
export const api = {
  /**
   * GET request
   */
  get: <T>(
    url: string,
    config?: AxiosRequestConfig,
    options?: ApiRequestConfig
  ): Promise<T> => {
    return apiRequest<T>({ ...config, method: "GET", url }, options);
  },

  /**
   * POST request
   */
  post: <T>(
    url: string,
    data?: any,
    config?: AxiosRequestConfig,
    options?: ApiRequestConfig
  ): Promise<T> => {
    return apiRequest<T>({ ...config, method: "POST", url, data }, options);
  },

  /**
   * PUT request
   */
  put: <T>(
    url: string,
    data?: any,
    config?: AxiosRequestConfig,
    options?: ApiRequestConfig
  ): Promise<T> => {
    return apiRequest<T>({ ...config, method: "PUT", url, data }, options);
  },

  /**
   * PATCH request
   */
  patch: <T>(
    url: string,
    data?: any,
    config?: AxiosRequestConfig,
    options?: ApiRequestConfig
  ): Promise<T> => {
    return apiRequest<T>({ ...config, method: "PATCH", url, data }, options);
  },

  /**
   * DELETE request
   */
  delete: <T>(
    url: string,
    config?: AxiosRequestConfig,
    options?: ApiRequestConfig
  ): Promise<T> => {
    return apiRequest<T>({ ...config, method: "DELETE", url }, options);
  },
};

export default api;
