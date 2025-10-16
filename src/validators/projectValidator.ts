import { z } from "zod";

/**
 * Vector3 Schema (3D coordinate)
 */
export const vector3Schema = z.object({
  x: z.number().finite(),
  y: z.number().finite(),
  z: z.number().finite(),
});

/**
 * Create Project Schema
 * Validates project creation form input (matches backend validation exactly)
 */
export const createProjectSchema = z.object({
  title: z
    .string()
    .trim()
    .min(2, "Title must be at least 2 characters")
    .max(100, "Title must be at most 100 characters"),
  description: z
    .string()
    .trim()
    .max(500, "Description must be at most 500 characters")
    .optional(),
});

/**
 * Update Project Schema
 */
export const updateProjectSchema = z.object({
  title: z
    .string()
    .trim()
    .min(2, "Title must be at least 2 characters")
    .max(100, "Title must be at most 100 characters")
    .optional(),
  description: z
    .string()
    .trim()
    .max(500, "Description must be at most 500 characters")
    .optional(),
});

/**
 * Add Model Schema
 */
export const addModelSchema = z.object({
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

/**
 * Create Annotation Schema
 */
export const createAnnotationSchema = z.object({
  text: z
    .string()
    .trim()
    .min(1, "Annotation text is required")
    .max(500, "Text must be at most 500 characters"),
  color: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/, "Invalid color format")
    .default("#ff6b6b"),
});

/**
 * Form Input Types
 * Inferred from schemas
 */
export type CreateProjectFormInput = z.infer<typeof createProjectSchema>;
export type UpdateProjectFormInput = z.infer<typeof updateProjectSchema>;
export type AddModelFormInput = z.infer<typeof addModelSchema>;
export type CreateAnnotationFormInput = z.infer<typeof createAnnotationSchema>;

/**
 * Validate project title manually (for custom validation)
 *
 * @param title - Project title to validate
 * @returns Validation result with success flag and error message
 */
export function validateProjectTitle(title: string): {
  success: boolean;
  error?: string;
} {
  try {
    createProjectSchema.pick({ title: true }).parse({ title });
    return { success: true };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const firstError = error.issues[0];
      return {
        success: false,
        error: firstError?.message || "Invalid title",
      };
    }
    return {
      success: false,
      error: "Validation failed",
    };
  }
}

/**
 * Validate model name manually (for custom validation)
 *
 * @param name - Model name to validate
 * @returns Validation result with success flag and error message
 */
export function validateModelName(name: string): {
  success: boolean;
  error?: string;
} {
  try {
    addModelSchema.pick({ name: true }).parse({ name });
    return { success: true };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const firstError = error.issues[0];
      return {
        success: false,
        error: firstError?.message || "Invalid model name",
      };
    }
    return {
      success: false,
      error: "Validation failed",
    };
  }
}

/**
 * Validate annotation text manually (for custom validation)
 *
 * @param text - Annotation text to validate
 * @returns Validation result with success flag and error message
 */
export function validateAnnotationText(text: string): {
  success: boolean;
  error?: string;
} {
  try {
    createAnnotationSchema.pick({ text: true }).parse({ text });
    return { success: true };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const firstError = error.issues[0];
      return {
        success: false,
        error: firstError?.message || "Invalid annotation text",
      };
    }
    return {
      success: false,
      error: "Validation failed",
    };
  }
}

/**
 * Project field validation rules
 * Extracted for use in UI hints/tooltips
 */
export const projectRules = {
  title: {
    minLength: 2,
    maxLength: 100,
    examples: [
      "Engine Design v2",
      "3D Architecture Model",
      "Product Prototype",
    ],
  },
  description: {
    maxLength: 500,
    examples: [
      "Collaborative design of the new engine components",
      "Architectural visualization for the downtown project",
      "Interactive prototype for user testing",
    ],
  },
  modelName: {
    minLength: 1,
    maxLength: 100,
    examples: ["Main Body", "Component A", "Support Structure", "Base Plate"],
  },
  annotation: {
    minLength: 1,
    maxLength: 500,
    examples: [
      "Check dimensions here",
      "Material should be steel",
      "Consider adding reinforcement",
      "Review with engineering team",
    ],
  },
} as const;

/**
 * Geometry Type Options
 */
export const geometryTypes = [
  { value: "box", label: "Box" },
  { value: "sphere", label: "Sphere" },
  { value: "cylinder", label: "Cylinder" },
  { value: "cone", label: "Cone" },
  { value: "torus", label: "Torus" },
] as const;

/**
 * Color Presets for Models
 */
export const modelColorPresets = [
  "#60a5fa", // Blue
  "#f87171", // Red
  "#34d399", // Green
  "#fbbf24", // Yellow
  "#a78bfa", // Purple
  "#fb923c", // Orange
  "#ec4899", // Pink
  "#06b6d4", // Cyan
] as const;

/**
 * Color Presets for Annotations
 */
export const annotationColorPresets = [
  "#ff6b6b", // Red
  "#4ecdc4", // Teal
  "#45b7d1", // Blue
  "#f9ca24", // Yellow
  "#6c5ce7", // Purple
  "#00d2d3", // Cyan
  "#ff9ff3", // Pink
  "#feca57", // Orange
  "#48dbfb", // Light Blue
  "#1dd1a1", // Green
] as const;

export default {
  createProjectSchema,
  updateProjectSchema,
  addModelSchema,
  createAnnotationSchema,
  vector3Schema,
};
