import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Users, Loader2, MessageCircle, MapPin } from "lucide-react";
import { toast } from "sonner";

import { useProjectStore } from "@/store/projectStore";
import { useAuthStore } from "@/store/authStore";
import { useSocket, useProjectRoom } from "@/hooks/useSocket";
import { Annotation } from "@/types/annotation.types";
import { Vector3 } from "@/types/project.types";

import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ThreeViewer } from "@/components/viewer/ThreeViewer";
import { ModelControls } from "@/components/viewer/ModelControls";
import { AnnotationPanel } from "@/components/viewer/AnnotationPanel";
import { CreateAnnotationDialog } from "@/components/viewer/CreateAnnotationDialog";
import { ChatPanel } from "@/components/viewer/ChatPanel";

/**
 * Project Viewer Page Component
 * Main 3D collaborative workspace
 */
export function ProjectViewerPage() {
  const { id: projectId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { currentProject, fetchProjectById, isLoading } = useProjectStore();
  const { isConnected } = useSocket();
  const { activeUsers, isJoined, isJoining } = useProjectRoom(
    projectId || null
  );

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
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
    // Annotations are fetched in the AnnotationPanel component
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
   * Get creator username
   */
  const getCreatorUsername = (createdBy: any): string => {
    if (typeof createdBy === "string") {
      return "Unknown";
    }
    return createdBy?.username || "Unknown";
  };

  // Loading state
  if (isLoading || !currentProject) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950">
        <div className="text-center space-y-4">
          <Loader2 className="h-12 w-12 animate-spin text-slate-400 mx-auto" />
          <p className="text-sm text-slate-400">Loading project...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-slate-950 text-white">
      {/* Header */}
      <header className="h-16 border-b border-slate-800 bg-slate-900/50 backdrop-blur supports-[backdrop-filter]:bg-slate-900/30 flex items-center px-4 z-10">
        <div className="flex items-center gap-4 flex-1">
          {/* Back Button */}
          <Button
            variant="ghost"
            size="sm"
            onClick={handleBack}
            className="text-slate-300 hover:text-white"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>

          <Separator orientation="vertical" className="h-6" />

          {/* Project Info */}
          <div className="flex-1 min-w-0">
            <h1 className="text-lg font-semibold truncate">
              {currentProject.title}
            </h1>
            <p className="text-xs text-slate-400 truncate">
              Created by {getCreatorUsername(currentProject.createdBy)}
            </p>
          </div>

          {/* Active Users */}
          <div className="flex items-center gap-2 text-sm">
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-800/50">
              <Users className="h-4 w-4 text-slate-400" />
              <span className="text-slate-300">{activeUsers.length}</span>
            </div>

            {/* Connection Status */}
            <div className="flex items-center gap-1.5">
              <div
                className={`h-2 w-2 rounded-full ${
                  isConnected && isJoined
                    ? "bg-green-500"
                    : isJoining
                    ? "bg-yellow-500 animate-pulse"
                    : "bg-red-500"
                }`}
              />
              <span className="text-xs text-slate-400 hidden sm:inline">
                {isConnected && isJoined
                  ? "Connected"
                  : isJoining
                  ? "Connecting..."
                  : "Disconnected"}
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content - 3 Column Layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar - Chat (Desktop) */}
        <aside className="hidden lg:flex lg:w-80 border-r border-slate-800 bg-slate-900/30 flex-col">
          <ChatPanel projectId={currentProject.id} />
        </aside>

        {/* Center - 3D Canvas */}
        <main className="flex-1 relative bg-slate-950">
          <ThreeViewer
            project={currentProject}
            selectedModelId={selectedModelId}
            isPlacingAnnotation={isPlacingAnnotation}
            onAnnotationPlaced={handleAnnotationPlaced}
          />
          <ModelControls
            project={currentProject}
            onProjectUpdate={handleProjectUpdate}
            selectedModelId={selectedModelId}
            onModelSelect={setSelectedModelId}
          />
        </main>

        {/* Right Sidebar - Annotations (Desktop) */}
        <aside className="hidden lg:flex lg:w-80 border-l border-slate-800 bg-slate-900/30 flex-col">
          <AnnotationPanel
            projectId={currentProject.id}
            onAnnotationSelect={setSelectedAnnotation}
            onCreateAnnotation={() => setIsPlacingAnnotation(true)}
            selectedAnnotationId={selectedAnnotation?.id || null}
            isPlacingMode={isPlacingAnnotation}
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
          className="lg:hidden fixed inset-0 z-50 bg-black/50"
          onClick={() => setMobileTab(null)}
        >
          <div
            className="absolute bottom-0 left-0 right-0 bg-slate-900 rounded-t-2xl max-h-[70vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {mobileTab === "chat" && (
              <ChatPanel projectId={currentProject.id} />
            )}
            {mobileTab === "annotations" && (
              <AnnotationPanel
                projectId={currentProject.id}
                onAnnotationSelect={setSelectedAnnotation}
                onCreateAnnotation={() => setIsPlacingAnnotation(true)}
                selectedAnnotationId={selectedAnnotation?.id || null}
                isPlacingMode={isPlacingAnnotation}
              />
            )}
          </div>
        </div>
      )}

      {/* Mobile Bottom Navigation */}
      <div className="lg:hidden border-t border-slate-800 bg-slate-900/50 backdrop-blur">
        <div className="flex items-center justify-around p-2">
          <Button
            variant="ghost"
            size="sm"
            className="text-slate-300"
            onClick={() => setMobileTab("chat")}
          >
            <MessageCircle className="h-4 w-4 mr-2" />
            Chat
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="text-slate-300"
            onClick={() => setMobileTab("annotations")}
          >
            <MapPin className="h-4 w-4 mr-2" />
            Annotations
          </Button>
        </div>
      </div>
    </div>
  );
}

export default ProjectViewerPage;
