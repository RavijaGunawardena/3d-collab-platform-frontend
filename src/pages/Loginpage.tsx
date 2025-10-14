import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

import { useAuthStore } from "@/store/authStore";
import {
  loginSchema,
  LoginFormInput,
  usernameRules,
} from "@/validators/authValidator";
import { ApiError } from "@/services/api";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

/**
 * Login Page Component
 * Simple dummy authentication with username only
 */
export function LoginPage() {
  const navigate = useNavigate();
  const { login, isAuthenticated, isLoading } = useAuthStore();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // React Hook Form with Zod validation
  const {
    register,
    handleSubmit,
    formState: { errors },
    setFocus,
  } = useForm<LoginFormInput>({
    resolver: zodResolver(loginSchema),
    mode: "onBlur", // Validate on blur for better UX
  });

  // Auto-focus username input on mount
  useEffect(() => {
    setFocus("username");
  }, [setFocus]);

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      navigate("/", { replace: true });
    }
  }, [isAuthenticated, navigate]);

  /**
   * Handle form submission
   */
  const onSubmit = async (data: LoginFormInput) => {
    try {
      setIsSubmitting(true);

      await login(data.username);

      // Show success toast
      toast.success("Welcome!", {
        description: `Logged in as ${data.username}`,
      });

      // Navigate to projects page
      navigate("/", { replace: true });
    } catch (error) {
      console.error("Login error:", error);

      // Handle API errors
      if (error instanceof ApiError) {
        if (error.isValidationError()) {
          // Show validation errors
          const firstError = error.getFirstValidationError();
          toast.error("Validation Error", {
            description: firstError || error.message,
          });
        } else {
          // Show generic error
          toast.error("Login Failed", {
            description: error.message,
          });
        }
      } else {
        // Unknown error
        toast.error("Login Failed", {
          description: "An unexpected error occurred. Please try again.",
        });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // Loading state from store or local submission state
  const isButtonLoading = isLoading || isSubmitting;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">
            Welcome Back
          </CardTitle>
          <CardDescription className="text-center">
            Enter your username to access the 3D Collaborative Platform
          </CardDescription>
        </CardHeader>

        <form onSubmit={handleSubmit(onSubmit)}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                type="text"
                placeholder="Enter your username"
                autoComplete="username"
                disabled={isButtonLoading}
                {...register("username")}
                className={errors.username ? "border-red-500" : ""}
              />
              {errors.username && (
                <p className="text-sm text-red-500">
                  {errors.username.message}
                </p>
              )}

              {/* Validation hints */}
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {usernameRules.minLength}-{usernameRules.maxLength} characters.{" "}
                {usernameRules.patternDescription}.
              </p>
            </div>

            {/* Example usernames */}
            <div className="bg-slate-50 dark:bg-slate-900 rounded-lg p-3 space-y-2">
              <p className="text-xs font-medium text-slate-700 dark:text-slate-300">
                Example usernames:
              </p>
              <div className="flex flex-wrap gap-2">
                {usernameRules.examples.map((example) => (
                  <button
                    key={example}
                    type="button"
                    onClick={() => {
                      // Auto-fill with example username
                      const input = document.getElementById(
                        "username"
                      ) as HTMLInputElement;
                      if (input) {
                        input.value = example;
                        input.focus();
                      }
                    }}
                    className="text-xs px-2 py-1 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 rounded transition-colors"
                    disabled={isButtonLoading}
                  >
                    {example}
                  </button>
                ))}
              </div>
            </div>
          </CardContent>

          <CardFooter>
            <Button type="submit" className="w-full" disabled={isButtonLoading}>
              {isButtonLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Logging in...
                </>
              ) : (
                "Login"
              )}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}

export default LoginPage;
