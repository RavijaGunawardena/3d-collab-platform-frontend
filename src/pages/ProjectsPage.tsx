export default ProjectsPage;
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Search, Loader2, FolderOpen, User, Users } from "lucide-react";

import { useProjectStore } from "@/store/projectStore";
import { useAuthStore } from "@/store/authStore";
import { getUserDisplayName } from "@/types/project.types";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
    fetchProjects,
    fetchMyProjects,
    setSearchQuery,
    searchQuery,
    currentPage,
    totalPages,
    totalProjects,
  } = useProjectStore();

  const [localSearch, setLocalSearch] = useState("");
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [activeTab, setActiveTab] = useState("all");

  /**
   * Fetch projects based on active tab
   */
  const loadProjects = () => {
    if (activeTab === "all") {
      fetchProjects();
    } else {
      fetchMyProjects();
    }
  };

  /**
   * Fetch projects on mount and tab change
   */
  useEffect(() => {
    loadProjects();
  }, [activeTab]);

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
  const formatDate = (date: Date) => {
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      {/* Header */}
      <header className="sticky top-0 z-10 border-b border-border bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/60">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">Projects</h1>
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

          {/* Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-4">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="all" className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                All Projects
              </TabsTrigger>
              <TabsTrigger value="my" className="flex items-center gap-2">
                <User className="h-4 w-4" />
                My Projects
              </TabsTrigger>
            </TabsList>
          </Tabs>
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
                <CardTitle>
                  {activeTab === "all"
                    ? "No projects found"
                    : "No projects yet"}
                </CardTitle>
                <CardDescription>
                  {searchQuery
                    ? `No projects found for "${searchQuery}"`
                    : activeTab === "all"
                    ? "No projects are available"
                    : "Create your first 3D collaborative project to get started"}
                </CardDescription>
              </CardHeader>
              {activeTab === "my" && (
                <CardContent className="text-center">
                  <Button onClick={handleCreateProject}>
                    <Plus className="mr-2 h-4 w-4" />
                    Create Project
                  </Button>
                </CardContent>
              )}
            </Card>
          </div>
        )}

        {/* Projects Grid */}
        {!isLoading && projects.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects.map((project) => {
              return (
                <Card
                  key={project.id}
                  className={`cursor-pointer hover:shadow-lg transition-all hover:shadow-lg"
                  }`}
                  onClick={() => handleProjectClick(project.id)}
                >
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <CardTitle className="line-clamp-1 flex items-center gap-2">
                          {project.title}
                        </CardTitle>
                        <CardDescription className="line-clamp-2">
                          {project.description || "No description"}
                        </CardDescription>
                      </div>
                    </div>
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
                        <span className={`font-medium text-foreground`}>
                          {activeTab === "my"
                            ? "You"
                            : getUserDisplayName(project.createdBy)}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {/* Projects Count and Pagination Info */}
        {!isLoading && projects.length > 0 && (
          <div className="mt-6 text-center text-sm text-muted-foreground">
            <div className="space-y-2">
              <p>
                Showing {projects.length} project
                {projects.length !== 1 ? "s" : ""}
                {activeTab === "all" && totalProjects > 0 && (
                  <span> of {totalProjects} total</span>
                )}
              </p>
              {activeTab === "all" && totalPages > 1 && (
                <p>
                  Page {currentPage} of {totalPages}
                </p>
              )}
            </div>
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
