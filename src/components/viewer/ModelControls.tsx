import { useState } from "react";
import {
  Plus,
  Layers,
  Trash2,
  Eye,
  EyeOff,
  MoreVertical,
  Grid3X3,
  Move3D,
  Maximize,
  X,
  Package,
  Zap,
  Copy,
  Activity,
  Sparkles,
  MousePointer,
  Box,
} from "lucide-react";
import { toast } from "sonner";

import { Model3D, ProjectDisplay } from "@/types/project.types";
import { projectService } from "@/services/projectService";

import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { AddModelDialog } from "./AddModelDialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

/**
 * Enhanced Model Controls Props
 */
interface ModelControlsProps {
  project: ProjectDisplay | null;
  onProjectUpdate: () => void;
  selectedModelId: string | null;
  onModelSelect: (modelId: string | null) => void;
}

/**
 * Ultra Enhanced Model Controls Component
 * Advanced floating 3D model management system
 */
export function ModelControls({
  project,
  onProjectUpdate,
  selectedModelId,
  onModelSelect,
}: ModelControlsProps) {
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [hoveredModel, setHoveredModel] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  const models = project?.models || [];
  const visibleModels = models.filter((model) => model.visible);
  const hiddenModels = models.filter((model) => !model.visible);
  const modelLimit = 10;

  /**
   * Handle delete model with enhanced confirmation
   */
  const handleDeleteModel = async (modelId: string, modelName: string) => {
    if (
      !confirm(
        `⚠️ Delete "${modelName}"?\n\nThis action cannot be undone and will remove:\n• The 3D model from the scene\n• All associated annotations\n• Transform data\n\nContinue?`
      )
    ) {
      return;
    }

    try {
      setIsDeleting(modelId);
      if (!project?.id) return;

      await projectService.deleteModel(project.id, modelId);

      toast.success("Model Deleted Successfully", {
        description: `"${modelName}" and its data have been permanently removed.`,
        duration: 4000,
      });

      // Deselect if deleted model was selected
      if (selectedModelId === modelId) {
        onModelSelect(null);
      }

      onProjectUpdate();
    } catch (error: any) {
      console.error("Failed to delete model:", error);
      toast.error("Deletion Failed", {
        description:
          error.message || "Could not delete the model. Please try again.",
      });
    } finally {
      setIsDeleting(null);
    }
  };

  /**
   * Handle toggle model visibility with enhanced feedback
   */
  const handleToggleVisibility = async (
    modelId: string,
    modelName: string,
    currentVisibility: boolean
  ) => {
    try {
      if (!project?.id) return;
      await projectService.updateModel(project.id, modelId, {
        visible: !currentVisibility,
      });

      const action = !currentVisibility ? "shown" : "hidden";
      toast.success(
        `Model ${action.charAt(0).toUpperCase() + action.slice(1)}`,
        {
          description: `"${modelName}" is now ${action} in the 3D scene.`,
          duration: 3000,
        }
      );

      onProjectUpdate();
    } catch (error: any) {
      console.error("Failed to toggle visibility:", error);
      toast.error("Update Failed", {
        description: error.message || "Could not update model visibility.",
      });
    }
  };

  /**
   * Handle model selection with feedback
   */
  const handleModelSelect = (modelId: string, modelName: string) => {
    const isCurrentlySelected = selectedModelId === modelId;
    onModelSelect(isCurrentlySelected ? null : modelId);

    if (!isCurrentlySelected) {
      toast.success("Model Selected", {
        description: `"${modelName}" is now active for transformation.`,
        duration: 2000,
      });
    }
  };

  /**
   * Enhanced geometry information with better icons
   */
  const getGeometryInfo = (model: Model3D) => {
    if (model.type === "primitive" && model.geometry) {
      const type = model.geometry.type;
      switch (type) {
        case "box":
          return { icon: Package, label: "Box", color: "#60a5fa" };
        case "sphere":
          return { icon: Box, label: "Sphere", color: "#34d399" };
        case "cylinder":
          return { icon: Grid3X3, label: "Cylinder", color: "#f87171" };
        case "cone":
          return { icon: Grid3X3, label: "Cone", color: "#fbbf24" };
        case "torus":
          return { icon: Grid3X3, label: "Torus", color: "#a78bfa" };
        default:
          return { icon: Package, label: "Model", color: "#6b7280" };
      }
    }
    return { icon: Package, label: "Model", color: "#6b7280" };
  };

  /**
   * Bulk actions for multiple models
   */
  const handleBulkVisibilityToggle = () => {
    if (hiddenModels.length === 0) {
      // Hide all visible models
      visibleModels.forEach((model) => {
        if (model._id) {
          handleToggleVisibility(model._id, model.name, true);
        }
      });
    } else {
      // Show all hidden models
      hiddenModels.forEach((model) => {
        if (model._id) {
          handleToggleVisibility(model._id, model.name, false);
        }
      });
    }
  };

  return (
    <TooltipProvider>
      <div className="absolute bottom-4 right-4 sm:bottom-6 sm:right-6 flex flex-col gap-3 z-20">
        {/* Enhanced Models Manager Sheet */}
        <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
          <SheetTrigger asChild>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  size="lg"
                  onClick={() => {
                    setIsSheetOpen(true);
                  }}
                  className="relative h-14 w-14 rounded-2xl shadow-2xl hover:shadow-3xl transition-all duration-300 bg-gradient-to-br from-slate-800/90 to-slate-700/90 hover:from-slate-700/90 hover:to-slate-600/90 backdrop-blur-xl border border-slate-600/50 hover:border-slate-500/50 group"
                  variant="secondary"
                >
                  <Layers className="h-6 w-6 group-hover:scale-110 transition-transform duration-200" />

                  {/* Model count indicator */}
                  {models.length > 0 && (
                    <div className="absolute -top-2 -right-2 w-6 h-6 bg-gradient-to-br from-primary to-chart-1 rounded-full flex items-center justify-center text-xs font-bold text-white border-2 border-slate-900 shadow-lg">
                      {models.length}
                    </div>
                  )}

                  {/* Selection indicator */}
                  {selectedModelId && (
                    <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                  )}

                  <span className="sr-only">Model Manager</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent side="left">
                <p>
                  Model Manager ({models.length}/{modelLimit})
                </p>
              </TooltipContent>
            </Tooltip>
          </SheetTrigger>

          <SheetContent
            side="right"
            className="w-full sm:w-[420px] bg-gradient-to-b from-slate-900/95 to-slate-800/95 backdrop-blur-2xl border-slate-700/50 shadow-2xl"
          >
            <SheetHeader className="space-y-4 pb-4">
              <div className="flex items-center justify-between">
                <SheetTitle className="flex items-center gap-3 text-white">
                  <div className="p-2 bg-gradient-to-br from-primary/20 to-chart-1/20 rounded-xl border border-primary/30">
                    <Layers className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <span className="text-xl font-semibold">3D Models</span>
                    <p className="text-sm text-slate-400 font-normal">
                      Scene Management
                    </p>
                  </div>
                </SheetTitle>
              </div>
              <SheetDescription className="text-slate-400 leading-relaxed">
                Manage your 3D models, transform objects, and control scene
                visibility. Click models to select and transform them in the
                viewport.
              </SheetDescription>
            </SheetHeader>

            <div className="space-y-6">
              {/* Enhanced Quick Actions */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-medium text-slate-300">
                    Quick Actions
                  </h3>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() =>
                        setViewMode(viewMode === "grid" ? "list" : "grid")
                      }
                      className="h-7 w-7 p-0 text-slate-400 hover:text-white"
                    >
                      <Grid3X3 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <Button
                    onClick={() => {
                      setShowAddDialog(true);
                      setIsSheetOpen(false);
                    }}
                    className="flex-1 bg-gradient-to-r from-primary to-chart-1 hover:from-primary/90 hover:to-chart-1/90"
                    disabled={models.length >= modelLimit}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Model
                  </Button>

                  {models.length > 0 && (
                    <Button
                      variant="outline"
                      onClick={handleBulkVisibilityToggle}
                      className="flex-1"
                    >
                      {hiddenModels.length === 0 ? (
                        <>
                          <EyeOff className="h-4 w-4 mr-2" />
                          Hide All
                        </>
                      ) : (
                        <>
                          <Eye className="h-4 w-4 mr-2" />
                          Show All
                        </>
                      )}
                    </Button>
                  )}
                </div>

                {selectedModelId && (
                  <Button
                    variant="outline"
                    onClick={() => onModelSelect(null)}
                    className="w-full border-slate-600 text-slate-300"
                  >
                    <X className="h-4 w-4 mr-2" />
                    Deselect Current Model
                  </Button>
                )}
              </div>

              {/* Enhanced Models List */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-medium text-slate-300">
                    Scene Objects
                  </h3>
                  {models.length > 0 && (
                    <div className="flex items-center gap-2 text-xs text-slate-500">
                      <Activity className="w-3 h-3" />
                      <span>{visibleModels.length} visible</span>
                    </div>
                  )}
                </div>

                <ScrollArea className="h-[calc(100vh-300px)] pr-2">
                  {models.length === 0 ? (
                    <div className="text-center py-16 text-slate-400">
                      <div className="max-w-[240px] mx-auto space-y-4 animate-in">
                        <div className="relative">
                          <div className="h-16 w-16 mx-auto bg-gradient-to-br from-slate-800 to-slate-700 rounded-2xl flex items-center justify-center border border-slate-600/30">
                            <Layers className="h-8 w-8 opacity-50" />
                          </div>
                          <div className="absolute -top-1 -right-1 w-6 h-6 bg-gradient-to-br from-primary to-chart-1 rounded-full flex items-center justify-center">
                            <Plus className="w-3 h-3 text-white" />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <h4 className="text-sm font-semibold text-white">
                            Empty Scene
                          </h4>
                          <p className="text-xs text-slate-500 leading-relaxed">
                            Add your first 3D model to start building your
                            collaborative project
                          </p>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {/* Visible Models Section */}
                      {visibleModels.length > 0 && (
                        <div className="space-y-3">
                          {models.length > visibleModels.length && (
                            <div className="flex items-center gap-2 px-1">
                              <Eye className="h-3 w-3 text-green-400" />
                              <span className="text-xs text-green-400 font-medium">
                                Visible Models ({visibleModels.length})
                              </span>
                            </div>
                          )}

                          <div className="space-y-2">
                            {visibleModels.map((model) => (
                              <EnhancedModelCard
                                key={model._id}
                                model={model}
                                isSelected={selectedModelId === model._id}
                                isHovered={hoveredModel === model._id}
                                onHover={setHoveredModel}
                                onSelect={() =>
                                  handleModelSelect(model._id || "", model.name)
                                }
                                onToggleVisibility={() =>
                                  handleToggleVisibility(
                                    model._id || "",
                                    model.name,
                                    model.visible
                                  )
                                }
                                onDelete={() =>
                                  handleDeleteModel(model._id || "", model.name)
                                }
                                isDeleting={isDeleting === model._id}
                                getGeometryInfo={getGeometryInfo}
                              />
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Hidden Models Section */}
                      {hiddenModels.length > 0 && (
                        <div className="space-y-3">
                          {visibleModels.length > 0 && (
                            <Separator className="my-4 bg-slate-700/50" />
                          )}

                          <div className="flex items-center gap-2 px-1">
                            <EyeOff className="h-3 w-3 text-slate-500" />
                            <span className="text-xs text-slate-500 font-medium">
                              Hidden Models ({hiddenModels.length})
                            </span>
                          </div>

                          <div className="space-y-2">
                            {hiddenModels.map((model) => (
                              <EnhancedModelCard
                                key={model._id}
                                model={model}
                                isSelected={selectedModelId === model._id}
                                isHovered={hoveredModel === model._id}
                                onHover={setHoveredModel}
                                onSelect={() =>
                                  handleModelSelect(model._id || "", model.name)
                                }
                                onToggleVisibility={() =>
                                  handleToggleVisibility(
                                    model._id || "",
                                    model.name,
                                    model.visible
                                  )
                                }
                                onDelete={() =>
                                  handleDeleteModel(model._id || "", model.name)
                                }
                                isDeleting={isDeleting === model._id}
                                getGeometryInfo={getGeometryInfo}
                              />
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </ScrollArea>
              </div>
            </div>
          </SheetContent>
        </Sheet>

        {/* Enhanced Add Model FAB */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              size="lg"
              onClick={() => setShowAddDialog(true)}
              className="relative h-14 w-14 rounded-2xl shadow-2xl hover:shadow-3xl transition-all duration-300 bg-gradient-to-br from-primary to-chart-1 hover:from-primary/90 hover:to-chart-1/90 group overflow-hidden"
              disabled={models.length >= modelLimit}
            >
              {/* Animated background */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-700" />

              <Plus className="h-6 w-6 group-hover:rotate-90 transition-transform duration-300 relative z-10" />

              {/* Sparkle effect */}
              {models.length < modelLimit && (
                <Sparkles className="absolute top-1 right-1 w-3 h-3 text-white/60 animate-pulse" />
              )}

              <span className="sr-only">Add 3D Model</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent side="left">
            <p>
              {models.length >= modelLimit
                ? "Scene limit reached (10/10)"
                : `Add 3D Model (${models.length}/${modelLimit})`}
            </p>
          </TooltipContent>
        </Tooltip>

        {/* Quick selection indicator */}
        {selectedModelId && (
          <div className="absolute -top-2 left-1/2 -translate-x-1/2 px-3 py-1 bg-green-500/90 backdrop-blur-sm rounded-full text-xs font-medium text-white animate-in">
            Model Selected
          </div>
        )}
      </div>

      {/* Enhanced Add Model Dialog */}
      <AddModelDialog
        open={showAddDialog}
        onOpenChange={setShowAddDialog}
        projectId={project?.id}
        onModelAdded={onProjectUpdate}
      />
    </TooltipProvider>
  );
}

// Ultra Enhanced Model Card Component
function EnhancedModelCard({
  model,
  isSelected,
  isHovered,
  onHover,
  onSelect,
  onToggleVisibility,
  onDelete,
  isDeleting,
  getGeometryInfo,
}: {
  model: Model3D;
  isSelected: boolean;
  isHovered: boolean;
  onHover: (id: string | null) => void;
  onSelect: () => void;
  onToggleVisibility: () => void;
  onDelete: () => void;
  isDeleting: boolean;
  getGeometryInfo: (model: Model3D) => {
    icon: any;
    label: string;
    color: string;
  };
}) {
  const {
    icon: GeometryIcon,
    label: geometryLabel,
    color: typeColor,
  } = getGeometryInfo(model);

  return (
    <Card
      className={`group transition-all duration-300 cursor-pointer overflow-hidden ${
        isSelected
          ? "border-primary bg-gradient-to-br from-primary/10 to-primary/5 shadow-lg shadow-primary/20"
          : isHovered
          ? "border-slate-600 bg-slate-800/50 shadow-md"
          : "border-slate-700/50 hover:border-slate-600/50 bg-slate-800/30"
      } ${!model.visible ? "opacity-60" : ""} ${
        isDeleting ? "animate-pulse" : ""
      }`}
      onClick={onSelect}
      onMouseEnter={() => onHover(model._id || "")}
      onMouseLeave={() => onHover(null)}
    >
      <CardContent className="p-4">
        {/* Enhanced Model Header */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-start gap-3 flex-1 min-w-0">
            {/* Enhanced geometry icon */}
            <div
              className="p-2.5 rounded-xl flex-shrink-0 border group-hover:scale-105 transition-transform duration-200"
              style={{
                backgroundColor: `${typeColor}20`,
                borderColor: `${typeColor}40`,
              }}
            >
              <GeometryIcon className="h-4 w-4" style={{ color: typeColor }} />
            </div>

            <div className="flex-1 min-w-0">
              <h4 className="font-semibold text-white truncate text-sm group-hover:text-primary transition-colors duration-200">
                {model.name}
              </h4>
              <div className="flex items-center gap-2 mt-1">
                <Badge
                  variant="secondary"
                  className="text-xs bg-slate-700/50 text-slate-300"
                  style={{ borderColor: `${typeColor}40` }}
                >
                  {geometryLabel}
                </Badge>
                {isSelected && (
                  <Badge variant="default" className="text-xs bg-primary/90">
                    <MousePointer className="w-2.5 h-2.5 mr-1" />
                    Active
                  </Badge>
                )}
              </div>
            </div>
          </div>

          {/* Enhanced Actions */}
          <div className="flex items-center gap-2">
            {/* Color preview with enhanced styling */}
            <div
              className="h-5 w-5 rounded-lg border-2 border-slate-600 flex-shrink-0 shadow-sm group-hover:scale-110 transition-transform duration-200"
              style={{ backgroundColor: model.color || "#888888" }}
              title={`Color: ${model.color}`}
            />

            {/* Enhanced dropdown menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => e.stopPropagation()}
                  className="h-7 w-7 p-0 text-slate-400 hover:text-white hover:bg-slate-700/50 opacity-0 group-hover:opacity-100 transition-all duration-200"
                  disabled={isDeleting}
                >
                  <MoreVertical className="h-3 w-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="end"
                className="w-48 bg-slate-800/95 backdrop-blur-sm border-slate-700"
              >
                {/* <DropdownMenuItem
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelect();
                  }}
                  className="flex items-center gap-2"
                >
                  {isSelected ? (
                    <>
                      <X className="h-3 w-3" />
                      Deselect Model
                    </>
                  ) : (
                    <>
                      <Move3D className="h-3 w-3" />
                      Select & Transform
                    </>
                  )}
                </DropdownMenuItem> */}

                <DropdownMenuItem
                  onClick={(e) => {
                    e.stopPropagation();
                    // Add duplication logic here
                    toast.info("Feature Coming Soon", {
                      description:
                        "Model duplication will be available in the next update.",
                    });
                  }}
                  disabled={isDeleting}
                  className="flex items-center gap-2"
                >
                  <Copy className="h-3 w-3" />
                  Duplicate Model
                </DropdownMenuItem>

                <DropdownMenuSeparator />

                <DropdownMenuItem
                  onClick={(e) => {
                    e.stopPropagation();
                    onToggleVisibility();
                  }}
                  disabled={isDeleting}
                  className="flex items-center gap-2"
                >
                  {model.visible ? (
                    <>
                      <EyeOff className="h-3 w-3" />
                      Hide in Scene
                    </>
                  ) : (
                    <>
                      <Eye className="h-3 w-3" />
                      Show in Scene
                    </>
                  )}
                </DropdownMenuItem>

                <DropdownMenuSeparator />

                <DropdownMenuItem
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete();
                  }}
                  disabled={isDeleting}
                  className="text-destructive focus:text-destructive flex items-center gap-2"
                >
                  <Trash2 className="h-3 w-3" />
                  Delete Model
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Enhanced Transform Info (when selected) */}
        {isSelected && (
          <div className="space-y-2 pt-2 border-t border-slate-700/50 animate-in">
            <div className="text-xs text-slate-400 space-y-1">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1">
                  <Move3D className="h-3 w-3" />
                  <span>Position</span>
                </div>
                <span className="font-mono text-slate-300">
                  ({model.position.x.toFixed(1)}, {model.position.y.toFixed(1)},{" "}
                  {model.position.z.toFixed(1)})
                </span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1">
                  <Maximize className="h-3 w-3" />
                  <span>Scale</span>
                </div>
                <span className="font-mono text-slate-300">
                  ({model.scale.x.toFixed(1)}, {model.scale.y.toFixed(1)},{" "}
                  {model.scale.z.toFixed(1)})
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2 pt-1">
              <Badge
                variant="outline"
                className="text-xs bg-primary/10 text-primary border-primary/30"
              >
                <Zap className="w-2.5 h-2.5 mr-1" />
                Transform Mode
              </Badge>
            </div>
          </div>
        )}

        {/* Status indicators */}
        {!model.visible && (
          <div className="flex items-center gap-2 pt-2 border-t border-slate-700/50">
            <Badge
              variant="secondary"
              className="text-xs bg-slate-700/50 text-slate-400"
            >
              <EyeOff className="w-2.5 h-2.5 mr-1" />
              Hidden
            </Badge>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default ModelControls;
