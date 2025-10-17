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
} from "lucide-react";
import { toast } from "sonner";

import { Project, Model3D, ProjectDisplay } from "@/types/project.types";
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
 * Model Controls Props
 */
interface ModelControlsProps {
  project: ProjectDisplay | null;
  onProjectUpdate: () => void;
  selectedModelId: string | null;
  onModelSelect: (modelId: string | null) => void;
}

/**
 * Model Controls Component
 * Enhanced floating action button with comprehensive model management
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

  const models = project?.models || [];
  const visibleModels = models.filter((model) => model.visible);
  const hiddenModels = models.filter((model) => !model.visible);

  /**
   * Handle delete model
   */
  const handleDeleteModel = async (modelId: string, modelName: string) => {
    if (
      !confirm(
        `Are you sure you want to delete "${modelName}"? This action cannot be undone.`
      )
    ) {
      return;
    }

    try {
      setIsDeleting(modelId);
      if (!project?.id) return;
      await projectService.deleteModel(project.id, modelId);

      toast.success("Model Deleted", {
        description: `"${modelName}" has been removed from the project.`,
      });

      // Deselect if deleted model was selected
      if (selectedModelId === modelId) {
        onModelSelect(null);
      }

      onProjectUpdate();
    } catch (error: any) {
      console.error("Failed to delete model:", error);
      toast.error("Failed to Delete Model", {
        description: error.message || "An unexpected error occurred.",
      });
    } finally {
      setIsDeleting(null);
    }
  };

  /**
   * Handle toggle model visibility
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

      toast.success(`Model ${!currentVisibility ? "Shown" : "Hidden"}`, {
        description: `"${modelName}" is now ${
          !currentVisibility ? "visible" : "hidden"
        }.`,
      });

      onProjectUpdate();
    } catch (error: any) {
      console.error("Failed to toggle visibility:", error);
      toast.error("Failed to Update Model", {
        description: error.message || "An unexpected error occurred.",
      });
    }
  };

  /**
   * Handle model selection
   */
  const handleModelSelect = (modelId: string) => {
    const isCurrentlySelected = selectedModelId === modelId;
    onModelSelect(isCurrentlySelected ? null : modelId);
  };

  /**
   * Get geometry icon and label
   */
  const getGeometryInfo = (model: Model3D) => {
    if (model.type === "primitive" && model.geometry) {
      const type = model.geometry.type;
      switch (type) {
        case "box":
          return { icon: Package, label: "Box" };
        case "sphere":
          return { icon: Grid3X3, label: "Sphere" };
        case "cylinder":
          return { icon: Grid3X3, label: "Cylinder" };
        case "cone":
          return { icon: Grid3X3, label: "Cone" };
        case "torus":
          return { icon: Grid3X3, label: "Torus" };
        default:
          return { icon: Package, label: "Model" };
      }
    }
    return { icon: Package, label: "Model" };
  };

  return (
    <TooltipProvider>
      <div className="absolute bottom-4 right-4 sm:bottom-6 sm:right-6 flex flex-col gap-2 sm:gap-3 z-10">
        {/* Models Sheet */}
        <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
          <SheetTrigger asChild>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  size="lg"
                  className="h-12 w-12 sm:h-14 sm:w-14 rounded-full shadow-lg hover:shadow-xl transition-all bg-slate-800/90 hover:bg-slate-700 backdrop-blur border border-slate-600"
                  variant="secondary"
                >
                  <Layers className="h-5 w-5 sm:h-6 sm:w-6" />
                  <span className="sr-only">View Models</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent side="left">
                <p>View Models ({models.length})</p>
              </TooltipContent>
            </Tooltip>
          </SheetTrigger>

          <SheetContent
            side="right"
            className="w-full sm:w-96 bg-slate-900/95 backdrop-blur border-slate-700"
          >
            <SheetHeader className="space-y-3">
              <div className="flex items-center justify-between">
                <SheetTitle className="flex items-center gap-2 text-white">
                  <Layers className="h-5 w-5" />
                  Models
                </SheetTitle>
                <Badge variant="secondary" className="text-xs">
                  {models.length}/10
                </Badge>
              </div>
              <SheetDescription className="text-slate-400">
                Manage 3D models in your project. Click to select, transform, or
                modify.
              </SheetDescription>
            </SheetHeader>

            <div className="mt-6 space-y-4">
              {/* Quick Actions */}
              <div className="flex gap-2">
                <Button
                  onClick={() => {
                    setShowAddDialog(true);
                    setIsSheetOpen(false);
                  }}
                  className="flex-1"
                  disabled={models.length >= 10}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Model
                </Button>
                {selectedModelId && (
                  <Button
                    variant="outline"
                    onClick={() => onModelSelect(null)}
                    className="px-3"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>

              {/* Models List */}
              <ScrollArea className="h-[calc(100vh-200px)] pr-4">
                {models.length === 0 ? (
                  <div className="text-center py-12 text-slate-400">
                    <div className="max-w-[200px] mx-auto space-y-3">
                      <div className="h-12 w-12 mx-auto bg-slate-800 rounded-full flex items-center justify-center">
                        <Layers className="h-6 w-6 opacity-50" />
                      </div>
                      <div>
                        <p className="text-sm font-medium">No models yet</p>
                        <p className="text-xs mt-1 text-slate-500">
                          Click "Add Model" to create your first 3D object
                        </p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {/* Visible Models */}
                    {visibleModels.length > 0 && (
                      <div className="space-y-2">
                        {models.length > visibleModels.length && (
                          <div className="flex items-center gap-2 px-1">
                            <Eye className="h-3 w-3 text-slate-400" />
                            <span className="text-xs text-slate-400 font-medium">
                              Visible ({visibleModels.length})
                            </span>
                          </div>
                        )}

                        {visibleModels.map((model) => (
                          <ModelCard
                            key={model._id}
                            model={model}
                            isSelected={selectedModelId === model._id}
                            onSelect={() => handleModelSelect(model._id || "")}
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
                    )}

                    {/* Hidden Models */}
                    {hiddenModels.length > 0 && (
                      <div className="space-y-2">
                        {visibleModels.length > 0 && (
                          <Separator className="my-4" />
                        )}

                        <div className="flex items-center gap-2 px-1">
                          <EyeOff className="h-3 w-3 text-slate-500" />
                          <span className="text-xs text-slate-500 font-medium">
                            Hidden ({hiddenModels.length})
                          </span>
                        </div>

                        {hiddenModels.map((model) => (
                          <ModelCard
                            key={model._id}
                            model={model}
                            isSelected={selectedModelId === model._id}
                            onSelect={() => handleModelSelect(model._id || "")}
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
                    )}
                  </div>
                )}
              </ScrollArea>
            </div>
          </SheetContent>
        </Sheet>

        {/* Add Model Button */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              size="lg"
              onClick={() => setShowAddDialog(true)}
              className="h-12 w-12 sm:h-14 sm:w-14 rounded-full shadow-lg hover:shadow-xl transition-all bg-primary hover:bg-primary/90"
              disabled={models.length >= 10}
            >
              <Plus className="h-5 w-5 sm:h-6 sm:w-6" />
              <span className="sr-only">Add Model</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent side="left">
            <p>
              {models.length >= 10
                ? "Maximum models reached (10/10)"
                : `Add Model (${models.length}/10)`}
            </p>
          </TooltipContent>
        </Tooltip>
      </div>

      {/* Add Model Dialog */}
      <AddModelDialog
        open={showAddDialog}
        onOpenChange={setShowAddDialog}
        projectId={project?.id}
        onModelAdded={onProjectUpdate}
      />
    </TooltipProvider>
  );
}

// Model Card Component
function ModelCard({
  model,
  isSelected,
  onSelect,
  onToggleVisibility,
  onDelete,
  isDeleting,
  getGeometryInfo,
}: {
  model: Model3D;
  isSelected: boolean;
  onSelect: () => void;
  onToggleVisibility: () => void;
  onDelete: () => void;
  isDeleting: boolean;
  getGeometryInfo: (model: Model3D) => { icon: any; label: string };
}) {
  const { icon: GeometryIcon, label: geometryLabel } = getGeometryInfo(model);

  return (
    <Card
      className={`transition-all cursor-pointer hover:shadow-md ${
        isSelected
          ? "border-primary bg-primary/5 shadow-sm"
          : "border-slate-700 hover:border-slate-600 bg-slate-800/30"
      } ${!model.visible ? "opacity-60" : ""}`}
      onClick={onSelect}
    >
      <CardContent className="p-3">
        {/* Model Header */}
        <div className="flex items-start justify-between gap-2 mb-3">
          <div className="flex items-start gap-2 flex-1 min-w-0">
            <div className="p-1.5 bg-slate-700 rounded-md flex-shrink-0">
              <GeometryIcon className="h-3 w-3 text-slate-300" />
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="font-medium text-white truncate text-sm">
                {model.name}
              </h4>
              <p className="text-xs text-slate-400">{geometryLabel}</p>
            </div>
          </div>

          {/* Model Color Preview */}
          <div className="flex items-center gap-1">
            <div
              className="h-4 w-4 rounded border border-slate-600 flex-shrink-0"
              style={{ backgroundColor: model.color || "#888888" }}
              title={`Color: ${model.color}`}
            />

            {/* Actions Menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => e.stopPropagation()}
                  className="h-6 w-6 p-0 text-slate-400 hover:text-white"
                  disabled={isDeleting}
                >
                  <MoreVertical className="h-3 w-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-40">
                <DropdownMenuItem
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelect();
                  }}
                >
                  {isSelected ? (
                    <>
                      <X className="h-3 w-3 mr-2" />
                      Deselect
                    </>
                  ) : (
                    <>
                      <Move3D className="h-3 w-3 mr-2" />
                      Select
                    </>
                  )}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={(e) => {
                    e.stopPropagation();
                    onToggleVisibility();
                  }}
                  disabled={isDeleting}
                >
                  {model.visible ? (
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
                <DropdownMenuSeparator />
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
        </div>

        {/* Model Status & Transform Info */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              {isSelected && (
                <Badge variant="default" className="text-xs">
                  Selected
                </Badge>
              )}
              {!model.visible && (
                <Badge variant="secondary" className="text-xs">
                  Hidden
                </Badge>
              )}
            </div>
          </div>

          {/* Transform Summary (when selected) */}
          {isSelected && (
            <div className="text-xs text-slate-500 space-y-1">
              <div className="flex items-center gap-1">
                <Move3D className="h-3 w-3" />
                <span>
                  Position: ({model.position.x.toFixed(1)},{" "}
                  {model.position.y.toFixed(1)}, {model.position.z.toFixed(1)})
                </span>
              </div>
              <div className="flex items-center gap-1">
                <Maximize className="h-3 w-3" />
                <span>
                  Scale: ({model.scale.x.toFixed(1)}, {model.scale.y.toFixed(1)}
                  , {model.scale.z.toFixed(1)})
                </span>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export default ModelControls;
