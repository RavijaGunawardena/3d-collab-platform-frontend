import { Loader2 } from "lucide-react";
import { lazy, Suspense } from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { Toaster } from "sonner";
import LoginPage from "./pages/Loginpage";
import useAuthStore from "./store/authStore";
import AuthProvider from "./components/auth/AuthProvider";
// import ProtectedRoute from "./components/auth/ProtectedRoute";

// Lazy loaded pages
// const ProjectPages = lazy(() => import())

/**
 * Loading Fallback Component
 */
function PageLoadingFallback() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
      <div className="text-center space-y-4">
        <Loader2 className="h-12 w-12 animate-spin text-slate-600 dark:text-slate-400 mx-auto" />
        <p className="text-sm text-slate-600 dark:text-slate-400">Loading...</p>
      </div>
    </div>
  );
}

/**
 * Root Redirect Component
 * Redirects to login or projects based on auth state
 */
function RootRedirect() {
  const { isAuthenticated, isInitialized } = useAuthStore();


  if (!isInitialized) {
    return <PageLoadingFallback />;
  }

  // Redirect based on authentication status
  return <Navigate to={isAuthenticated ? "/projects" : "/login"} replace />;
}

/**
 * App Component
 * Main application component with routing
 */
function App() {
  return (
    <BrowserRouter>
      {/* Toast notifications */}
      <AuthProvider>
        <Toaster
          position="top-right"
          expand={false}
          richColors
          closeButton
          duration={4000}
        />

        <Suspense fallback={<PageLoadingFallback />}>
          <Routes>
            {/* Root - Smart redirect based on auth */}
            <Route path="/" element={<RootRedirect />} />

            {/* Public Routes */}
            <Route path="/login" element={<LoginPage />} />

            {/* Protected Routes */}
            {/* <Route
            path="/"
            // element={<ProtectedRoute></ProtectedRoute>}
          /> */}

            {/* <Route
            path="/project/:id"
            // element={
            //   <ProtectedRoute>
            //     <ProjectViewerPage />
            //   </ProtectedRoute>
            // }
          /> */}

            {/* Catch-all redirect to home */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
