import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Loader2,
  CircleDot,
  Cylinder as CylinderIcon,
  Triangle,
  Hexagon,
  Palette,
  Type,
  Sparkles,
  CheckCircle,
  X,
  Lightbulb,
  Grid3X3,
  Package,
  Eye,
  Layers3,
  Box,
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
import { Badge } from "@/components/ui/badge";

/**
 * Enhanced Add Model Form Schema
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
 * Enhanced Geometry Options with detailed info
 */
const GEOMETRY_OPTIONS: {
  value: GeometryType;
  label: string;
  icon: any;
  description: string;
  color: string;
}[] = [
  {
    value: "box",
    label: "Box",
    icon: Package,
    description: "Rectangular prism - perfect for structural components",
    color: "#60a5fa",
  },
  {
    value: "sphere",
    label: "Sphere",
    icon: CircleDot,
    description: "Perfect sphere - ideal for joints and rounded parts",
    color: "#34d399",
  },
  {
    value: "cylinder",
    label: "Cylinder",
    icon: CylinderIcon,
    description: "Cylindrical shape - great for pipes and shafts",
    color: "#f87171",
  },
  {
    value: "cone",
    label: "Cone",
    icon: Triangle,
    description: "Conical shape - useful for tapered components",
    color: "#fbbf24",
  },
  {
    value: "torus",
    label: "Torus",
    icon: Hexagon,
    description: "Donut shape - perfect for rings and gaskets",
    color: "#a78bfa",
  },
];

/**
 * Enhanced Color Presets with names
 */
const COLOR_PRESETS = [
  { color: "#60a5fa", name: "Sky Blue" },
  { color: "#f87171", name: "Coral Red" },
  { color: "#34d399", name: "Emerald" },
  { color: "#fbbf24", name: "Amber" },
  { color: "#a78bfa", name: "Violet" },
  { color: "#fb923c", name: "Orange" },
  { color: "#ec4899", name: "Pink" },
  { color: "#06b6d4", name: "Cyan" },
  { color: "#84cc16", name: "Lime" },
  { color: "#8b5cf6", name: "Purple" },
  { color: "#f59e0b", name: "Yellow" },
  { color: "#ef4444", name: "Red" },
];

/**
 * Model name suggestions
 */
const NAME_SUGGESTIONS = [
  "Main Structure",
  "Support Beam",
  "Component A",
  "Base Platform",
  "Joint Assembly",
  "Housing Unit",
  "Connector",
  "Frame Element",
];

/**
 * Add Model Dialog Props
 */
interface AddModelDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId?: string;
  onModelAdded: () => void;
}

/**
 * Ultra Enhanced Add Model Dialog Component
 */
