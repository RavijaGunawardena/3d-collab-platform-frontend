import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Loader2,
  Users,
  Zap,
  ArrowRight,
  Sparkles,
  Globe,
  MousePointer,
  Box,
} from "lucide-react";
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
import { Badge } from "@/components/ui/badge";

/**
 * Enhanced Login Page Component
 * Awesome UI with 3D theme and responsive design
 */
export function LoginPage() {
  const navigate = useNavigate();
  const { login, isAuthenticated, isLoading } = useAuthStore();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [focusedInput, setFocusedInput] = useState(false);
  const [hoveredExample, setHoveredExample] = useState<string | null>(null);

  // React Hook Form with Zod validation
  const {
    register,
    handleSubmit,
    formState: { errors },
    setFocus,
    setValue,
    watch,
  } = useForm<LoginFormInput>({
    resolver: zodResolver(loginSchema),
    mode: "onBlur",
  });

  const watchedUsername = watch("username", "");

  // Auto-focus username input on mount
  useEffect(() => {
    const timer = setTimeout(() => setFocus("username"), 100);
    return () => clearTimeout(timer);
  }, [setFocus]);

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      navigate("/projects", { replace: true });
    }
  }, [isAuthenticated, navigate]);

  /**
   * Handle form submission
   */
  const onSubmit = async (data: LoginFormInput) => {
    try {
      setIsSubmitting(true);

      await login(data.username);

      toast.success("Welcome to the 3D Collaboration Platform!", {
        description: `Successfully logged in as ${data.username}`,
        duration: 4000,
      });

      // Smooth transition delay
      setTimeout(() => {
        navigate("/projects", { replace: true });
      }, 500);
    } catch (error) {
      console.error("Login error:", error);

      if (error instanceof ApiError) {
        if (error.isValidationError()) {
          const firstError = error.getFirstValidationError();
          toast.error("Invalid Input", {
            description: firstError || error.message,
          });
        } else {
          toast.error("Authentication Failed", {
            description: error.message,
          });
        }
      } else {
        toast.error("Connection Error", {
          description: "Unable to connect to the platform. Please try again.",
        });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  /**
   * Handle example username selection
   */
  const handleExampleClick = (example: string) => {
    setValue("username", example);
    setFocus("username");

    // Add a subtle animation feedback
    const input = document.getElementById("username") as HTMLInputElement;
    if (input) {
      input.classList.add("animate-pulse");
      setTimeout(() => input.classList.remove("animate-pulse"), 600);
    }
  };

  const isButtonLoading = isLoading || isSubmitting;
  const hasContent = watchedUsername.length > 0;

  return (
    <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-background via-background to-muted/20">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Floating Geometric Shapes */}
        <div className="absolute top-20 left-10 w-32 h-32 bg-primary/5 rounded-full blur-xl animate-pulse" />
        <div
          className="absolute top-40 right-20 w-24 h-24 bg-chart-1/10 rounded-lg rotate-45 animate-bounce"
          style={{ animationDuration: "3s" }}
        />
        <div
          className="absolute bottom-32 left-1/4 w-40 h-40 bg-chart-2/5 rounded-full blur-2xl animate-pulse"
          style={{ animationDelay: "1s" }}
        />
        <div
          className="absolute bottom-20 right-10 w-28 h-28 bg-accent/10 rounded-full animate-pulse"
          style={{ animationDelay: "2s" }}
        />

        {/* Grid Pattern */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:50px_50px] [mask-image:radial-gradient(ellipse_80%_50%_at_50%_50%,#000_70%,transparent_110%)]" />
      </div>

      <div className="relative z-10 min-h-screen flex items-center justify-center p-4 sm:p-6 lg:p-8">
        <div className="w-full max-w-md space-y-8">
          {/* Header Section */}
          <div className="text-center space-y-4 animate-in">
            <div className="inline-flex items-center justify-center w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-primary to-chart-1 rounded-2xl shadow-lg shadow-primary/25 mb-4">
              <Box
                className="w-8 h-8 sm:w-10 sm:h-10 text-primary-foreground animate-spin"
                style={{ animationDuration: "8s" }}
              />
            </div>

            <div className="space-y-2">
              <h1 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-foreground via-primary to-chart-1 bg-clip-text text-transparent">
                Welcome Back
              </h1>
              <p className="text-muted-foreground text-sm sm:text-base max-w-sm mx-auto leading-relaxed">
                Enter the future of 3D collaborative design and bring your ideas
                to life
              </p>
            </div>

            {/* Feature Badges */}
            <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
              <Badge
                variant="secondary"
                className="text-xs bg-primary/10 text-primary border-primary/20"
              >
                <Users className="w-3 h-3 mr-1" />
                Real-time Collaboration
              </Badge>
              <Badge
                variant="secondary"
                className="text-xs bg-chart-1/10 text-chart-1 border-chart-1/20"
              >
                <Globe className="w-3 h-3 mr-1" />
                3D Visualization
              </Badge>
            </div>
          </div>

          {/* Login Card */}
          <Card className="backdrop-blur-sm bg-card/95 border-border/50 shadow-2xl shadow-primary/5 animate-in">
            <CardHeader className="space-y-3">
              <CardTitle className="text-xl font-semibold text-center text-foreground">
                Access Your Workspace
              </CardTitle>
              <CardDescription className="text-center text-muted-foreground">
                No passwords required - just enter your username to continue
              </CardDescription>
            </CardHeader>

            <form onSubmit={handleSubmit(onSubmit)}>
              <CardContent className="space-y-6">
                {/* Username Input */}
                <div className="space-y-3">
                  <Label
                    htmlFor="username"
                    className="text-sm font-medium text-foreground"
                  >
                    Username
                  </Label>
                  <div className="relative group">
                    <Input
                      id="username"
                      type="text"
                      placeholder="Enter your username..."
                      autoComplete="username"
                      disabled={isButtonLoading}
                      onFocus={() => setFocusedInput(true)}
                      {...register("username")}
                      className={`
                        text-base transition-all duration-300 bg-background/50 backdrop-blur-sm
                        ${
                          errors.username
                            ? "border-destructive focus:border-destructive ring-destructive/20"
                            : "border-border hover:border-primary/50 focus:border-primary"
                        }
                        ${focusedInput ? "shadow-lg shadow-primary/10" : ""}
                        ${hasContent ? "border-primary/70" : ""}
                      `}
                    />

                    {/* Input Enhancement Indicators */}
                    <div
                      className={`absolute right-3 top-1/2 -translate-y-1/2 transition-all duration-300 ${
                        hasContent
                          ? "opacity-100 scale-100"
                          : "opacity-0 scale-75"
                      }`}
                    >
                      {errors.username ? (
                        <div className="w-5 h-5 rounded-full bg-destructive/10 flex items-center justify-center">
                          <div className="w-2 h-2 rounded-full bg-destructive" />
                        </div>
                      ) : hasContent ? (
                        <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center">
                          <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                        </div>
                      ) : null}
                    </div>
                  </div>

                  {errors.username && (
                    <div className="flex items-center gap-2 text-sm text-destructive animate-in">
                      <div className="w-4 h-4 rounded-full bg-destructive/10 flex items-center justify-center flex-shrink-0">
                        <div className="w-1.5 h-1.5 rounded-full bg-destructive" />
                      </div>
                      {errors.username.message}
                    </div>
                  )}

                  {/* Username Rules */}
                  <div className="text-xs text-muted-foreground bg-muted/30 rounded-lg p-3 border border-border/30">
                    <div className="flex items-center gap-2 mb-1">
                      <Sparkles className="w-3 h-3" />
                      <span className="font-medium">Username Requirements</span>
                    </div>
                    <p>
                      {usernameRules.minLength}-{usernameRules.maxLength}{" "}
                      characters • {usernameRules.patternDescription}
                    </p>
                  </div>
                </div>

                {/* Example Usernames */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                    <MousePointer className="w-4 h-4" />
                    Quick Examples
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {usernameRules.examples.map((example, index) => (
                      <button
                        key={example}
                        type="button"
                        onClick={() => handleExampleClick(example)}
                        onMouseEnter={() => setHoveredExample(example)}
                        onMouseLeave={() => setHoveredExample(null)}
                        disabled={isButtonLoading}
                        className={`
                          group relative text-sm px-3 py-2 rounded-lg border transition-all duration-300
                          bg-gradient-to-br from-background to-muted/20 
                          hover:from-primary/5 hover:to-primary/10 
                          hover:border-primary/50 hover:shadow-md hover:shadow-primary/10
                          active:scale-95 disabled:opacity-50 disabled:hover:scale-100
                          ${
                            hoveredExample === example
                              ? "border-primary/70 shadow-lg shadow-primary/20"
                              : "border-border/50"
                          }
                        `}
                        style={{ animationDelay: `${index * 100}ms` }}
                      >
                        <span className="font-mono">{example}</span>
                        <div
                          className={`absolute inset-0 rounded-lg bg-gradient-to-r from-primary/0 via-primary/5 to-primary/0 transition-opacity duration-300 ${
                            hoveredExample === example
                              ? "opacity-100"
                              : "opacity-0"
                          }`}
                        />
                      </button>
                    ))}
                  </div>
                </div>
              </CardContent>

              <CardFooter className="pt-6">
                <Button
                  type="submit"
                  disabled={isButtonLoading || !watchedUsername.trim()}
                  className="w-full relative overflow-hidden group bg-gradient-to-r from-primary to-chart-1 hover:from-primary/90 hover:to-chart-1/90 shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30 transition-all duration-300"
                  size="lg"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-700" />

                  {isButtonLoading ? (
                    <div className="flex items-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Connecting...</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <Zap className="w-4 h-4" />
                      <span>Enter Platform</span>
                      <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-200" />
                    </div>
                  )}
                </Button>
              </CardFooter>
            </form>
          </Card>

          {/* Footer */}
          <div
            className="text-center space-y-4 animate-in"
            style={{ animationDelay: "400ms" }}
          >
            <div className="flex items-center justify-center gap-4 text-xs text-muted-foreground">
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                <span>Platform Online</span>
              </div>
              <div className="w-1 h-1 rounded-full bg-border" />
              <span>Secure Authentication</span>
            </div>

            <p className="text-xs text-muted-foreground max-w-sm mx-auto leading-relaxed">
              Experience the next generation of collaborative 3D design. Join
              teams worldwide in creating amazing projects together.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default LoginPage;
