import { useState } from "react";
import { Plus, Layers, Trash2, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";

import { Project, Model3D } from "@/types/project.types";
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

/**
 * Model Controls Props
 */
interface ModelControlsProps {
  project: Project;
  onProjectUpdate: () => void;
  selectedModelId: string | null;
  onModelSelect: (modelId: string | null) => void;
}

/**
 * Model Controls Component
 * Floating action button with model management
 */
export function ModelControls({
  project,
  onProjectUpdate,
  selectedModelId,
  onModelSelect,
}: ModelControlsProps) {
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const models = project.models || [];

  /**
   * Handle delete model
   */
  const handleDeleteModel = async (modelId: string) => {
    if (!confirm("Are you sure you want to delete this model?")) {
      return;
    }

    try {
      setIsDeleting(true);
      await projectService.deleteModel(project.id, modelId);

      toast.success("Model Deleted", {
        description: "The model has been removed from the project.",
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
      setIsDeleting(false);
    }
  };

  /**
   * Handle toggle model visibility
   */
  const handleToggleVisibility = async (
    modelId: string,
    currentVisibility: boolean
  ) => {
    try {
      await projectService.updateModel(project.id, modelId, {
        visible: !currentVisibility,
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
   * Get geometry icon
   */
  const getGeometryLabel = (model: Model3D): string => {
    if (model.type === "primitive" && model.geometry) {
      return (
        model.geometry.type.charAt(0).toUpperCase() +
        model.geometry.type.slice(1)
      );
    }
    return "Model";
  };

  return (
    <>
      {/* Floating Action Buttons */}
      <div className="absolute bottom-6 right-6 flex flex-col gap-3 z-10">
        {/* Models List Sheet */}
        <Sheet>
          <SheetTrigger asChild>
            <Button
              size="lg"
              className="h-14 w-14 rounded-full shadow-lg hover:shadow-xl transition-all"
              variant="secondary"
            >
              <Layers className="h-6 w-6" />
              <span className="sr-only">View Models</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="w-full sm:w-96">
            <SheetHeader>
              <SheetTitle>Models ({models.length}/10)</SheetTitle>
              <SheetDescription>
                Manage 3D models in your project
              </SheetDescription>
            </SheetHeader>

            <ScrollArea className="h-[calc(100vh-120px)] mt-6 pr-4">
              {models.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <Layers className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p className="text-sm">No models yet</p>
                  <p className="text-xs mt-1">Click the + button to add one</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {models.map((model) => (
                    <div
                      key={model._id}
                      className={`p-3 rounded-lg border transition-all cursor-pointer ${
                        selectedModelId === model._id
                          ? "border-primary bg-primary/5"
                          : "border-border hover:border-primary/50"
                      }`}
                      onClick={() =>
                        onModelSelect(
                          selectedModelId === model._id
                            ? null
                            : model._id || null
                        )
                      }
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium truncate">{model.name}</h4>
                          <p className="text-xs text-muted-foreground">
                            {getGeometryLabel(model)}
                          </p>
                        </div>

                        {/* Model Color Preview */}
                        <div
                          className="h-6 w-6 rounded border-2 border-border flex-shrink-0"
                          style={{ backgroundColor: model.color || "#888888" }}
                          title={model.color}
                        />
                      </div>

                      <Separator className="my-2" />

                      {/* Model Actions */}
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (model._id) {
                              handleToggleVisibility(model._id, model.visible);
                            }
                          }}
                          disabled={isDeleting}
                          className="flex-1"
                        >
                          {model.visible ? (
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
                            if (model._id) {
                              handleDeleteModel(model._id);
                            }
                          }}
                          disabled={isDeleting}
                          className="text-destructive hover:text-destructive hover:bg-destructive/10"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </SheetContent>
        </Sheet>

        {/* Add Model Button */}
        <Button
          size="lg"
          onClick={() => setShowAddDialog(true)}
          className="h-14 w-14 rounded-full shadow-lg hover:shadow-xl transition-all"
          disabled={models.length >= 10}
        >
          <Plus className="h-6 w-6" />
          <span className="sr-only">Add Model</span>
        </Button>
      </div>

      {/* Add Model Dialog */}
      <AddModelDialog
        open={showAddDialog}
        onOpenChange={setShowAddDialog}
        projectId={project.id}
        onModelAdded={onProjectUpdate}
      />
    </>
  );
}

export default ModelControls;
