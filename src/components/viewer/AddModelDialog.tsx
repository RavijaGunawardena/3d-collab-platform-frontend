import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Loader2,
  Box,
  CircleDot,
  Cylinder as CylinderIcon,
  Triangle,
  Hexagon,
} from "lucide-react";
import { toast } from "sonner";

import { projectService } from "@/services/projectService";
import {
  GeometryType,
  DEFAULT_VECTOR3,
  DEFAULT_SCALE,
} from "@/types/project.types";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

/**
 * Add Model Form Schema
 */
const addModelSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Model name is required")
    .max(100, "Model name must be at most 100 characters"),
  geometryType: z.enum(["box", "sphere", "cylinder", "cone", "torus"]),
  color: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/, "Invalid color format")
    .default("#60a5fa"),
});

type AddModelFormData = z.infer<typeof addModelSchema>;

/**
 * Geometry Type Options with Icons
 */
const GEOMETRY_OPTIONS: { value: GeometryType; label: string; icon: any }[] = [
  { value: "box", label: "Box", icon: Box },
  { value: "sphere", label: "Sphere", icon: CircleDot },
  { value: "cylinder", label: "Cylinder", icon: CylinderIcon },
  { value: "cone", label: "Cone", icon: Triangle },
  { value: "torus", label: "Torus", icon: Hexagon },
];

/**
 * Color Presets
 */
const COLOR_PRESETS = [
  "#60a5fa", // Blue
  "#f87171", // Red
  "#34d399", // Green
  "#fbbf24", // Yellow
  "#a78bfa", // Purple
  "#fb923c", // Orange
  "#ec4899", // Pink
  "#06b6d4", // Cyan
];

/**
 * Add Model Dialog Props
 */
interface AddModelDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: string;
  onModelAdded: () => void;
}

/**
 * Add Model Dialog Component
 */
export function AddModelDialog({
  open,
  onOpenChange,
  projectId,
  onModelAdded,
}: AddModelDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedColor, setSelectedColor] = useState("#60a5fa");

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
    watch,
  } = useForm<AddModelFormData>({
    resolver: zodResolver(addModelSchema),
    defaultValues: {
      name: "",
      geometryType: "box",
      color: "#60a5fa",
    },
  });

  const geometryType = watch("geometryType");

  /**
   * Handle form submission
   */
  const onSubmit = async (data: AddModelFormData) => {
    try {
      setIsSubmitting(true);

      await projectService.addModel(projectId, {
        name: data.name,
        type: "primitive",
        geometry: {
          type: data.geometryType,
          parameters: {},
        },
        position: DEFAULT_VECTOR3,
        rotation: DEFAULT_VECTOR3,
        scale: DEFAULT_SCALE,
        color: data.color,
        visible: true,
      });

      toast.success("Model Added", {
        description: `"${data.name}" has been added to the project.`,
      });

      reset();
      onOpenChange(false);
      onModelAdded();
    } catch (error: any) {
      console.error("Failed to add model:", error);
      toast.error("Failed to Add Model", {
        description: error.message || "An unexpected error occurred.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  /**
   * Handle color selection
   */
  const handleColorSelect = (color: string) => {
    setSelectedColor(color);
    setValue("color", color);
  };

  /**
   * Handle dialog close
   */
  const handleClose = () => {
    if (!isSubmitting) {
      reset();
      setSelectedColor("#60a5fa");
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Add 3D Model</DialogTitle>
          <DialogDescription>
            Add a primitive 3D model to your project. You can position and
            transform it later.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Model Name */}
          <div className="space-y-2">
            <Label htmlFor="name">
              Model Name <span className="text-destructive">*</span>
            </Label>
            <Input
              id="name"
              type="text"
              placeholder="e.g., Main Body, Component A"
              disabled={isSubmitting}
              {...register("name")}
              className={errors.name ? "border-destructive" : ""}
            />
            {errors.name && (
              <p className="text-sm text-destructive">{errors.name.message}</p>
            )}
          </div>

          {/* Geometry Type */}
          <div className="space-y-2">
            <Label htmlFor="geometryType">
              Geometry Type <span className="text-destructive">*</span>
            </Label>
            <Select
              value={geometryType}
              onValueChange={(value) =>
                setValue("geometryType", value as GeometryType)
              }
              disabled={isSubmitting}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {GEOMETRY_OPTIONS.map((option) => {
                  const Icon = option.icon;
                  return (
                    <SelectItem key={option.value} value={option.value}>
                      <div className="flex items-center gap-2">
                        <Icon className="h-4 w-4" />
                        <span>{option.label}</span>
                      </div>
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </div>

          {/* Color Picker */}
          <div className="space-y-2">
            <Label>
              Color <span className="text-destructive">*</span>
            </Label>
            <div className="flex items-center gap-2">
              {/* Color Presets */}
              <div className="flex gap-2 flex-wrap">
                {COLOR_PRESETS.map((color) => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => handleColorSelect(color)}
                    disabled={isSubmitting}
                    className={`h-8 w-8 rounded-full border-2 transition-all hover:scale-110 ${
                      selectedColor === color
                        ? "border-white ring-2 ring-slate-400"
                        : "border-slate-600"
                    }`}
                    style={{ backgroundColor: color }}
                    title={color}
                  />
                ))}
              </div>

              {/* Custom Color Input */}
              <div className="relative">
                <input
                  type="color"
                  value={selectedColor}
                  onChange={(e) => handleColorSelect(e.target.value)}
                  disabled={isSubmitting}
                  className="h-8 w-8 rounded cursor-pointer border-2 border-slate-600"
                  title="Custom color"
                />
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              Selected: {selectedColor}
            </p>
          </div>

          {/* Dialog Footer */}
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Adding...
                </>
              ) : (
                "Add Model"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default AddModelDialog;
