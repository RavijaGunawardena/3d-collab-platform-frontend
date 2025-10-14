/**
 * Standard API Response Interface
 * Matches the backend ApiResponse structure exactly
 */
export interface ApiResponse<T = any> {
  status: "success" | "error";
  message?: string;
  data?: T;
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
    totalPages?: number;
  };
  timestamp: string;
}

/**
 * API Error Response
 * Structure for error responses from the backend
 */
export interface ApiErrorResponse {
  status: "error";
  code?: string;
  message: string;
  details?: any;
  errors?: Record<string, string[]>; // Validation errors from Zod
  stack?: string; // Only in development
  timestamp: string;
  path?: string;
  method?: string;
}

/**
 * Validation Error Structure
 * Used when form validation fails (from Zod)
 */
export interface ValidationErrors {
  [field: string]: string[]; // field name -> array of error messages
}

/**
 * Success Response Helper Type
 * Used to type successful API responses
 */
export type SuccessResponse<T> = ApiResponse<T> & {
  status: "success";
  data: T;
};

/**
 * Error Response Helper Type
 * Used to type error API responses
 */
export type ErrorResponse = ApiResponse<never> & {
  status: "error";
};

/**
 * Health Check Response
 * Response from /health endpoint
 */
export interface HealthCheckResponse {
  status: "success";
  message: string;
  timestamp: string;
  uptime: number;
  environment: string;
}

/**
 * API Request Config
 * Additional configuration for API requests
 */
export interface ApiRequestConfig {
  requiresAuth?: boolean;
  timeout?: number;
  retries?: number;
  suppressErrorToast?: boolean; // Don't show error toast for this request
}
