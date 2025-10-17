import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { 
  Loader2, 
  MapPin, 
  Palette, 
  Type, 
  Sparkles, 
  Eye,
  Hash,
  MessageSquare,
  Navigation,
  CheckCircle,
  X,
  Lightbulb,
  Target,
  Layers
} from "lucide-react";
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
import { Badge } from "@/components/ui/badge";
import { Vector3 } from "@/types/project.types";

/**
 * Enhanced Create Annotation Form Schema
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
  category: z
    .enum(["note", "issue", "suggestion", "question", "highlight"])
    .default("note"),
});

type CreateAnnotationFormData = z.infer<typeof createAnnotationSchema>;

/**
 * Annotation categories with icons and colors
 */
const ANNOTATION_CATEGORIES = [
  { 
    value: "note", 
    label: "Note", 
    icon: MessageSquare, 
    color: "#60a5fa",
    description: "General observation or comment"
  },
  { 
    value: "issue", 
    label: "Issue", 
    icon: Target, 
    color: "#f87171",
    description: "Problem that needs attention"
  },
  { 
    value: "suggestion", 
    label: "Suggestion", 
    icon: Lightbulb, 
    color: "#fbbf24",
    description: "Improvement or idea"
  },
  { 
    value: "question", 
    label: "Question", 
    icon: Hash, 
    color: "#a78bfa",
    description: "Something that needs clarification"
  },
  { 
    value: "highlight", 
    label: "Highlight", 
    icon: Sparkles, 
    color: "#34d399",
    description: "Important feature or detail"
  },
];

/**
 * Enhanced annotation templates
 */