export function AddModelDialog({
  open,
  onOpenChange,
  projectId,
  onModelAdded,
}: AddModelDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedColor, setSelectedColor] = useState("#60a5fa");
  const [selectedGeometry, setSelectedGeometry] = useState<GeometryType>("box");
  const [focusedField, setFocusedField] = useState<string | null>(null);

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

  const watchedName = watch("name", "");
  const geometryType = watch("geometryType");

  // Calculate completion level
  useEffect(() => {
    let level = 0;
    if (watchedName.length > 0) level += 50;
    if (watchedName.length > 5) level += 25;
    if (selectedColor !== "#60a5fa") level += 15;
    if (selectedGeometry !== "box") level += 10;
  }, [watchedName, selectedColor, selectedGeometry]);

  /**
   * Handle form submission
   */
  const onSubmit = async (data: AddModelFormData) => {
    if (!projectId) {
      toast.error("Project ID missing", {
        description: "Unable to add model without project context.",
      });
      return;
    }

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

      const selectedGeo = GEOMETRY_OPTIONS.find(
        (g) => g.value === data.geometryType
      );
      toast.success("3D Model Added Successfully!", {
        description: `"${data.name}" (${selectedGeo?.label}) is now ready for positioning and transformation.`,
        duration: 4000,
      });

      reset();
      setSelectedColor("#60a5fa");
      setSelectedGeometry("box");
      onOpenChange(false);
      onModelAdded();
    } catch (error: any) {
      console.error("Failed to add model:", error);
      toast.error("Model Creation Failed", {
        description:
          error.message || "Unable to create the 3D model. Please try again.",
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
   * Handle geometry selection
   */
  const handleGeometrySelect = (geometry: GeometryType) => {
    setSelectedGeometry(geometry);
    setValue("geometryType", geometry);

    // Auto-suggest color based on geometry
    const geometryData = GEOMETRY_OPTIONS.find((g) => g.value === geometry);
    if (geometryData) {
      handleColorSelect(geometryData.color);
    }
  };

  /**
   * Handle name suggestion
   */
  const handleNameSuggestion = (name: string) => {
    setValue("name", name);
    const nameInput = document.getElementById("model-name") as HTMLInputElement;
    if (nameInput) {
      nameInput.focus();
      nameInput.setSelectionRange(name.length, name.length);
    }
  };

  /**
   * Handle dialog close
   */
  const handleClose = () => {
    if (!isSubmitting) {
      reset();
      setSelectedColor("#60a5fa");
      setSelectedGeometry("box");
      setFocusedField(null);
      onOpenChange(false);
    }
  };

  const selectedGeometryData = GEOMETRY_OPTIONS.find(
    (g) => g.value === selectedGeometry
  );
  const selectedColorData = COLOR_PRESETS.find(
    (c) => c.color === selectedColor
  );

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[650px] max-h-[90vh] bg-gradient-to-br from-card/95 to-card/90 backdrop-blur-xl border-border/50 shadow-2xl shadow-primary/10 flex flex-col">
        {/* Animated Background Elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none rounded-lg">
          <div className="absolute top-4 right-4 w-24 h-24 bg-primary/5 rounded-full blur-2xl animate-pulse" />
          <div
            className="absolute bottom-6 left-6 w-20 h-20 bg-chart-1/10 rounded-lg rotate-12 animate-pulse"
            style={{ animationDelay: "1s" }}
          />
          <div
            className="absolute top-1/2 left-1/4 w-16 h-16 bg-chart-2/5 rounded-full blur-lg animate-pulse"
            style={{ animationDelay: "2s" }}
          />
        </div>

        <DialogHeader className="relative z-10 space-y-4 pb-4 flex-shrink-0">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-gradient-to-br from-primary to-chart-1 rounded-2xl shadow-lg shadow-primary/25">
              <Box className="w-6 h-6 text-primary-foreground animate-pulse" />
            </div>
            <div className="space-y-1">
              <DialogTitle className="text-xl font-bold bg-gradient-to-r from-foreground to-primary bg-clip-text text-transparent">
                Add 3D Model
              </DialogTitle>
              <DialogDescription className="text-muted-foreground">
                Create a new primitive geometry object for your collaborative 3D
                scene
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {/* Scrollable Content Area */}
        <div className="relative z-10 flex-1 overflow-y-auto min-h-0 pr-2 -mr-2">
          <div className="space-y-6 pb-6">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              {/* Enhanced Model Name */}
              <div className="space-y-3">
                <Label
                  htmlFor="model-name"
                  className="text-sm font-medium flex items-center gap-2"
                >
                  <Type className="w-4 h-4" />
                  Model Name <span className="text-destructive">*</span>
                </Label>

                <div className="relative group">
                  <Input
                    id="model-name"
                    type="text"
                    placeholder="Enter a descriptive name for your 3D model..."
                    disabled={isSubmitting}
                    onFocus={() => setFocusedField("name")}
                    {...register("name")}
                    className={`
                      text-base transition-all duration-300 bg-background/50 backdrop-blur-sm
                      ${
                        errors.name
                          ? "border-destructive focus:border-destructive ring-destructive/20"
                          : "border-border hover:border-primary/50 focus:border-primary"
                      }
                      ${
                        focusedField === "name"
                          ? "shadow-lg shadow-primary/10"
                          : ""
                      }
                      ${watchedName.length > 0 ? "border-primary/70" : ""}
                    `}
                  />

                  {/* Input Enhancement Indicators */}
                  <div
                    className={`absolute right-3 top-1/2 -translate-y-1/2 transition-all duration-300 ${
                      watchedName.length > 0
                        ? "opacity-100 scale-100"
                        : "opacity-0 scale-75"
                    }`}
                  >
                    {errors.name ? (
                      <div className="w-5 h-5 rounded-full bg-destructive/10 flex items-center justify-center">
                        <X className="w-3 h-3 text-destructive" />
                      </div>
                    ) : watchedName.length > 0 ? (
                      <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center">
                        <CheckCircle className="w-3 h-3 text-primary" />
                      </div>
                    ) : null}
                  </div>
                </div>

                {errors.name && (
                  <div className="flex items-center gap-2 text-sm text-destructive animate-in">
                    <X className="w-4 h-4" />
                    {errors.name.message}
                  </div>
                )}

                {/* Character Counter */}
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">
                    Clear, descriptive names help team collaboration
                  </span>
                  <span
                    className={`font-mono transition-colors duration-200 ${
                      watchedName.length > 90
                        ? "text-orange-500"
                        : watchedName.length > 0
                        ? "text-primary"
                        : "text-muted-foreground"
                    }`}
                  >
                    {watchedName.length}/100
                  </span>
                </div>

                {/* Name suggestions */}
                {focusedField === "name" && !watchedName && (
                  <div className="space-y-2 animate-in">
                    <p className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                      <Lightbulb className="w-3 h-3" />
                      Suggested names
                    </p>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {NAME_SUGGESTIONS.slice(0, 4).map((suggestion, index) => (
                        <button
                          key={suggestion}
                          type="button"
                          onClick={() => handleNameSuggestion(suggestion)}
                          disabled={isSubmitting}
                          className="text-xs text-left px-3 py-2 rounded-lg border border-border/50 bg-background/30 hover:bg-primary/5 hover:border-primary/30 transition-all duration-200 truncate"
                          style={{ animationDelay: `${index * 50}ms` }}
                        >
                          {suggestion}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Enhanced Geometry Selection */}
              <div className="space-y-3">
                <Label className="text-sm font-medium flex items-center gap-2">
                  <Grid3X3 className="w-4 h-4" />
                  Geometry Type <span className="text-destructive">*</span>
                </Label>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {GEOMETRY_OPTIONS.map((option) => {
                    const Icon = option.icon;
                    const isSelected = selectedGeometry === option.value;
                    return (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => handleGeometrySelect(option.value)}
                        disabled={isSubmitting}
                        className={`
                          p-4 rounded-xl border-2 transition-all duration-200 text-left
                          ${
                            isSelected
                              ? "border-primary bg-primary/10 shadow-md shadow-primary/20 scale-105"
                              : "border-border hover:border-primary/50 hover:bg-primary/5 hover:scale-102"
                          }
                        `}
                      >
                        <div className="flex items-center gap-3 mb-2">
                          <div
                            className="p-2 rounded-lg"
                            style={{ backgroundColor: `${option.color}20` }}
                          >
                            <Icon
                              className="w-4 h-4"
                              style={{ color: option.color }}
                            />
                          </div>
                          <span className="font-semibold text-sm">
                            {option.label}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground leading-relaxed hidden sm:block">
                          {option.description}
                        </p>
                        {isSelected && (
                          <Badge variant="default" className="mt-2 text-xs">
                            <CheckCircle className="w-2.5 h-2.5 mr-1" />
                            Selected
                          </Badge>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Enhanced Color Selection */}
              <div className="space-y-3">
                <Label className="text-sm font-medium flex items-center gap-2">
                  <Palette className="w-4 h-4" />
                  Material Color
                </Label>

                <div className="space-y-3">
                  {/* Color presets */}
                  <div className="grid grid-cols-6 sm:grid-cols-8 lg:grid-cols-12 gap-2">
                    {COLOR_PRESETS.map((preset) => (
                      <button
                        key={preset.color}
                        type="button"
                        onClick={() => handleColorSelect(preset.color)}
                        disabled={isSubmitting}
                        className={`h-10 w-10 rounded-xl border-2 transition-all duration-200 hover:scale-110 shadow-sm relative group ${
                          selectedColor === preset.color
                            ? "border-white ring-2 ring-primary/50 scale-110"
                            : "border-slate-300 dark:border-slate-600 hover:border-primary/50"
                        }`}
                        style={{ backgroundColor: preset.color }}
                        title={preset.name}
                      >
                        {selectedColor === preset.color && (
                          <CheckCircle className="absolute -top-1 -right-1 w-4 h-4 text-white bg-primary rounded-full" />
                        )}
                      </button>
                    ))}
                  </div>

                  {/* Custom color picker */}
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <input
                        type="color"
                        value={selectedColor}
                        onChange={(e) => handleColorSelect(e.target.value)}
                        disabled={isSubmitting}
                        className="h-10 w-10 rounded-xl cursor-pointer border-2 border-slate-600 transition-all duration-200 hover:scale-110"
                        title="Custom color picker"
                      />
                      <div className="absolute -top-1 -right-1 w-4 h-4 bg-gradient-to-br from-primary to-chart-1 rounded-full flex items-center justify-center">
                        <Palette className="w-2 h-2 text-white" />
                      </div>
                    </div>
                    <div className="text-sm">
                      <p className="font-medium text-foreground">
                        Custom Color
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Choose any color
                      </p>
                    </div>
                  </div>

                  {/* Color info */}
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <div
                      className="w-4 h-4 rounded border border-border"
                      style={{ backgroundColor: selectedColor }}
                    />
                    <span>
                      Selected: {selectedColorData?.name || selectedColor}
                    </span>
                    {selectedGeometryData && (
                      <Badge variant="secondary" className="text-xs">
                        {selectedGeometryData.label} style
                      </Badge>
                    )}
                  </div>
                </div>
              </div>

              {/* Preview Section */}
              {(watchedName ||
                selectedGeometry !== "box" ||
                selectedColor !== "#60a5fa") && (
                <div className="p-4 bg-background/30 backdrop-blur-sm border border-border/30 rounded-xl space-y-3 animate-in">
                  <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                    <Eye className="w-4 h-4 text-primary" />
                    Model Preview
                  </div>
                  <div className="flex items-start gap-3">
                    <div
                      className="p-2.5 rounded-xl border"
                      style={{
                        backgroundColor: `${selectedColor}20`,
                        borderColor: `${selectedColor}40`,
                      }}
                    >
                      {selectedGeometryData && (
                        <selectedGeometryData.icon
                          className="w-5 h-5"
                          style={{ color: selectedColor }}
                        />
                      )}
                    </div>
                    <div className="space-y-1 min-w-0 flex-1">
                      <h4 className="font-semibold text-foreground">
                        {watchedName || "Untitled Model"}
                      </h4>
                      <div className="flex items-center gap-2">
                        <Badge
                          variant="secondary"
                          className="text-xs"
                          style={{
                            backgroundColor: `${selectedGeometryData?.color}20`,
                            color: selectedGeometryData?.color,
                            borderColor: `${selectedGeometryData?.color}40`,
                          }}
                        >
                          {selectedGeometryData?.label}
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          {selectedColorData?.name || "Custom Color"}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Position: (0, 0, 0) • Scale: (1, 1, 1) • Ready for
                        transformation
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </form>
          </div>
        </div>

        {/* Fixed Footer */}
        <DialogFooter className="relative z-10 gap-3 pt-4 flex-shrink-0 border-t border-border/20 bg-card/50 backdrop-blur-sm -mx-6 -mb-6 px-6 pb-6">
          <Button
            type="button"
            variant="outline"
            onClick={handleClose}
            disabled={isSubmitting}
            className="min-w-[100px]"
          >
            Cancel
          </Button>

          <Button
            type="submit"
            disabled={!watchedName.trim() || isSubmitting}
            onClick={handleSubmit(onSubmit)}
            className="min-w-[140px] relative overflow-hidden group bg-gradient-to-r from-primary to-chart-1 hover:from-primary/90 hover:to-chart-1/90 shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30 transition-all duration-300"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-700" />

            {isSubmitting ? (
              <div className="flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Creating...</span>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Layers3 className="w-4 h-4" />
                <span>Add to Scene</span>
                <Sparkles className="w-4 h-4 group-hover:scale-110 transition-transform duration-200" />
              </div>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default AddModelDialog;
