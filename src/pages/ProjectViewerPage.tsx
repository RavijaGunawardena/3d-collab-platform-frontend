import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Users,
  MessageCircle,
  MapPin,
  Wifi,
  WifiOff,
  Monitor,
  Smartphone,
  Eye,
  Zap,
  Activity,
  Box,
} from "lucide-react";
import { toast } from "sonner";

import { useProjectStore } from "@/store/projectStore";
import { useSocket, useProjectRoom } from "@/hooks/useSocket";
import { Annotation } from "@/types/annotation.types";
import { Vector3, getUserDisplayName } from "@/types/project.types";

import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ThreeViewer } from "@/components/viewer/ThreeViewer";
import { ModelControls } from "@/components/viewer/ModelControls";
import { AnnotationPanel } from "@/components/viewer/AnnotationPanel";
import { CreateAnnotationDialog } from "@/components/viewer/CreateAnnotationDialog";
import { ChatPanel } from "@/components/viewer/ChatPanel";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

/**
 * Enhanced Project Viewer Page Component
 * Professional 3D collaborative workspace with awesome UI
 */
export function ProjectViewerPage() {
  const { id: projectId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { currentProject, fetchProjectById, isLoading } = useProjectStore();
  const { isConnected } = useSocket();
  const { activeUsers, isJoined, isJoining } = useProjectRoom(
    projectId || null
  );

  const [selectedModelId, setSelectedModelId] = useState<string | null>(null);
  const [selectedAnnotation, setSelectedAnnotation] =
    useState<Annotation | null>(null);
  const [isPlacingAnnotation, setIsPlacingAnnotation] = useState(false);
  const [annotationPosition, setAnnotationPosition] = useState<Vector3 | null>(
    null
  );
  const [showAnnotationDialog, setShowAnnotationDialog] = useState(false);
  const [mobileTab, setMobileTab] = useState<"chat" | "annotations" | null>(
    null
  );
  const [isMobileLayout, setIsMobileLayout] = useState(false);

  // Detect mobile layout
  useEffect(() => {
    const checkMobile = () => {
      setIsMobileLayout(window.innerWidth < 1024);
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  /**
   * Refresh project data
   */
  const handleProjectUpdate = () => {
    if (projectId) {
      fetchProjectById(projectId);
    }
  };

  /**
   * Handle annotation placement
   */
  const handleAnnotationPlaced = (position: Vector3) => {
    setAnnotationPosition(position);
    setShowAnnotationDialog(true);
    setIsPlacingAnnotation(false);
  };

  /**
   * Handle annotation created
   */
  const handleAnnotationCreated = () => {
    setAnnotationPosition(null);
  };

  /**
   * Fetch project on mount
   */
  useEffect(() => {
    if (projectId) {
      fetchProjectById(projectId).catch((error) => {
        console.error("Failed to fetch project:", error);
        toast.error("Failed to Load Project", {
          description:
            "The project could not be loaded. Returning to projects page.",
        });
        navigate("/");
      });
    }
  }, [projectId, fetchProjectById, navigate]);

  /**
   * Handle back to projects
   */
  const handleBack = () => {
    navigate("/");
  };

  /**
   * Get user initials
   */
  const getUserInitials = (name: string): string => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  /**
   * Get connection status details
   */
  const getConnectionStatus = () => {
    if (isConnected && isJoined) {
      return {
        status: "connected",
        color: "bg-green-500",
        icon: Wifi,
        text: "Connected",
      };
    } else if (isJoining) {
      return {
        status: "connecting",
        color: "bg-yellow-500 animate-pulse",
        icon: Activity,
        text: "Connecting...",
      };
    } else {
      return {
        status: "disconnected",
        color: "bg-red-500",
        icon: WifiOff,
        text: "Disconnected",
      };
    }
  };

  const connectionStatus = getConnectionStatus();
  const ConnectionIcon = connectionStatus.icon;

  // Enhanced loading state
  if (isLoading || !currentProject) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 relative overflow-hidden">
        {/* Animated Background */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-20 left-20 w-40 h-40 bg-primary/5 rounded-full blur-3xl animate-pulse" />
          <div
            className="absolute bottom-20 right-20 w-32 h-32 bg-chart-1/10 rounded-lg rotate-12 animate-bounce"
            style={{ animationDuration: "4s" }}
          />
          <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.01)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.01)_1px,transparent_1px)] bg-[size:100px_100px] [mask-image:radial-gradient(ellipse_80%_50%_at_50%_50%,#000_70%,transparent_110%)]" />
        </div>

        <div className="relative z-10 text-center space-y-6 animate-in">
          <div className="relative">
            <div className="w-20 h-20 border-4 border-primary/20 border-t-primary rounded-full animate-spin mx-auto" />
            <Box className="w-8 h-8 text-primary absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-pulse" />
          </div>
          <div className="space-y-2">
            <h2 className="text-xl font-semibold text-white">
              Loading Workspace
            </h2>
            <p className="text-sm text-slate-400">
              Preparing your 3D collaborative environment...
            </p>
          </div>

          <div className="flex items-center justify-center gap-4 text-xs text-slate-500">
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
              <span>3D Engine</span>
            </div>
            <div className="w-1 h-1 rounded-full bg-slate-600" />
            <div className="flex items-center gap-1">
              <div
                className="w-2 h-2 rounded-full bg-chart-1 animate-pulse"
                style={{ animationDelay: "0.5s" }}
              />
              <span>Real-time Sync</span>
            </div>
            <div className="w-1 h-1 rounded-full bg-slate-600" />
            <div className="flex items-center gap-1">
              <div
                className="w-2 h-2 rounded-full bg-chart-2 animate-pulse"
                style={{ animationDelay: "1s" }}
              />
              <span>Collaboration</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <TooltipProvider>
      <div className="h-screen flex flex-col bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white relative overflow-hidden">
        {/* Background Elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-0 right-0 w-96 h-96 bg-primary/2 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-0 w-80 h-80 bg-chart-1/3 rounded-full blur-3xl" />
        </div>

        {/* Enhanced Header */}
        <header className="relative z-10 h-16 border-b border-slate-800/50 bg-slate-900/80 backdrop-blur-xl shadow-lg shadow-primary/5">
          <div className="h-full flex items-center px-4 lg:px-6">
            <div className="flex items-center gap-4 flex-1">
              {/* Back Button */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleBack}
                    className="text-slate-300 hover:text-white hover:bg-slate-800/50 transition-all duration-200"
                  >
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    <span className="hidden sm:inline">Back</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Return to Projects</p>
                </TooltipContent>
              </Tooltip>

              <Separator orientation="vertical" className="h-6 bg-slate-700" />

              {/* Project Info */}
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <div className="p-2 bg-gradient-to-br from-primary/20 to-chart-1/20 rounded-lg border border-primary/30">
                  <Box className="w-4 h-4 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <h1 className="text-base lg:text-lg font-semibold truncate text-white">
                    {currentProject.title}
                  </h1>
                  <p className="text-xs text-slate-400 truncate">
                    Created by {getUserDisplayName(currentProject.createdBy)}
                  </p>
                </div>
              </div>

              {/* Collaboration Status */}
              <div className="flex items-center gap-3">
                {/* Active Users */}
                <div className="flex items-center gap-2">
                  {/* User Avatars (show first 3) */}
                  <div className="flex -space-x-2">
                    {activeUsers.slice(0, 3).map((user) => (
                      <Tooltip key={user.userId}>
                        <TooltipTrigger asChild>
                          <Avatar className="w-8 h-8 border-2 border-slate-800 bg-slate-700">
                            <AvatarFallback className="text-xs bg-gradient-to-br from-primary/20 to-chart-1/20 text-primary">
                              {getUserInitials(user.username)}
                            </AvatarFallback>
                          </Avatar>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>{user.username}</p>
                        </TooltipContent>
                      </Tooltip>
                    ))}
                    {activeUsers.length > 3 && (
                      <div className="w-8 h-8 rounded-full bg-slate-700 border-2 border-slate-800 flex items-center justify-center">
                        <span className="text-xs font-medium text-slate-300">
                          +{activeUsers.length - 3}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Users Count Badge */}
                  <Badge
                    variant="secondary"
                    className="bg-slate-800/50 text-slate-300 border-slate-700"
                  >
                    <Users className="h-3 w-3 mr-1" />
                    {activeUsers.length}
                  </Badge>
                </div>

                {/* Connection Status */}
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-800/50 border border-slate-700/50">
                      <div
                        className={`h-2 w-2 rounded-full ${connectionStatus.color}`}
                      />
                      <ConnectionIcon className="h-3 w-3 text-slate-400" />
                      <span className="text-xs text-slate-300 hidden sm:inline">
                        {connectionStatus.text}
                      </span>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Real-time collaboration status</p>
                  </TooltipContent>
                </Tooltip>

                {/* View Mode Indicator */}
                <Badge
                  variant="outline"
                  className="hidden md:flex items-center gap-1 bg-background/5 border-slate-700"
                >
                  {isMobileLayout ? (
                    <>
                      <Smartphone className="w-3 h-3" />
                      <span className="text-xs">Mobile</span>
                    </>
                  ) : (
                    <>
                      <Monitor className="w-3 h-3" />
                      <span className="text-xs">Desktop</span>
                    </>
                  )}
                </Badge>
              </div>
            </div>
          </div>
        </header>

        {/* Main Workspace */}
        <div className="flex-1 flex overflow-hidden relative z-10">
          {/* Left Sidebar - Chat (Desktop) */}
          <aside className="hidden lg:flex lg:w-80 xl:w-96 border-r border-slate-800/50 bg-slate-900/30 backdrop-blur-sm flex-col">
            <ChatPanel projectId={currentProject.id} className="h-full" />
          </aside>

          {/* Center - 3D Viewport */}
          <main className="flex-1 relative bg-slate-950 overflow-hidden">
            {/* Viewport Status Bar */}
            <div className="absolute top-4 left-4 z-20 flex items-center gap-2">
              <Badge
                variant="secondary"
                className="bg-slate-900/80 backdrop-blur-sm border-slate-700/50 text-slate-300"
              >
                <Eye className="w-3 h-3 mr-1" />
                3D Viewport
              </Badge>

              {isPlacingAnnotation && (
                <Badge className="bg-primary/90 text-primary-foreground animate-pulse">
                  <MapPin className="w-3 h-3 mr-1" />
                  Annotation Mode
                </Badge>
              )}
            </div>

            {/* Performance Indicator (Debug) */}
            {process.env.NODE_ENV === "development" && (
              <div className="absolute bottom-4 left-4 z-20">
                <Badge
                  variant="outline"
                  className="bg-slate-900/80 backdrop-blur-sm border-slate-700/50 text-slate-400"
                >
                  <Zap className="w-3 h-3 mr-1" />
                  WebGL Active
                </Badge>
              </div>
            )}

            {/* 3D Viewer */}
            <ThreeViewer
              project={currentProject}
              selectedModelId={selectedModelId}
              isPlacingAnnotation={isPlacingAnnotation}
              onAnnotationPlaced={handleAnnotationPlaced}
            />

            {/* Model Controls (Floating) */}
            <ModelControls
              project={currentProject}
              onProjectUpdate={handleProjectUpdate}
              selectedModelId={selectedModelId}
              onModelSelect={setSelectedModelId}
            />
          </main>

          {/* Right Sidebar - Annotations (Desktop) */}
          <aside className="hidden lg:flex lg:w-80 xl:w-96 border-l border-slate-800/50 bg-slate-900/30 backdrop-blur-sm flex-col">
            <AnnotationPanel
              projectId={currentProject.id}
              onAnnotationSelect={setSelectedAnnotation}
              onCreateAnnotation={() => setIsPlacingAnnotation(true)}
              selectedAnnotationId={selectedAnnotation?.id || null}
              isPlacingMode={isPlacingAnnotation}
              className="h-full"
            />
          </aside>
        </div>

        {/* Create Annotation Dialog */}
        {annotationPosition && (
          <CreateAnnotationDialog
            open={showAnnotationDialog}
            onOpenChange={setShowAnnotationDialog}
            projectId={currentProject.id}
            position={annotationPosition}
            onAnnotationCreated={handleAnnotationCreated}
          />
        )}

        {/* Mobile Bottom Sheet */}
        {mobileTab && (
          <div
            className="lg:hidden fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
            onClick={() => setMobileTab(null)}
          >
            <div
              className="absolute bottom-0 left-0 right-0 bg-slate-900/95 backdrop-blur-xl rounded-t-3xl max-h-[75vh] flex flex-col border-t border-slate-700/50 shadow-2xl shadow-primary/10"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Mobile Sheet Header */}
              <div className="flex items-center justify-center p-2">
                <div className="w-12 h-1 bg-slate-600 rounded-full" />
              </div>

              {mobileTab === "chat" && (
                <ChatPanel
                  projectId={currentProject.id}
                  isMobile={true}
                  onClose={() => setMobileTab(null)}
                  className="flex-1"
                />
              )}
              {mobileTab === "annotations" && (
                <AnnotationPanel
                  projectId={currentProject.id}
                  onAnnotationSelect={setSelectedAnnotation}
                  onCreateAnnotation={() => {
                    setIsPlacingAnnotation(true);
                    setMobileTab(null);
                  }}
                  selectedAnnotationId={selectedAnnotation?.id || null}
                  isPlacingMode={isPlacingAnnotation}
                  isMobile={true}
                  onClose={() => setMobileTab(null)}
                  className="flex-1"
                />
              )}
            </div>
          </div>
        )}

        {/* Enhanced Mobile Bottom Navigation */}
        <div className="lg:hidden border-t border-slate-800/50 bg-slate-900/80 backdrop-blur-xl">
          <div className="flex items-center justify-around p-3">
            <Button
              variant="ghost"
              size="sm"
              className={`flex-1 text-slate-300 hover:text-white hover:bg-slate-800/50 transition-all duration-200 ${
                mobileTab === "chat" ? "bg-slate-800/50 text-white" : ""
              }`}
              onClick={() => setMobileTab(mobileTab === "chat" ? null : "chat")}
            >
              <MessageCircle className="h-4 w-4 mr-2" />
              <span>Chat</span>
              {activeUsers.length > 1 && (
                <Badge
                  variant="secondary"
                  className="ml-2 bg-slate-700 text-slate-300"
                >
                  {activeUsers.length}
                </Badge>
              )}
            </Button>

            <Separator orientation="vertical" className="h-8 bg-slate-700" />

            <Button
              variant="ghost"
              size="sm"
              className={`flex-1 text-slate-300 hover:text-white hover:bg-slate-800/50 transition-all duration-200 ${
                mobileTab === "annotations" ? "bg-slate-800/50 text-white" : ""
              }`}
              onClick={() =>
                setMobileTab(mobileTab === "annotations" ? null : "annotations")
              }
            >
              <MapPin className="h-4 w-4 mr-2" />
              <span>Notes</span>
              {isPlacingAnnotation && (
                <div className="ml-2 w-2 h-2 bg-primary rounded-full animate-pulse" />
              )}
            </Button>
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
}

export default ProjectViewerPage;
