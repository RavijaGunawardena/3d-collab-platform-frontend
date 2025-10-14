import { z } from "zod";

/**
 * Login Schema
 * Validates login form input (matches backend validation exactly)
 */
export const loginSchema = z.object({
  username: z
    .string()
    .trim()
    .min(2, "Username must be at least 2 characters")
    .max(50, "Username must be at most 50 characters")
    .regex(
      /^[a-zA-Z0-9_-]+$/,
      "Username can only contain letters, numbers, underscores, and hyphens"
    ),
});

/**
 * Login Form Input Type
 * Inferred from loginSchema
 */
export type LoginFormInput = z.infer<typeof loginSchema>;

/**
 * Validate username manually (for custom validation)
 *
 * @param username - Username to validate
 * @returns Validation result with success flag and error message
 */
export function validateUsername(username: string): {
  success: boolean;
  error?: string;
} {
  try {
    loginSchema.parse({ username });
    return { success: true };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const firstError = error.issues[0];
      return {
        success: false,
        error: firstError?.message || "Invalid username",
      };
    }
    return {
      success: false,
      error: "Validation failed",
    };
  }
}

/**
 * Username field validation rules
 * Extracted for use in UI hints/tooltips
 */
export const usernameRules = {
  minLength: 2,
  maxLength: 50,
  pattern: /^[a-zA-Z0-9_-]+$/,
  patternDescription: "Only letters, numbers, underscores, and hyphens",
  examples: ["alice", "bob123", "user_name", "test-user"],
} as const;

export default loginSchema;
