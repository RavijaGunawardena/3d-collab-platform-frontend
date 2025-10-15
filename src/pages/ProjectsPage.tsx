import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Search, Loader2, FolderOpen } from "lucide-react";
// import { toast } from "sonner";

import { useProjectStore } from "@/store/projectStore";
import { useAuthStore } from "@/store/authStore";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { CreateProjectDialog } from "@/components/projects/CreateProjectDialog";

/**
 * Projects Page Component
 * Main dashboard for viewing and managing projects
 */
export function ProjectsPage() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const {
    projects,
    isLoading,
    error,
    fetchMyProjects,
    setSearchQuery,
    searchQuery,
  } = useProjectStore();

  const [localSearch, setLocalSearch] = useState("");
  const [showCreateDialog, setShowCreateDialog] = useState(false);

  /**
   * Fetch projects on mount
   */
  useEffect(() => {
    fetchMyProjects();
  }, [fetchMyProjects]);

  /**
   * Handle search with debounce
   */
  useEffect(() => {
    const timer = setTimeout(() => {
      if (localSearch !== searchQuery) {
        setSearchQuery(localSearch);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [localSearch, searchQuery, setSearchQuery]);

  /**
   * Handle project click
   */
  const handleProjectClick = (projectId: string) => {
    navigate(`/project/${projectId}`);
  };

  /**
   * Handle create project button
   */
  const handleCreateProject = () => {
    setShowCreateDialog(true);
  };

  /**
   * Format date for display
   */
  const formatDate = (date: Date | string) => {
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  /**
   * Get creator username
   */
  const getCreatorUsername = (createdBy: any): string => {
    if (typeof createdBy === "string") {
      return "Unknown";
    }
    return createdBy?.username || "Unknown";
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      {/* Header */}
      <header className="sticky top-0 z-10 border-b border-border bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/60">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">My Projects</h1>
              <p className="text-sm text-muted-foreground">
                Welcome back, {user?.username}
              </p>
            </div>
            <Button onClick={handleCreateProject}>
              <Plus className="mr-2 h-4 w-4" />
              New Project
            </Button>
          </div>

          {/* Search Bar */}
          <div className="mt-4 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search projects..."
              value={localSearch}
              onChange={(e) => setLocalSearch(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
            <p className="text-sm text-destructive">{error}</p>
          </div>
        )}

        {/* Loading State */}
        {isLoading && (
          <div className="flex items-center justify-center py-12">
            <div className="text-center space-y-4">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground mx-auto" />
              <p className="text-sm text-muted-foreground">
                Loading projects...
              </p>
            </div>
          </div>
        )}

        {/* Empty State */}
        {!isLoading && projects.length === 0 && (
          <div className="flex items-center justify-center py-12">
            <Card className="max-w-md w-full">
              <CardHeader className="text-center">
                <div className="mx-auto mb-4 h-12 w-12 rounded-full bg-muted flex items-center justify-center">
                  <FolderOpen className="h-6 w-6 text-muted-foreground" />
                </div>
                <CardTitle>No projects yet</CardTitle>
                <CardDescription>
                  {searchQuery
                    ? `No projects found for "${searchQuery}"`
                    : "Create your first 3D collaborative project to get started"}
                </CardDescription>
              </CardHeader>
              <CardContent className="text-center">
                <Button onClick={handleCreateProject}>
                  <Plus className="mr-2 h-4 w-4" />
                  Create Project
                </Button>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Projects Grid */}
        {!isLoading && projects.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects.map((project) => (
              <Card
                key={project.id}
                className="cursor-pointer hover:shadow-lg transition-shadow"
                onClick={() => handleProjectClick(project.id)}
              >
                <CardHeader>
                  <CardTitle className="line-clamp-1">
                    {project.title}
                  </CardTitle>
                  <CardDescription className="line-clamp-2">
                    {project.description || "No description"}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 text-sm text-muted-foreground">
                    <div className="flex items-center justify-between">
                      <span>Models:</span>
                      <span className="font-medium text-foreground">
                        {project.modelCount || 0}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Created:</span>
                      <span className="font-medium text-foreground">
                        {formatDate(project.createdAt)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>By:</span>
                      <span className="font-medium text-foreground">
                        {getCreatorUsername(project.createdBy)}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Projects Count */}
        {!isLoading && projects.length > 0 && (
          <div className="mt-6 text-center text-sm text-muted-foreground">
            Showing {projects.length} project{projects.length !== 1 ? "s" : ""}
          </div>
        )}
      </main>

      {/* Create Project Dialog */}
      <CreateProjectDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
      />
    </div>
  );
}

export default ProjectsPage;
