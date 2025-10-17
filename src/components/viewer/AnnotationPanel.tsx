import { useState, useEffect } from "react";
import {
  MessageSquarePlus,
  Trash2,
  Eye,
  EyeOff,
  MapPin,
  Loader2,
  MoreVertical,
  X,
  Calendar,
  User,
} from "lucide-react";
import { toast } from "sonner";

import { Annotation } from "@/types/annotation.types";
import { annotationService } from "@/services/annotationService";
import { useAnnotationSync } from "@/hooks/useSocket";

import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Card, CardContent } from "@/components/ui/card";

interface AnnotationPanelProps {
  projectId: string;
  onAnnotationSelect: (annotation: Annotation | null) => void;
  onCreateAnnotation: () => void;
  selectedAnnotationId: string | null;
  isPlacingMode: boolean;
  className?: string;
  onClose?: () => void; // For mobile modal close
  isMobile?: boolean;
}

export function AnnotationPanel({
  projectId,
  onAnnotationSelect,
  onCreateAnnotation,
  selectedAnnotationId,
  isPlacingMode,
  className = "",
  onClose,
  isMobile = false,
}: AnnotationPanelProps) {
  const [annotations, setAnnotations] = useState<Annotation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [expandedAnnotation, setExpandedAnnotation] = useState<string | null>(
    null
  );

  const { createAnnotation, updateAnnotation, deleteAnnotation } =
    useAnnotationSync(
      projectId,
      (data) => {
        const newAnnotation = transformBackendAnnotation(data.annotation);
        setAnnotations((prev) => [...prev, newAnnotation]);
        toast.success("New annotation added");
      },
      (data) => {
        setAnnotations((prev) =>
          prev.map((ann) =>
            ann.id === data.annotationId ? { ...ann, ...data.updates } : ann
          )
        );
      },
      (data) => {
        setAnnotations((prev) =>
          prev.filter((ann) => ann.id !== data.annotationId)
        );

        if (selectedAnnotationId === data.annotationId) {
          onAnnotationSelect(null);
        }
        toast.success("Annotation deleted");
      }
    );

  const transformBackendAnnotation = (backendAnnotation: any): Annotation => {
    return {
      id: backendAnnotation._id || backendAnnotation.id,
      projectId: backendAnnotation.projectId,
      modelId: backendAnnotation.modelId,
      userId: backendAnnotation.userId,
      username: backendAnnotation.username,
      text: backendAnnotation.text,
      position: backendAnnotation.position,
      attachmentType: backendAnnotation.attachmentType,
      style: backendAnnotation.style,
      color: backendAnnotation.color,
      visible: backendAnnotation.visible,
      createdAt: new Date(backendAnnotation.createdAt),
      updatedAt: new Date(backendAnnotation.updatedAt),
    };
  };

  const fetchAnnotations = async () => {
    try {
      setIsLoading(true);
      const data = await annotationService.getAnnotationsByProject(projectId);
      const transformedAnnotations = data.map(transformBackendAnnotation);
      setAnnotations(transformedAnnotations);
    } catch (error) {
      console.error("Failed to fetch annotations:", error);
      toast.error("Failed to Load Annotations");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAnnotations();
  }, [projectId]);

  const handleDelete = async (annotationId: string) => {
    if (!confirm("Are you sure you want to delete this annotation?")) {
      return;
    }

    try {
      setIsDeleting(annotationId);
      await annotationService.deleteAnnotation(annotationId);
      deleteAnnotation(annotationId);

      setAnnotations((prev) => prev.filter((a) => a.id !== annotationId));

      if (selectedAnnotationId === annotationId) {
        onAnnotationSelect(null);
      }
    } catch (error: any) {
      console.error("Failed to delete annotation:", error);
      toast.error("Failed to Delete", {
        description: error.message,
      });
    } finally {
      setIsDeleting(null);
    }
  };

  const handleToggleVisibility = async (annotation: Annotation) => {
    try {
      await annotationService.toggleVisibility(annotation.id);
      updateAnnotation(annotation.id, { visible: !annotation.visible });

      setAnnotations((prev) =>
        prev.map((a) =>
          a.id === annotation.id ? { ...a, visible: !a.visible } : a
        )
      );
    } catch (error: any) {
      console.error("Failed to toggle visibility:", error);
      toast.error("Failed to Update", {
        description: error.message,
      });
    }
  };

  const handleAnnotationClick = (annotation: Annotation) => {
    const isCurrentlySelected = selectedAnnotationId === annotation.id;
    onAnnotationSelect(isCurrentlySelected ? null : annotation);
  };

  const getUsername = (annotation: Annotation): string => {
    if (typeof annotation.userId === "object") {
      return annotation.userId.username;
    }
    return annotation.username || "Unknown";
  };

  const formatDate = (date: Date | string): string => {
    const d = new Date(date);
    const now = new Date();
    const diffInHours = (now.getTime() - d.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 24) {
      return d.toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
      });
    } else if (diffInHours < 168) {
      // 7 days
      return d.toLocaleDateString("en-US", {
        weekday: "short",
        hour: "2-digit",
        minute: "2-digit",
      });
    } else {
      return d.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    }
  };

  const visibleAnnotations = annotations.filter((ann) => ann.visible);
  const hiddenAnnotations = annotations.filter((ann) => !ann.visible);

  return (
    <div className={`flex flex-col h-full bg-slate-900/30 ${className}`}>
      {/* Header */}
      <div className="flex-shrink-0 p-3 sm:p-4 border-b border-slate-800 bg-slate-900/50">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="p-2 bg-slate-800 rounded-lg">
              <MapPin className="h-4 w-4 sm:h-5 sm:w-5 text-slate-300" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-semibold text-white">
                Annotations
              </h2>
              <p className="text-xs text-slate-400">
                {annotations.length} total, {visibleAnnotations.length} visible
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Badge
              variant={annotations.length > 0 ? "default" : "secondary"}
              className="text-xs"
            >
              {annotations.length}
            </Badge>

            {/* Mobile close button */}
            {isMobile && onClose && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
                className="text-slate-400 hover:text-white h-8 w-8 p-0"
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>

        {/* Create Annotation Button */}
        <Button
          onClick={onCreateAnnotation}
          className={`w-full transition-all ${
            isPlacingMode
              ? "bg-primary/20 border-2 border-primary text-primary hover:bg-primary/30"
              : "bg-primary hover:bg-primary/90"
          }`}
          variant={isPlacingMode ? "outline" : "default"}
        >
          <MessageSquarePlus className="h-4 w-4 mr-2" />
          {isPlacingMode ? "Click on Model" : "Add Annotation"}
        </Button>

        {isPlacingMode && (
          <div className="mt-2 p-2 bg-primary/10 border border-primary/30 rounded-lg">
            <p className="text-xs text-primary text-center">
              Click anywhere on the 3D model to place annotation
            </p>
          </div>
        )}
      </div>

      {/* Annotations List */}
      <div className="flex-1 min-h-0">
        <ScrollArea className="h-full">
          <div className="p-3 sm:p-4 space-y-3">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="text-center space-y-2">
                  <Loader2 className="h-6 w-6 animate-spin text-slate-400 mx-auto" />
                  <p className="text-sm text-slate-400">
                    Loading annotations...
                  </p>
                </div>
              </div>
            ) : annotations.length === 0 ? (
              <div className="text-center py-12 text-slate-400">
                <div className="max-w-[200px] mx-auto space-y-3">
                  <div className="h-12 w-12 mx-auto bg-slate-800 rounded-full flex items-center justify-center">
                    <MapPin className="h-6 w-6 opacity-50" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">No annotations yet</p>
                    <p className="text-xs mt-1 text-slate-500">
                      Click "Add Annotation" to create one
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                {/* Visible Annotations */}
                {visibleAnnotations.length > 0 && (
                  <div className="space-y-2">
                    {visibleAnnotations.length > 1 && (
                      <div className="flex items-center gap-2 px-1">
                        <Eye className="h-3 w-3 text-slate-400" />
                        <span className="text-xs text-slate-400 font-medium">
                          Visible
                        </span>
                      </div>
                    )}

                    {visibleAnnotations.map((annotation) => (
                      <AnnotationCard
                        key={annotation.id}
                        annotation={annotation}
                        isSelected={selectedAnnotationId === annotation.id}
                        isExpanded={expandedAnnotation === annotation.id}
                        onToggleExpanded={() =>
                          setExpandedAnnotation(
                            expandedAnnotation === annotation.id
                              ? null
                              : annotation.id
                          )
                        }
                        onClick={() => handleAnnotationClick(annotation)}
                        onToggleVisibility={() =>
                          handleToggleVisibility(annotation)
                        }
                        onDelete={() => handleDelete(annotation.id)}
                        isDeleting={isDeleting === annotation.id}
                        getUsername={getUsername}
                        formatDate={formatDate}
                      />
                    ))}
                  </div>
                )}

                {/* Hidden Annotations */}
                {hiddenAnnotations.length > 0 && (
                  <div className="space-y-2">
                    {visibleAnnotations.length > 0 && (
                      <Separator className="my-4" />
                    )}

                    <div className="flex items-center gap-2 px-1">
                      <EyeOff className="h-3 w-3 text-slate-500" />
                      <span className="text-xs text-slate-500 font-medium">
                        Hidden
                      </span>
                    </div>

                    {hiddenAnnotations.map((annotation) => (
                      <AnnotationCard
                        key={annotation.id}
                        annotation={annotation}
                        isSelected={selectedAnnotationId === annotation.id}
                        isExpanded={expandedAnnotation === annotation.id}
                        onToggleExpanded={() =>
                          setExpandedAnnotation(
                            expandedAnnotation === annotation.id
                              ? null
                              : annotation.id
                          )
                        }
                        onClick={() => handleAnnotationClick(annotation)}
                        onToggleVisibility={() =>
                          handleToggleVisibility(annotation)
                        }
                        onDelete={() => handleDelete(annotation.id)}
                        isDeleting={isDeleting === annotation.id}
                        getUsername={getUsername}
                        formatDate={formatDate}
                      />
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </ScrollArea>
      </div>
    </div>
  );
}

// Annotation Card Component
function AnnotationCard({
  annotation,
  isSelected,
  isExpanded,
  onToggleExpanded,
  onClick,
  onToggleVisibility,
  onDelete,
  isDeleting,
  getUsername,
  formatDate,
}: {
  annotation: Annotation;
  isSelected: boolean;
  isExpanded: boolean;
  onToggleExpanded: () => void;
  onClick: () => void;
  onToggleVisibility: () => void;
  onDelete: () => void;
  isDeleting: boolean;
  getUsername: (annotation: Annotation) => string;
  formatDate: (date: Date | string) => string;
}) {
  const username = getUsername(annotation);
  const isLongText = annotation.text.length > 100;

  return (
    <Card
      className={`transition-all cursor-pointer hover:shadow-md ${
        isSelected
          ? "border-primary bg-primary/5 shadow-sm"
          : "border-slate-700 hover:border-slate-600 bg-slate-800/30"
      } ${!annotation.visible ? "opacity-60" : ""}`}
      onClick={onClick}
    >
      <CardContent className="p-3">
        {/* Annotation Header */}
        <div className="flex items-start gap-2 mb-2">
          <div
            className="h-3 w-3 rounded-full mt-1 flex-shrink-0"
            style={{ backgroundColor: annotation.color || "#ff6b6b" }}
          />
          <div className="flex-1 min-w-0">
            <p
              className={`text-sm text-white break-words ${
                isLongText && !isExpanded ? "line-clamp-2" : ""
              }`}
            >
              {annotation.text}
            </p>

            {isLongText && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleExpanded();
                }}
                className="text-xs text-primary hover:text-primary/80 mt-1"
              >
                {isExpanded ? "Show less" : "Show more"}
              </button>
            )}
          </div>

          {/* Actions Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => e.stopPropagation()}
                className="h-6 w-6 p-0 text-slate-400 hover:text-white"
              >
                <MoreVertical className="h-3 w-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-40">
              <DropdownMenuItem
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleVisibility();
                }}
                disabled={isDeleting}
              >
                {annotation.visible ? (
                  <>
                    <EyeOff className="h-3 w-3 mr-2" />
                    Hide
                  </>
                ) : (
                  <>
                    <Eye className="h-3 w-3 mr-2" />
                    Show
                  </>
                )}
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete();
                }}
                disabled={isDeleting}
                className="text-destructive focus:text-destructive"
              >
                <Trash2 className="h-3 w-3 mr-2" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Annotation Meta */}
        <div className="flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1">
              <User className="h-3 w-3" />
              <span>{username}</span>
            </div>
            <div className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              <span>{formatDate(annotation.createdAt)}</span>
            </div>
          </div>

          {!annotation.visible && (
            <Badge variant="secondary" className="text-xs">
              Hidden
            </Badge>
          )}
        </div>

        {/* Position Info (expanded) */}
        {isExpanded && (
          <div className="mt-2 pt-2 border-t border-slate-700">
            <div className="text-xs text-slate-500">
              <span className="font-medium">Position:</span> x:{" "}
              {annotation.position.x.toFixed(2)}, y:{" "}
              {annotation.position.y.toFixed(2)}, z:{" "}
              {annotation.position.z.toFixed(2)}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default AnnotationPanel;
