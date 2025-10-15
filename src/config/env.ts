/**
 * Environment Configuration
 * Centralizes all environment variables with validation and defaults
 */

interface EnvironmentConfig {
  // API Configuration
  apiUrl: string;
  apiVersion: string;
  apiTimeout: number;

  // WebSocket Configuration
  socketUrl: string;
  socketReconnectionAttempts: number;
  socketReconnectionDelay: number;

  // Application Configuration
  appName: string;
  isDevelopment: boolean;
  isProduction: boolean;

  // Feature Flags
  enableLogging: boolean;
  enableDebugMode: boolean;
}

/**
 * Get environment variable with fallback
 */
function getEnvVar(key: string, defaultValue: string = ""): string {
  return import.meta.env[key] || defaultValue;
}

/**
 * Get boolean environment variable
 */
function getEnvBoolean(key: string, defaultValue: boolean = false): boolean {
  const value = getEnvVar(key);
  if (!value) return defaultValue;
  return value.toLowerCase() === "true" || value === "1";
}

/**
 * Get number environment variable
 */
function getEnvNumber(key: string, defaultValue: number): number {
  const value = getEnvVar(key);
  const parsed = parseInt(value, 10);
  return isNaN(parsed) ? defaultValue : parsed;
}

/**
 * Validate required environment variables
 */
function validateEnvironment(): void {
  const required = ["VITE_API_URL"];
  const missing = required.filter((key) => !import.meta.env[key]);

  if (missing.length > 0) {
    console.warn(
      `⚠️  Missing environment variables: ${missing.join(
        ", "
      )}. Using defaults.`
    );
  }
}

/**
 * Environment Configuration Object
 */
export const env: EnvironmentConfig = {
  // API Configuration
  apiUrl: getEnvVar("VITE_API_URL", "http://localhost:5000"),
  apiVersion: getEnvVar("VITE_API_VERSION", "v1"),
  apiTimeout: getEnvNumber("VITE_API_TIMEOUT", 30000), // 30 seconds

  // WebSocket Configuration
  socketUrl: getEnvVar("VITE_SOCKET_URL", "http://localhost:5000"),
  socketReconnectionAttempts: getEnvNumber(
    "VITE_SOCKET_RECONNECTION_ATTEMPTS",
    5
  ),
  socketReconnectionDelay: getEnvNumber("VITE_SOCKET_RECONNECTION_DELAY", 1000),

  // Application Configuration
  appName: getEnvVar("VITE_APP_NAME", "3D Collaborative Platform"),
  isDevelopment: import.meta.env.DEV,
  isProduction: import.meta.env.PROD,

  // Feature Flags
  enableLogging: getEnvBoolean("VITE_ENABLE_LOGGING", import.meta.env.DEV),
  enableDebugMode: getEnvBoolean("VITE_ENABLE_DEBUG", import.meta.env.DEV),
};

// Validate on module load
validateEnvironment();

/**
 * Helper to construct API URLs
 */
export const apiEndpoints = {
  base: `${env.apiUrl}/api/${env.apiVersion}`,
  auth: {
    login: "/auth/login",
    logout: "/auth/logout",
    me: "/auth/me",
    activeUsers: "/auth/active-users",
  },
  projects: {
    list: "/projects",
    create: "/projects",
    myProjects: "projects/my-projects",
    detail: (id: string) => `/projects/${id}`,
    update: (id: string) => `/projects/${id}`,
    delete: (id: string) => `/projects/${id}`,
    addModel: (id: string) => `/projects/${id}/models`,
    updateModel: (projectId: string, modelId: string) =>
      `/projects/${projectId}/models/${modelId}`,
    deleteModel: (projectId: string, modelId: string) =>
      `/projects/${projectId}/models/${modelId}`,
    addCamera: (projectId: string) =>
      `/projects/${projectId}/camera`,
  },
  annotations: {
    list: (projectId: string) => `/projects/${projectId}/annotations`,
    create: (projectId: string) => `/projects/${projectId}/annotations`,
    update: (projectId: string, annotationId: string) =>
      `/projects/${projectId}/annotations/${annotationId}`,
    delete: (projectId: string, annotationId: string) =>
      `/projects/${projectId}/annotations/${annotationId}`,
  },
  chat: {
    messages: (projectId: string) => `/projects/${projectId}/messages`,
    send: (projectId: string) => `/projects/${projectId}/messages`,
  },
  health: "/health",
};

/**
 * Log configuration (only in development)
 */
if (env.isDevelopment && env.enableLogging) {
  console.log("🔧 Environment Configuration:", {
    apiUrl: env.apiUrl,
    apiVersion: env.apiVersion,
    socketUrl: env.socketUrl,
    environment: env.isDevelopment ? "development" : "production",
  });
}

export default env;
