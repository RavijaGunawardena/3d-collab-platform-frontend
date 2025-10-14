import useAuthStore from "@/store/authStore";
import { Loader2 } from "lucide-react";
import React, { useEffect } from "react";
import { Navigate, useLocation } from "react-router-dom";

/**
 * Protected Route Props
 */
interface ProtectedRouteProps {
  children: React.ReactNode;
  redirectTo?: string;
}

/**
 * Loading Spinner Component
 */
function LoadingSpinner() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
      <div className="text-center space-y-4">
        <Loader2 className="h-12 w-12 animate-spin text-slate-600 dark:text-slate-400 mx-auto" />
        <p className="text-sm text-slate-600 dark:text-slate-400">
          Checking authentication...
        </p>
      </div>
    </div>
  );
}

/**
 * Protected Route Component
 * Wraps routes that require authentication
 */
export function ProtectedRoute({
  children,
  redirectTo = "/login",
}: ProtectedRouteProps) {
  const location = useLocation();
  const { isAuthenticated, isInitialized, checkAuth } = useAuthStore();

  /**
   * Check authentication on mount
   */
  useEffect(() => {
    if (!isInitialized) {
      checkAuth();
    }
  }, [isInitialized, checkAuth]);

  /**
   * Show loading spinner while checking authentication
   */
  if (!isInitialized) {
    return <LoadingSpinner />;
  }

  /**
   * Redirect to login if not authenticated
   * Preserve current location to redirect back after login
   */
  if (!isAuthenticated) {
    return (
      <Navigate to={redirectTo} state={{ from: location.pathname }} replace />
    );
  }

  /**
   * Render protected content
   */
  return <>{children}</>;
}

export default ProtectedRoute;