const ANNOTATION_TEMPLATES = [
  "This component needs review",
  "Consider alternative approach",
  "Good implementation",
  "Requires optimization",
  "Check dimensions",
  "Material specification needed",
  "Assembly instruction required",
  "Quality check point",
];

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
 * Ultra Enhanced Create Annotation Dialog Component
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
  const [selectedCategory, setSelectedCategory] = useState<string>("note");
  const [focusedField, setFocusedField] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
    watch,
  } = useForm<CreateAnnotationFormData>({
    resolver: zodResolver(createAnnotationSchema),
    defaultValues: {
      text: "",
      color: DEFAULT_ANNOTATION_COLOR,
      category: "note",
    },
  });

  const watchedText = watch("text", "");

  // Calculate completion level
  useEffect(() => {
    let level = 0;
    if (watchedText.length > 0) level += 40;
    if (watchedText.length > 10) level += 30;
    if (selectedColor !== DEFAULT_ANNOTATION_COLOR) level += 20;
    if (selectedCategory !== "note") level += 10;
  }, [watchedText, selectedColor, selectedCategory]);

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

      toast.success("Annotation Created Successfully!", {
        description: `Your ${selectedCategory} has been placed at coordinates (${position.x.toFixed(1)}, ${position.y.toFixed(1)}, ${position.z.toFixed(1)})`,
        duration: 4000,
      });

      reset();
      setSelectedColor(DEFAULT_ANNOTATION_COLOR);
      setSelectedCategory("note");
      onOpenChange(false);
      onAnnotationCreated();
    } catch (error: any) {
      console.error("Failed to create annotation:", error);
      toast.error("Creation Failed", {
        description: error.message || "Unable to create annotation. Please try again.",
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
   * Handle category selection
   */
  const handleCategorySelect = (category: string) => {
    setSelectedCategory(category);
    setValue("category", category as any);
    const categoryData = ANNOTATION_CATEGORIES.find(c => c.value === category);
    if (categoryData) {
      handleColorSelect(categoryData.color);
    }
  };

  /**
   * Handle template selection
   */
  const handleTemplateSelect = (template: string) => {
    setValue("text", template);
    const textArea = document.getElementById("annotation-text") as HTMLTextAreaElement;
    if (textArea) {
      textArea.focus();
      textArea.setSelectionRange(template.length, template.length);
    }
  };

  /**
   * Handle dialog close
   */
  const handleClose = () => {
    if (!isSubmitting) {
      reset();
      setSelectedColor(DEFAULT_ANNOTATION_COLOR);
      setSelectedCategory("note");
      setFocusedField(null);
      onOpenChange(false);
    }
  };

  const selectedCategoryData = ANNOTATION_CATEGORIES.find(c => c.value === selectedCategory);

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[650px] max-h-[90vh] bg-gradient-to-br from-card/95 to-card/90 backdrop-blur-xl border-border/50 shadow-2xl shadow-primary/10 flex flex-col">
        {/* Animated Background Elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none rounded-lg">
          <div className="absolute top-4 right-4 w-24 h-24 bg-primary/5 rounded-full blur-2xl animate-pulse" />
          <div className="absolute bottom-6 left-6 w-20 h-20 bg-chart-1/10 rounded-lg rotate-12 animate-pulse" style={{ animationDelay: '1s' }} />
          <div className="absolute top-1/2 left-1/4 w-16 h-16 bg-chart-2/5 rounded-full blur-lg animate-pulse" style={{ animationDelay: '2s' }} />
        </div>

        <DialogHeader className="relative z-10 space-y-4 pb-4 flex-shrink-0">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-gradient-to-br from-primary to-chart-1 rounded-2xl shadow-lg shadow-primary/25">
              <MapPin className="w-6 h-6 text-primary-foreground" />
            </div>
            <div className="space-y-1">
              <DialogTitle className="text-xl font-bold bg-gradient-to-r from-foreground to-primary bg-clip-text text-transparent">
                Create Annotation
              </DialogTitle>
              <DialogDescription className="text-muted-foreground">
                Add contextual information to your 3D model at the selected location
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {/* Scrollable Content Area */}
        <div className="relative z-10 flex-1 overflow-y-auto min-h-0 pr-2 -mr-2">
          <div className="space-y-6 pb-6">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              {/* Enhanced Position Info */}
              <div className="p-4 bg-gradient-to-r from-background/80 to-muted/20 rounded-xl border border-border/30">
                <div className="flex items-center gap-2 mb-2">
                  <Navigation className="w-4 h-4 text-primary" />
                  <span className="text-sm font-medium text-foreground">3D Coordinates</span>
                </div>
                <div className="grid grid-cols-3 gap-3 text-sm">
                  <div className="text-center p-2 bg-background/50 rounded-lg">
                    <div className="text-xs text-muted-foreground">X</div>
                    <div className="font-mono font-medium">{position.x.toFixed(2)}</div>
                  </div>
                  <div className="text-center p-2 bg-background/50 rounded-lg">
                    <div className="text-xs text-muted-foreground">Y</div>
                    <div className="font-mono font-medium">{position.y.toFixed(2)}</div>
                  </div>
                  <div className="text-center p-2 bg-background/50 rounded-lg">
                    <div className="text-xs text-muted-foreground">Z</div>
                    <div className="font-mono font-medium">{position.z.toFixed(2)}</div>
                  </div>
                </div>
              </div>

              {/* Enhanced Category Selection */}
              <div className="space-y-3">
                <Label className="text-sm font-medium flex items-center gap-2">
                  <Layers className="w-4 h-4" />
                  Annotation Type
                </Label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {ANNOTATION_CATEGORIES.map((category) => {
                    const Icon = category.icon;
                    const isSelected = selectedCategory === category.value;
                    return (
                      <button
                        key={category.value}
                        type="button"
                        onClick={() => handleCategorySelect(category.value)}
                        disabled={isSubmitting}
                        className={`
                          p-3 rounded-xl border-2 transition-all duration-200 text-left
                          ${isSelected
                            ? 'border-primary bg-primary/10 shadow-md shadow-primary/20'
                            : 'border-border hover:border-primary/50 hover:bg-primary/5'
                          }
                        `}
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <div 
                            className="p-1.5 rounded-lg"
                            style={{ backgroundColor: `${category.color}20` }}
                          >
                            <Icon 
                              className="w-3 h-3" 
                              style={{ color: category.color }}
                            />
                          </div>
                          <span className="font-medium text-sm">{category.label}</span>
                        </div>
                        <p className="text-xs text-muted-foreground hidden sm:block">{category.description}</p>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Enhanced Annotation Text */}
              <div className="space-y-3">
                <Label htmlFor="annotation-text" className="text-sm font-medium flex items-center gap-2">
                  <Type className="w-4 h-4" />
                  Annotation Content <span className="text-destructive">*</span>
                </Label>
                
                <div className="relative group">
                  <Textarea
                    id="annotation-text"
                    placeholder={`Enter your ${selectedCategoryData?.label.toLowerCase() || 'annotation'}...`}
                    rows={4}
                    disabled={isSubmitting}
                    onFocus={() => setFocusedField("text")}
                    {...register("text")}
                    className={`
                      resize-none transition-all duration-300 bg-background/50 backdrop-blur-sm
                      ${errors.text 
                        ? "border-destructive focus:border-destructive ring-destructive/20" 
                        : "border-border hover:border-primary/50 focus:border-primary"
                      }
                      ${focusedField === "text" ? "shadow-lg shadow-primary/10" : ""}
                    `}
                  />
                  
                  {/* Enhanced validation indicator */}
                  <div className={`absolute top-3 right-3 transition-all duration-300 ${
                    watchedText.length > 0 ? 'opacity-100 scale-100' : 'opacity-0 scale-75'
                  }`}>
                    {errors.text ? (
                      <div className="w-5 h-5 rounded-full bg-destructive/10 flex items-center justify-center">
                        <X className="w-3 h-3 text-destructive" />
                      </div>
                    ) : watchedText.length > 0 ? (
                      <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center">
                        <CheckCircle className="w-3 h-3 text-primary" />
                      </div>
                    ) : null}
                  </div>
                </div>
                
                {errors.text && (
                  <div className="flex items-center gap-2 text-sm text-destructive animate-in">
                    <X className="w-4 h-4" />
                    {errors.text.message}
                  </div>
                )}

                {/* Character Counter */}
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">
                    Be specific and helpful for team collaboration
                  </span>
                  <span className={`font-mono transition-colors duration-200 ${
                    watchedText.length > 450 ? 'text-orange-500' : 
                    watchedText.length > 0 ? 'text-primary' : 'text-muted-foreground'
                  }`}>
                    {watchedText.length}/500
                  </span>
                </div>

                {/* Template suggestions */}
                {focusedField === "text" && !watchedText && (
                  <div className="space-y-2 animate-in">
                    <p className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                      <Sparkles className="w-3 h-3" />
                      Quick templates
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {ANNOTATION_TEMPLATES.slice(0, 4).map((template, index) => (
                        <button
                          key={template}
                          type="button"
                          onClick={() => handleTemplateSelect(template)}
                          disabled={isSubmitting}
                          className="text-xs text-left px-3 py-2 rounded-lg border border-border/50 bg-background/30 hover:bg-primary/5 hover:border-primary/30 transition-all duration-200 truncate"
                          style={{ animationDelay: `${index * 50}ms` }}
                        >
                          {template}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Enhanced Color Selection */}
              <div className="space-y-3">
                <Label className="text-sm font-medium flex items-center gap-2">
                  <Palette className="w-4 h-4" />
                  Visual Style
                </Label>
                
                <div className="space-y-3">
                  {/* Color presets */}
                  <div className="flex items-center gap-2 flex-wrap">
                    {ANNOTATION_COLOR_PRESETS.map((color) => (
                      <button
                        key={color}
                        type="button"
                        onClick={() => handleColorSelect(color)}
                        disabled={isSubmitting}
                        className={`h-8 w-8 sm:h-10 sm:w-10 rounded-xl border-2 transition-all duration-200 hover:scale-110 shadow-sm ${
                          selectedColor === color
                            ? "border-white ring-2 ring-primary/50 scale-110"
                            : "border-slate-300 dark:border-slate-600 hover:border-primary/50"
                        }`}
                        style={{ backgroundColor: color }}
                        title={color}
                      />
                    ))}
                    
                    {/* Custom color picker */}
                    <div className="relative">
                      <input
                        type="color"
                        value={selectedColor}
                        onChange={(e) => handleColorSelect(e.target.value)}
                        disabled={isSubmitting}
                        className="h-8 w-8 sm:h-10 sm:w-10 rounded-xl cursor-pointer border-2 border-slate-600 transition-all duration-200 hover:scale-110"
                        title="Custom color"
                      />
                      <div className="absolute -top-1 -right-1 w-4 h-4 bg-gradient-to-br from-primary to-chart-1 rounded-full flex items-center justify-center">
                        <Palette className="w-2 h-2 text-white" />
                      </div>
                    </div>
                  </div>
                  
                  {/* Color info */}
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <div 
                      className="w-4 h-4 rounded border border-border"
                      style={{ backgroundColor: selectedColor }}
                    />
                    <span>Selected: {selectedColor}</span>
                    {selectedCategoryData && (
                      <Badge variant="secondary" className="text-xs">
                        {selectedCategoryData.label} style
                      </Badge>
                    )}
                  </div>
                </div>
              </div>

              {/* Preview Section */}
              {(watchedText || selectedCategory !== "note") && (
                <div className="p-4 bg-background/30 backdrop-blur-sm border border-border/30 rounded-xl space-y-3 animate-in">
                  <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                    <Eye className="w-4 h-4 text-primary" />
                    Annotation Preview
                  </div>
                  <div className="flex items-start gap-3">
                    <div 
                      className="w-3 h-3 rounded-full mt-1 flex-shrink-0"
                      style={{ backgroundColor: selectedColor }}
                    />
                    <div className="space-y-1 min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        {selectedCategoryData && (
                          <Badge 
                            variant="secondary" 
                            className="text-xs"
                            style={{ 
                              backgroundColor: `${selectedCategoryData.color}20`,
                              color: selectedCategoryData.color,
                              borderColor: `${selectedCategoryData.color}40`
                            }}
                          >
                            {selectedCategoryData.label}
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-foreground break-words">
                        {watchedText || "Your annotation text will appear here..."}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Position: ({position.x.toFixed(1)}, {position.y.toFixed(1)}, {position.z.toFixed(1)})
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
            disabled={!watchedText.trim() || isSubmitting}
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
                <MapPin className="w-4 h-4" />
                <span>Place Annotation</span>
                <Sparkles className="w-4 h-4 group-hover:scale-110 transition-transform duration-200" />
              </div>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default CreateAnnotationDialog;