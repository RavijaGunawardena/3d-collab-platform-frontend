import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

import { useProjectStore } from "@/store/projectStore";
import { ApiError } from "@/services/api";

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
import { Textarea } from "@/components/ui/textarea";
import {
  CreateProjectFormInput,
  createProjectSchema,
} from "@/validators/projectValidator";

/**
 * Create Project Dialog Props
 */
interface CreateProjectDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/**
 * Create Project Dialog Component
 * Modal dialog for creating new projects
 */
export function CreateProjectDialog({
  open,
  onOpenChange,
}: CreateProjectDialogProps) {
  const navigate = useNavigate();
  const { createProject, isCreating } = useProjectStore();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // React Hook Form with Zod validation
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<CreateProjectFormInput>({
    resolver: zodResolver(createProjectSchema),
    mode: "onBlur",
  });

  /**
   * Handle form submission
   */
  const onSubmit = async (data: CreateProjectFormInput) => {
    try {
      setIsSubmitting(true);

      const project = await createProject({
        title: data.title,
        description: data.description || undefined,
      });

      // Show success toast
      toast.success("Project Created", {
        description: `"${project.title}" has been created successfully.`,
      });

      // Reset form
      reset();

      // Close dialog
      onOpenChange(false);

      // Navigate to project viewer
      navigate(`/project/${project.id}`);
    } catch (error) {
      console.error("Failed to create project:", error);

      // Handle API errors
      if (error instanceof ApiError) {
        if (error.isValidationError()) {
          const firstError = error.getFirstValidationError();
          toast.error("Validation Error", {
            description: firstError || error.message,
          });
        } else {
          toast.error("Failed to Create Project", {
            description: error.message,
          });
        }
      } else {
        toast.error("Failed to Create Project", {
          description: "An unexpected error occurred. Please try again.",
        });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  /**
   * Handle dialog close
   */
  const handleClose = () => {
    if (!isSubmitting && !isCreating) {
      reset();
      onOpenChange(false);
    }
  };

  const isLoading = isSubmitting || isCreating;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Create New Project</DialogTitle>
          <DialogDescription>
            Create a new 3D collaborative project. You can add models and invite
            collaborators later.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Title Field */}
          <div className="space-y-2">
            <Label htmlFor="title">
              Project Title <span className="text-destructive">*</span>
            </Label>
            <Input
              id="title"
              type="text"
              placeholder="e.g., Engine Design v2"
              disabled={isLoading}
              {...register("title")}
              className={errors.title ? "border-destructive" : ""}
            />
            {errors.title && (
              <p className="text-sm text-destructive">{errors.title.message}</p>
            )}
            <p className="text-xs text-muted-foreground">
              2-100 characters. Give your project a clear, descriptive name.
            </p>
          </div>

          {/* Description Field */}
          <div className="space-y-2">
            <Label htmlFor="description">Description (Optional)</Label>
            <Textarea
              id="description"
              placeholder="Describe your project..."
              rows={4}
              disabled={isLoading}
              {...register("description")}
              className={errors.description ? "border-destructive" : ""}
            />
            {errors.description && (
              <p className="text-sm text-destructive">
                {errors.description.message}
              </p>
            )}
            <p className="text-xs text-muted-foreground">
              Maximum 500 characters. Add details about your project.
            </p>
          </div>

          {/* Dialog Footer */}
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                "Create Project"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default CreateProjectDialog;
