import { useEffect } from "react";
import { useAuthStore } from "@/store/authStore";

/**
 * Auth Provider Component
 * Initializes authentication state on app load
 */
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const checkAuth = useAuthStore((state) => state.checkAuth);

  useEffect(() => {
    // Check authentication status on mount
    checkAuth();
  }, [checkAuth]);

  return <>{children}</>;
}

export default AuthProvider;
