import { useState, useEffect } from "react";
import {
  MessageSquarePlus,
  Trash2,
  Eye,
  EyeOff,
  MapPin,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";

import { Annotation } from "@/types/annotation.types";
import { annotationService } from "@/services/annotationService";

import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";

/**
 * Annotation Panel Props
 */
interface AnnotationPanelProps {
  projectId: string;
  onAnnotationSelect: (annotation: Annotation | null) => void;
  onCreateAnnotation: () => void;
  selectedAnnotationId: string | null;
  isPlacingMode: boolean;
}

/**
 * Annotation Panel Component
 * Sidebar panel for managing annotations
 */
export function AnnotationPanel({
  projectId,
  onAnnotationSelect,
  onCreateAnnotation,
  selectedAnnotationId,
  isPlacingMode,
}: AnnotationPanelProps) {
  const [annotations, setAnnotations] = useState<Annotation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);

  /**
   * Fetch annotations
   */
  const fetchAnnotations = async () => {
    try {
      setIsLoading(true);
      const data = await annotationService.getAnnotationsByProject(projectId);
      setAnnotations(data);
    } catch (error) {
      console.error("Failed to fetch annotations:", error);
      toast.error("Failed to Load Annotations");
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Load annotations on mount
   */
  useEffect(() => {
    fetchAnnotations();
  }, [projectId]);

  /**
   * Handle delete annotation
   */
  const handleDelete = async (annotationId: string) => {
    if (!confirm("Are you sure you want to delete this annotation?")) {
      return;
    }

    try {
      setIsDeleting(true);
      await annotationService.deleteAnnotation(annotationId);

      toast.success("Annotation Deleted");

      // Remove from local state
      setAnnotations((prev) => prev.filter((a) => a.id !== annotationId));

      // Deselect if deleted
      if (selectedAnnotationId === annotationId) {
        onAnnotationSelect(null);
      }
    } catch (error: any) {
      console.error("Failed to delete annotation:", error);
      toast.error("Failed to Delete", {
        description: error.message,
      });
    } finally {
      setIsDeleting(false);
    }
  };

  /**
   * Handle toggle visibility
   */
  const handleToggleVisibility = async (annotation: Annotation) => {
    try {
      await annotationService.toggleVisibility(annotation.id);

      // Update local state
      setAnnotations((prev) =>
        prev.map((a) =>
          a.id === annotation.id ? { ...a, visible: !a.visible } : a
        )
      );

      toast.success(
        annotation.visible ? "Annotation Hidden" : "Annotation Visible"
      );
    } catch (error: any) {
      console.error("Failed to toggle visibility:", error);
      toast.error("Failed to Update", {
        description: error.message,
      });
    }
  };

  /**
   * Get username from annotation
   */
  const getUsername = (annotation: Annotation): string => {
    if (typeof annotation.userId === "object") {
      return annotation.userId.username;
    }
    return annotation.username || "Unknown";
  };

  /**
   * Format date
   */
  const formatDate = (date: Date | string): string => {
    return new Date(date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="flex flex-col h-full bg-slate-900/30">
      {/* Header */}
      <div className="p-4 border-b border-slate-800">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold text-white">Annotations</h2>
          <Badge variant="secondary">{annotations.length}</Badge>
        </div>

        {/* Create Annotation Button */}
        <Button
          onClick={onCreateAnnotation}
          className="w-full"
          variant={isPlacingMode ? "default" : "outline"}
        >
          <MessageSquarePlus className="h-4 w-4 mr-2" />
          {isPlacingMode ? "Click on Model" : "Add Annotation"}
        </Button>

        {isPlacingMode && (
          <p className="text-xs text-slate-400 mt-2 text-center">
            Click anywhere on the 3D model to place annotation
          </p>
        )}
      </div>

      {/* Annotations List */}
      <ScrollArea className="flex-1">
        <div className="p-4 space-y-3">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
            </div>
          ) : annotations.length === 0 ? (
            <div className="text-center py-12 text-slate-400">
              <MapPin className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="text-sm">No annotations yet</p>
              <p className="text-xs mt-1">
                Click "Add Annotation" to create one
              </p>
            </div>
          ) : (
            annotations.map((annotation) => (
              <div
                key={annotation.id}
                className={`p-3 rounded-lg border transition-all cursor-pointer ${
                  selectedAnnotationId === annotation.id
                    ? "border-primary bg-primary/10"
                    : "border-slate-700 hover:border-slate-600 bg-slate-800/50"
                } ${!annotation.visible ? "opacity-50" : ""}`}
                onClick={() =>
                  onAnnotationSelect(
                    selectedAnnotationId === annotation.id ? null : annotation
                  )
                }
              >
                {/* Annotation Header */}
                <div className="flex items-start gap-2 mb-2">
                  <div
                    className="h-3 w-3 rounded-full mt-1 flex-shrink-0"
                    style={{ backgroundColor: annotation.color || "#ff6b6b" }}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-white break-words">
                      {annotation.text}
                    </p>
                  </div>
                </div>

                {/* Annotation Meta */}
                <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
                  <span>{getUsername(annotation)}</span>
                  <span>{formatDate(annotation.createdAt)}</span>
                </div>

                <Separator className="my-2" />

                {/* Annotation Actions */}
                <div className="flex items-center gap-1">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleToggleVisibility(annotation);
                    }}
                    disabled={isDeleting}
                    className="flex-1 text-xs h-7"
                  >
                    {annotation.visible ? (
                      <>
                        <Eye className="h-3 w-3 mr-1" />
                        Visible
                      </>
                    ) : (
                      <>
                        <EyeOff className="h-3 w-3 mr-1" />
                        Hidden
                      </>
                    )}
                  </Button>

                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(annotation.id);
                    }}
                    disabled={isDeleting}
                    className="text-destructive hover:text-destructive hover:bg-destructive/10 h-7"
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
      </ScrollArea>
    </div>
  );
}

export default AnnotationPanel;
