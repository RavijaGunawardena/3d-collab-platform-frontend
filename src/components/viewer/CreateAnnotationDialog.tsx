import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

import { annotationService } from "@/services/annotationService";
import {
  DEFAULT_ANNOTATION_COLOR,
  ANNOTATION_COLOR_PRESETS,
} from "@/types/annotation.types";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Vector3 } from "@/types/project.types";

/**
 * Create Annotation Form Schema
 */
const createAnnotationSchema = z.object({
  text: z
    .string()
    .trim()
    .min(1, "Annotation text is required")
    .max(500, "Text must be at most 500 characters"),
  color: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/, "Invalid color format")
    .default(DEFAULT_ANNOTATION_COLOR),
});

type CreateAnnotationFormData = z.infer<typeof createAnnotationSchema>;

/**
 * Create Annotation Dialog Props
 */
interface CreateAnnotationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: string;
  position: Vector3;
  onAnnotationCreated: () => void;
}

/**
 * Create Annotation Dialog Component
 */
export function CreateAnnotationDialog({
  open,
  onOpenChange,
  projectId,
  position,
  onAnnotationCreated,
}: CreateAnnotationDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedColor, setSelectedColor] = useState(DEFAULT_ANNOTATION_COLOR);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
  } = useForm<CreateAnnotationFormData>({
    resolver: zodResolver(createAnnotationSchema),
    defaultValues: {
      text: "",
      color: DEFAULT_ANNOTATION_COLOR,
    },
  });

  /**
   * Handle form submission
   */
  const onSubmit = async (data: CreateAnnotationFormData) => {
    try {
      setIsSubmitting(true);

      await annotationService.createAnnotation({
        projectId,
        text: data.text,
        position,
        attachmentType: "position",
        style: "pin",
        color: data.color,
        visible: true,
      });

      toast.success("Annotation Created", {
        description: "Your annotation has been added to the project.",
      });

      reset();
      setSelectedColor(DEFAULT_ANNOTATION_COLOR);
      onOpenChange(false);
      onAnnotationCreated();
    } catch (error: any) {
      console.error("Failed to create annotation:", error);
      toast.error("Failed to Create Annotation", {
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
      setSelectedColor(DEFAULT_ANNOTATION_COLOR);
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Create Annotation</DialogTitle>
          <DialogDescription>
            Add a note or comment at the selected position in 3D space.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Position Info */}
          <div className="p-3 bg-slate-100 dark:bg-slate-800 rounded-lg">
            <p className="text-xs text-muted-foreground mb-1">Position:</p>
            <p className="text-sm font-mono">
              x: {position.x.toFixed(2)}, y: {position.y.toFixed(2)}, z:{" "}
              {position.z.toFixed(2)}
            </p>
          </div>

          {/* Annotation Text */}
          <div className="space-y-2">
            <Label htmlFor="text">
              Annotation Text <span className="text-destructive">*</span>
            </Label>
            <Textarea
              id="text"
              placeholder="Describe what you want to annotate..."
              rows={4}
              disabled={isSubmitting}
              {...register("text")}
              className={errors.text ? "border-destructive" : ""}
            />
            {errors.text && (
              <p className="text-sm text-destructive">{errors.text.message}</p>
            )}
            <p className="text-xs text-muted-foreground">
              Maximum 500 characters
            </p>
          </div>

          {/* Color Picker */}
          <div className="space-y-2">
            <Label>
              Color <span className="text-destructive">*</span>
            </Label>
            <div className="flex items-center gap-2">
              {/* Color Presets */}
              <div className="flex gap-2 flex-wrap">
                {ANNOTATION_COLOR_PRESETS.map((color) => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => handleColorSelect(color)}
                    disabled={isSubmitting}
                    className={`h-8 w-8 rounded-full border-2 transition-all hover:scale-110 ${
                      selectedColor === color
                        ? "border-white ring-2 ring-slate-400"
                        : "border-slate-300 dark:border-slate-600"
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
                  className="h-8 w-8 rounded cursor-pointer border-2 border-slate-300 dark:border-slate-600"
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
                  Creating...
                </>
              ) : (
                "Create Annotation"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default CreateAnnotationDialog;
