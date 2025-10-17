import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Plus,
  Search,
  FolderOpen,
  User,
  Users,
  Calendar,
  Eye,
  Sparkles,
  Grid3X3,
  MoreVertical,
  Rocket,
  Zap,
  Globe,
  ArrowRight,
  Box,
} from "lucide-react";

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
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { CreateProjectDialog } from "@/components/projects/CreateProjectDialog";

/**
 * Enhanced Projects Page Component
 * Awesome UI with 3D theme and responsive design
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
  const [hoveredProject, setHoveredProject] = useState<string | null>(null);

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
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return "Today";
    if (diffDays === 1) return "Yesterday";
    if (diffDays < 7) return `${diffDays} days ago`;

    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  /**
   * Get user initials for avatar
   */
  const getUserInitials = (name: string): string => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const filteredProjects = projects || [];

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/10 relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-10 right-20 w-40 h-40 bg-primary/5 rounded-full blur-3xl animate-pulse" />
        <div
          className="absolute bottom-20 left-10 w-32 h-32 bg-chart-2/10 rounded-lg rotate-12 animate-bounce"
          style={{ animationDuration: "4s" }}
        />
        <div
          className="absolute top-1/2 left-1/4 w-24 h-24 bg-chart-1/5 rounded-full animate-pulse"
          style={{ animationDelay: "2s" }}
        />

        {/* Grid Pattern */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.01)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.01)_1px,transparent_1px)] bg-[size:60px_60px] [mask-image:radial-gradient(ellipse_100%_50%_at_50%_50%,#000_70%,transparent_110%)]" />
      </div>

      {/* Header */}
      <header className="relative z-10 top-0 backdrop-blur-xl bg-card/80 border-b border-border/50 shadow-lg shadow-primary/5">
        <div className="container mx-auto px-4 sm:px-6 py-6">
          {/* Header Top */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gradient-to-br from-primary to-chart-1 rounded-xl shadow-lg shadow-primary/25">
                  <Grid3X3 className="w-6 h-6 text-primary-foreground" />
                </div>
                <div>
                  <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-foreground to-primary bg-clip-text text-transparent">
                    Projects
                  </h1>
                  <p className="text-sm text-muted-foreground">
                    Welcome back,{" "}
                    <span className="font-medium text-foreground">
                      {user?.username}
                    </span>
                  </p>
                </div>
              </div>
            </div>

            <Button
              onClick={handleCreateProject}
              className="group bg-gradient-to-r from-primary to-chart-1 hover:from-primary/90 hover:to-chart-1/90 shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30 transition-all duration-300"
              size="lg"
            >
              <div className="flex items-center gap-2">
                <Plus className="w-4 h-4 group-hover:rotate-90 transition-transform duration-200" />
                <span>New Project</span>
                <Rocket className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-200" />
              </div>
            </Button>
          </div>

          {/* Search Bar */}
          <div className="relative mb-6">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search projects by name, description, or creator..."
              value={localSearch}
              onChange={(e) => setLocalSearch(e.target.value)}
              className="pl-12 pr-4 h-12 text-base bg-background/50 backdrop-blur-sm border-border/50 focus:border-primary/50 hover:border-primary/30 transition-all duration-300"
            />
            {localSearch && (
              <div className="absolute right-4 top-1/2 -translate-y-1/2">
                <Badge variant="secondary" className="text-xs">
                  {filteredProjects.length} found
                </Badge>
              </div>
            )}
          </div>

          {/* Tabs */}
          <Tabs
            value={activeTab}
            onValueChange={setActiveTab}
            className="w-full"
          >
            <TabsList className="grid w-full grid-cols-2 bg-background/50 backdrop-blur-sm border border-border/50">
              <TabsTrigger
                value="all"
                className="flex items-center gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all duration-200"
              >
                <Users className="h-4 w-4" />
                <span className="hidden sm:inline">All Projects</span>
                <span className="sm:hidden">All</span>
                <Badge variant="secondary" className="ml-1 text-xs">
                  {totalProjects || 0}
                </Badge>
              </TabsTrigger>
              <TabsTrigger
                value="my"
                className="flex items-center gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all duration-200"
              >
                <User className="h-4 w-4" />
                <span className="hidden sm:inline">My Projects</span>
                <span className="sm:hidden">Mine</span>
                <Badge variant="secondary" className="ml-1 text-xs">
                  {projects?.filter(
                    (p) => getUserDisplayName(p.createdBy) === user?.username
                  ).length || 0}
                </Badge>
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative z-10 container mx-auto px-4 sm:px-6 py-8">
        {/* Error Message */}
        {error && (
          <div className="mb-8 p-4 bg-destructive/10 border border-destructive/20 rounded-xl backdrop-blur-sm animate-in">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-destructive/20 flex items-center justify-center">
                <Zap className="w-4 h-4 text-destructive" />
              </div>
              <p className="text-sm text-destructive font-medium">{error}</p>
            </div>
          </div>
        )}

        {/* Loading State */}
        {isLoading && (
          <div className="flex items-center justify-center py-24">
            <div className="text-center space-y-6 animate-in">
              <div className="relative">
                <div className="w-16 h-16 border-4 border-primary/20 border-t-primary rounded-full animate-spin mx-auto" />
                <Box className="w-6 h-6 text-primary absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-pulse" />
              </div>
              <div className="space-y-2">
                <p className="text-lg font-medium text-foreground">
                  Loading your workspace
                </p>
                <p className="text-sm text-muted-foreground">
                  Fetching your 3D collaborative projects...
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Empty State */}
        {!isLoading && filteredProjects.length === 0 && (
          <div className="flex items-center justify-center py-24">
            <Card className="max-w-lg w-full bg-card/50 backdrop-blur-sm border-border/50 shadow-xl shadow-primary/5 animate-in">
              <CardHeader className="text-center pb-6">
                <div className="mx-auto mb-6 w-20 h-20 bg-gradient-to-br from-muted to-muted/50 rounded-2xl flex items-center justify-center">
                  <FolderOpen className="w-10 h-10 text-muted-foreground" />
                </div>
                <CardTitle className="text-xl">
                  {searchQuery
                    ? "No matching projects"
                    : activeTab === "all"
                    ? "No projects available"
                    : "Ready to create?"}
                </CardTitle>
                <CardDescription className="text-base leading-relaxed">
                  {searchQuery
                    ? `No projects found for "${searchQuery}". Try adjusting your search terms.`
                    : activeTab === "all"
                    ? "The platform is ready for collaboration. Projects will appear here once created."
                    : "Start your 3D collaborative journey by creating your first project."}
                </CardDescription>
              </CardHeader>
              {(activeTab === "my" || searchQuery) && (
                <CardContent className="text-center pt-0">
                  <Button
                    onClick={handleCreateProject}
                    className="group bg-gradient-to-r from-primary to-chart-1 hover:from-primary/90 hover:to-chart-1/90 shadow-lg shadow-primary/25"
                    size="lg"
                  >
                    <Plus className="w-4 h-4 mr-2 group-hover:rotate-90 transition-transform duration-200" />
                    Create Your First Project
                    <Sparkles className="w-4 h-4 ml-2 group-hover:scale-110 transition-transform duration-200" />
                  </Button>
                </CardContent>
              )}
            </Card>
          </div>
        )}

        {/* Projects Grid */}
        {!isLoading && filteredProjects.length > 0 && (
          <div className="space-y-8">
            {/* Grid Header */}
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <h2 className="text-lg font-semibold text-foreground">
                  {activeTab === "all" ? "All Projects" : "Your Projects"}
                </h2>
                <p className="text-sm text-muted-foreground">
                  {filteredProjects.length} project
                  {filteredProjects.length !== 1 ? "s" : ""}
                  {activeTab === "all" &&
                    totalProjects > filteredProjects.length && (
                      <span> of {totalProjects} total</span>
                    )}
                </p>
              </div>

              <Badge
                variant="secondary"
                className="hidden sm:flex items-center gap-1"
              >
                <Eye className="w-3 h-3" />
                Live Workspace
              </Badge>
            </div>

            {/* Projects Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {filteredProjects.map((project, index) => (
                <Card
                  key={project.id}
                  className={`group cursor-pointer transition-all duration-300 hover:shadow-2xl hover:shadow-primary/10 hover:-translate-y-1 bg-card/50 backdrop-blur-sm border-border/50 overflow-hidden animate-in`}
                  style={{ animationDelay: `${index * 100}ms` }}
                  onClick={() => handleProjectClick(project.id)}
                  onMouseEnter={() => setHoveredProject(project.id)}
                  onMouseLeave={() => setHoveredProject(null)}
                >
                  {/* Card Header */}
                  <CardHeader className="relative pb-4">
                    {/* Hover Gradient Overlay */}
                    <div
                      className={`absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-chart-1/5 transition-opacity duration-300 ${
                        hoveredProject === project.id
                          ? "opacity-100"
                          : "opacity-0"
                      }`}
                    />

                    <div className="relative flex items-start justify-between">
                      <div className="flex-1 min-w-0 space-y-2">
                        <div className="flex items-start gap-3">
                          <div className="p-2 bg-gradient-to-br from-primary/10 to-chart-1/10 rounded-lg border border-primary/20">
                            <Box className="w-4 h-4 text-primary" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <CardTitle className="line-clamp-1 text-lg group-hover:text-primary transition-colors duration-200">
                              {project.title}
                            </CardTitle>
                            <CardDescription className="line-clamp-2 text-sm leading-relaxed">
                              {project.description || "No description provided"}
                            </CardDescription>
                          </div>
                        </div>
                      </div>

                      <Button
                        variant="ghost"
                        size="sm"
                        className={`opacity-0 group-hover:opacity-100 transition-opacity duration-200 h-8 w-8 p-0 ${
                          hoveredProject === project.id ? "opacity-100" : ""
                        }`}
                        onClick={(e) => {
                          e.stopPropagation();
                          // Add more actions here
                        }}
                      >
                        <MoreVertical className="w-4 h-4" />
                      </Button>
                    </div>
                  </CardHeader>

                  {/* Card Content */}
                  <CardContent className="space-y-4">
                    {/* Project Stats */}
                    <div className="grid grid-cols-3 gap-4">
                      <div className="text-center p-2 bg-background/50 rounded-lg border border-border/30">
                        <div className="text-lg font-bold text-foreground">
                          {project.modelCount || 0}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Models
                        </div>
                      </div>
                      <div className="text-center p-2 bg-background/50 rounded-lg border border-border/30">
                        <div className="text-lg font-bold text-foreground">
                          {Math.floor(Math.random() * 50)}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Annotations
                        </div>
                      </div>
                      <div className="text-center p-2 bg-background/50 rounded-lg border border-border/30">
                        <div className="text-lg font-bold text-foreground">
                          {Math.floor(Math.random() * 10) + 1}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Users
                        </div>
                      </div>
                    </div>

                    {/* Project Meta */}
                    <div className="space-y-3">
                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Calendar className="w-3 h-3" />
                          <span>Created</span>
                        </div>
                        <span className="font-medium text-foreground">
                          {formatDate(project.createdAt)}
                        </span>
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <User className="w-3 h-3" />
                          <span>Creator</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Avatar className="w-6 h-6">
                            <AvatarFallback className="text-xs bg-primary/10 text-primary">
                              {getUserInitials(
                                activeTab === "my"
                                  ? "You"
                                  : getUserDisplayName(project.createdBy)
                              )}
                            </AvatarFallback>
                          </Avatar>
                          <span className="text-sm font-medium text-foreground">
                            {activeTab === "my"
                              ? "You"
                              : getUserDisplayName(project.createdBy)}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Action Button */}
                    <div className="pt-2">
                      <div
                        className={`flex items-center justify-center gap-2 text-sm text-primary transition-all duration-200 ${
                          hoveredProject === project.id ? "gap-3" : "gap-2"
                        }`}
                      >
                        <Globe className="w-4 h-4" />
                        <span className="font-medium">Open Workspace</span>
                        <ArrowRight
                          className={`w-4 h-4 transition-transform duration-200 ${
                            hoveredProject === project.id ? "translate-x-1" : ""
                          }`}
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Pagination Info */}
        {!isLoading && filteredProjects.length > 0 && (
          <div className="mt-12 text-center animate-in">
            <div className="inline-flex items-center gap-4 px-6 py-3 bg-card/50 backdrop-blur-sm border border-border/50 rounded-full">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                <span>Platform Active</span>
              </div>
              {activeTab === "all" && totalPages > 1 && (
                <>
                  <div className="w-1 h-1 rounded-full bg-border" />
                  <span className="text-sm text-muted-foreground">
                    Page {currentPage} of {totalPages}
                  </span>
                </>
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

export default ProjectsPage;
