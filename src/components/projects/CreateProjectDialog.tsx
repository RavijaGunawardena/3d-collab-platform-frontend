import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Loader2,
  Sparkles,
  Users,
  Globe,
  Rocket,
  CheckCircle,
  X,
  FileText,
  Zap,
  Box,
} from "lucide-react";
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
import { Badge } from "@/components/ui/badge";
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
 * Enhanced Create Project Dialog Component
 * Beautiful modal with 3D theme and awesome animations
 */
export function CreateProjectDialog({
  open,
  onOpenChange,
}: CreateProjectDialogProps) {
  const navigate = useNavigate();
  const { createProject, isCreating } = useProjectStore();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);

  // React Hook Form with Zod validation
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
  } = useForm<CreateProjectFormInput>({
    resolver: zodResolver(createProjectSchema),
    mode: "onChange",
  });

  const watchedTitle = watch("title", "");
  const watchedDescription = watch("description", "");

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

      toast.success("Project Created Successfully!", {
        description: `"${project.title}" is ready for 3D collaboration.`,
        duration: 4000,
      });

      reset();
      onOpenChange(false);

      // Navigate with smooth transition
      setTimeout(() => {
        navigate(`/project/${project.id}`);
      }, 500);
    } catch (error) {
      console.error("Failed to create project:", error);

      if (error instanceof ApiError) {
        if (error.isValidationError()) {
          const firstError = error.getFirstValidationError();
          toast.error("Invalid Input", {
            description: firstError || error.message,
          });
        } else {
          toast.error("Creation Failed", {
            description: error.message,
          });
        }
      } else {
        toast.error("Creation Failed", {
          description:
            "Unable to create project. Please check your connection and try again.",
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
      setFocusedField(null);
      onOpenChange(false);
    }
  };

  /**
   * Generate project suggestions
   */
  const projectSuggestions = [
    "Automotive Engine Design",
    "Architectural Model",
    "Product Prototype",
    "Mechanical Assembly",
    "Building Infrastructure",
    "Component Analysis",
  ];

  const isLoading = isSubmitting || isCreating;
  const canSubmit = watchedTitle && watchedTitle.length >= 2 && !isLoading;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[600px] bg-gradient-to-br from-card/95 to-card/90 backdrop-blur-xl border-border/50 shadow-2xl shadow-primary/10">
        {/* Animated Background Elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none rounded-lg">
          <div className="absolute top-4 right-4 w-20 h-20 bg-primary/5 rounded-full blur-xl animate-pulse" />
          <div
            className="absolute bottom-6 left-6 w-16 h-16 bg-chart-1/10 rounded-lg rotate-12 animate-pulse"
            style={{ animationDelay: "1s" }}
          />
          <div
            className="absolute top-1/2 left-1/4 w-12 h-12 bg-chart-2/5 rounded-full blur-lg animate-pulse"
            style={{ animationDelay: "2s" }}
          />
        </div>

        <DialogHeader className="relative z-10 space-y-4 pb-2">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-gradient-to-br from-primary to-chart-1 rounded-xl shadow-lg shadow-primary/25">
              <Box
                className="w-6 h-6 text-primary-foreground animate-spin"
                style={{ animationDuration: "8s" }}
              />
            </div>
            <div className="space-y-1">
              <DialogTitle className="text-xl font-bold bg-gradient-to-r from-foreground to-primary bg-clip-text text-transparent">
                Create New Project
              </DialogTitle>
              <DialogDescription className="text-muted-foreground">
                Launch your next 3D collaborative workspace
              </DialogDescription>
            </div>
          </div>

          {/* Feature Highlights */}
          <div className="flex flex-wrap gap-2">
            <Badge
              variant="secondary"
              className="text-xs bg-primary/10 text-primary border-primary/20"
            >
              <Users className="w-3 h-3 mr-1" />
              Multi-user
            </Badge>
            <Badge
              variant="secondary"
              className="text-xs bg-chart-1/10 text-chart-1 border-chart-1/20"
            >
              <Globe className="w-3 h-3 mr-1" />
              Real-time
            </Badge>
            <Badge
              variant="secondary"
              className="text-xs bg-chart-2/10 text-chart-2 border-chart-2/20"
            >
              <Zap className="w-3 h-3 mr-1" />
              3D Models
            </Badge>
          </div>
        </DialogHeader>

        <form
          onSubmit={handleSubmit(onSubmit)}
          className="relative z-10 space-y-6"
        >
          {/* Title Field */}
          <div className="space-y-3">
            <Label
              htmlFor="title"
              className="text-sm font-medium flex items-center gap-2"
            >
              <FileText className="w-4 h-4" />
              Project Title <span className="text-destructive">*</span>
            </Label>

            <div className="relative group">
              <Input
                id="title"
                type="text"
                placeholder="Enter your project name..."
                disabled={isLoading}
                onFocus={() => setFocusedField("title")}
                {...register("title")}
                className={`
                  text-base transition-all duration-300 bg-background/50 backdrop-blur-sm
                  ${
                    errors.title
                      ? "border-destructive focus:border-destructive ring-destructive/20"
                      : "border-border hover:border-primary/50 focus:border-primary"
                  }
                  ${
                    focusedField === "title"
                      ? "shadow-lg shadow-primary/10"
                      : ""
                  }
                  ${watchedTitle.length >= 2 ? "border-primary/70" : ""}
                `}
              />

              {/* Input Enhancement Indicators */}
              <div
                className={`absolute right-3 top-1/2 -translate-y-1/2 transition-all duration-300 ${
                  watchedTitle.length >= 2
                    ? "opacity-100 scale-100"
                    : "opacity-0 scale-75"
                }`}
              >
                {errors.title ? (
                  <div className="w-5 h-5 rounded-full bg-destructive/10 flex items-center justify-center">
                    <X className="w-3 h-3 text-destructive" />
                  </div>
                ) : watchedTitle.length >= 2 ? (
                  <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center">
                    <CheckCircle className="w-3 h-3 text-primary" />
                  </div>
                ) : null}
              </div>
            </div>

            {errors.title && (
              <div className="flex items-center gap-2 text-sm text-destructive animate-in">
                <div className="w-4 h-4 rounded-full bg-destructive/10 flex items-center justify-center flex-shrink-0">
                  <X className="w-2 h-2 text-destructive" />
                </div>
                {errors.title.message}
              </div>
            )}

            {/* Character Counter */}
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">
                2-100 characters • Clear and descriptive names work best
              </span>
              <span
                className={`font-mono ${
                  watchedTitle.length > 90
                    ? "text-orange-500"
                    : watchedTitle.length > 0
                    ? "text-primary"
                    : "text-muted-foreground"
                }`}
              >
                {watchedTitle.length}/100
              </span>
            </div>

            {/* Project Suggestions */}
            {focusedField === "title" && !watchedTitle && (
              <div className="space-y-2 animate-in">
                <p className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                  <Sparkles className="w-3 h-3" />
                  Quick suggestions
                </p>
                <div className="grid grid-cols-2 gap-2">
                  {projectSuggestions.slice(0, 4).map((suggestion, index) => (
                    <button
                      key={suggestion}
                      type="button"
                      onClick={() => {
                        const titleField = document.getElementById(
                          "title"
                        ) as HTMLInputElement;
                        if (titleField) {
                          titleField.value = suggestion;
                          titleField.focus();
                          titleField.dispatchEvent(
                            new Event("input", { bubbles: true })
                          );
                        }
                      }}
                      disabled={isLoading}
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

          {/* Description Field */}
          <div className="space-y-3">
            <Label
              htmlFor="description"
              className="text-sm font-medium flex items-center gap-2"
            >
              <FileText className="w-4 h-4" />
              Description (Optional)
            </Label>

            <div className="relative group">
              <Textarea
                id="description"
                placeholder="Describe your project goals, scope, or any specific requirements..."
                rows={4}
                disabled={isLoading}
                onFocus={() => setFocusedField("description")}
                {...register("description")}
                className={`
                  resize-none transition-all duration-300 bg-background/50 backdrop-blur-sm
                  ${
                    errors.description
                      ? "border-destructive focus:border-destructive ring-destructive/20"
                      : "border-border hover:border-primary/50 focus:border-primary"
                  }
                  ${
                    focusedField === "description"
                      ? "shadow-lg shadow-primary/10"
                      : ""
                  }
                  ${
                    watchedDescription && watchedDescription.length > 10
                      ? "border-primary/70"
                      : ""
                  }
                `}
              />

              {/* Optional Badge */}
              {watchedDescription && watchedDescription.length > 10 && (
                <div className="absolute top-3 right-3">
                  <div className="w-5 h-5 rounded-full bg-chart-1/10 flex items-center justify-center">
                    <CheckCircle className="w-3 h-3 text-chart-1" />
                  </div>
                </div>
              )}
            </div>

            {errors.description && (
              <div className="flex items-center gap-2 text-sm text-destructive animate-in">
                <div className="w-4 h-4 rounded-full bg-destructive/10 flex items-center justify-center flex-shrink-0">
                  <X className="w-2 h-2 text-destructive" />
                </div>
                {errors.description.message}
              </div>
            )}

            {/* Character Counter */}
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">
                Helps collaborators understand your project vision
              </span>
              <span
                className={`font-mono ${
                  watchedDescription && watchedDescription.length > 450
                    ? "text-orange-500"
                    : watchedDescription && watchedDescription.length > 0
                    ? "text-chart-1"
                    : "text-muted-foreground"
                }`}
              >
                {watchedDescription ? watchedDescription.length : 0}/500
              </span>
            </div>
          </div>

          {/* Project Preview */}
          {(watchedTitle || watchedDescription) && (
            <div className="p-4 bg-background/30 backdrop-blur-sm border border-border/30 rounded-xl space-y-3 animate-in">
              <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                <Sparkles className="w-4 h-4 text-primary" />
                Project Preview
              </div>
              <div className="space-y-2">
                <h4 className="font-semibold text-foreground">
                  {watchedTitle || "Untitled Project"}
                </h4>
                <p className="text-sm text-muted-foreground">
                  {watchedDescription || "No description provided"}
                </p>
                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  <span>Created just now</span>
                  <span>•</span>
                  <span>0 models</span>
                  <span>•</span>
                  <span>Ready for collaboration</span>
                </div>
              </div>
            </div>
          )}

          {/* Dialog Footer */}
          <DialogFooter className="gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isLoading}
              className="min-w-[100px]"
            >
              Cancel
            </Button>

            <Button
              type="submit"
              disabled={!canSubmit}
              className="min-w-[140px] relative overflow-hidden group bg-gradient-to-r from-primary to-chart-1 hover:from-primary/90 hover:to-chart-1/90 shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30 transition-all duration-300"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-700" />

              {isLoading ? (
                <div className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Creating...</span>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Rocket className="w-4 h-4" />
                  <span>Create Project</span>
                  <Sparkles className="w-4 h-4 group-hover:scale-110 transition-transform duration-200" />
                </div>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default CreateProjectDialog;
