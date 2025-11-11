import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Mail, Lock, Shield } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { 
  validateAuthCredentials, 
  isLockedOut, 
  getLockoutTimeRemaining,
  recordFailedLogin,
  resetLoginAttempts,
  getAttemptsRemaining 
} from "@/lib/authValidation";

interface AuthProps {
  onAuthSuccess?: () => void;
}

export const Auth = ({ onAuthSuccess }: AuthProps) => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [email, setEmail] = useState(() => {
    // Pre-fill email if "remember me" was previously checked
    return localStorage.getItem('malunita_remember_email') || "";
  });
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(() => {
    return localStorage.getItem('malunita_remember_me') === 'true';
  });
  const [loading, setLoading] = useState(false);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const { toast } = useToast();

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationErrors([]);

    // Check if account is locked out
    if (!isForgotPassword && isLockedOut(email)) {
      const minutesRemaining = getLockoutTimeRemaining(email);
      toast({
        title: "Account Temporarily Locked",
        description: `Too many failed login attempts. Please try again in ${minutesRemaining} minute${minutesRemaining !== 1 ? 's' : ''}.`,
        variant: "destructive",
      });
      return;
    }

    // Validate credentials (only for signup)
    if (isSignUp && !isForgotPassword) {
      const validation = validateAuthCredentials(email, password);
      if (!validation.success) {
        setValidationErrors(validation.errors || []);
        toast({
          title: "Invalid Input",
          description: "Please check the requirements below.",
          variant: "destructive",
        });
        return;
      }
    }

    setLoading(true);

    try {
      if (isForgotPassword) {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/reset-password`,
        });

        if (error) throw error;

        toast({
          title: "Password reset email sent",
          description: "Check your inbox for a password reset link.",
        });
        
        setIsForgotPassword(false);
        setEmail("");
      } else if (isSignUp) {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/`,
          },
        });

        if (error) throw error;

        toast({
          title: "Welcome to Malunita!",
          description: "Your account has been created. You can now start using the app.",
        });
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) {
          // Record failed login attempt
          recordFailedLogin(email);
          const attemptsRemaining = getAttemptsRemaining(email);
          
          if (attemptsRemaining > 0) {
            toast({
              title: "Login Failed",
              description: `Invalid credentials. ${attemptsRemaining} attempt${attemptsRemaining !== 1 ? 's' : ''} remaining before temporary lockout.`,
              variant: "destructive",
            });
          }
          throw error;
        }

        // Reset failed attempts on successful login
        resetLoginAttempts(email);

        // Store remember me preference
        if (rememberMe) {
          localStorage.setItem('malunita_remember_me', 'true');
          localStorage.setItem('malunita_remember_email', email);
        } else {
          localStorage.removeItem('malunita_remember_me');
          localStorage.removeItem('malunita_remember_email');
        }

        toast({
          title: "Welcome back!",
          description: "You've successfully signed in.",
        });
      }

      onAuthSuccess?.();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin,
        },
      });

      if (error) throw error;
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-6 bg-background">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-light tracking-tight text-foreground mb-2">
            Malunita
          </h1>
          <p className="text-muted-foreground">
            Your minimalist thinking partner
          </p>
        </div>

        <div className="bg-card rounded-3xl p-8 border border-secondary shadow-lg">
          <h2 className="text-2xl font-light text-center mb-6">
            {isForgotPassword ? "Reset Password" : isSignUp ? "Create Account" : "Sign In"}
          </h2>

          <form onSubmit={handleAuth} className="space-y-4">
            <div>
              <label className="text-sm text-muted-foreground mb-2 block">
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10"
                  placeholder="you@example.com"
                  required
                />
              </div>
            </div>

            {!isForgotPassword && (
              <div>
                <label className="text-sm text-muted-foreground mb-2 block">
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10"
                    placeholder="••••••••"
                    required
                  />
                </div>
                {isSignUp && (
                  <div className="mt-2 space-y-1">
                    <div className="flex items-start gap-2 text-xs text-muted-foreground">
                      <Shield className="w-3 h-3 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="font-medium mb-1">Password Requirements:</p>
                        <ul className="space-y-0.5 list-disc list-inside">
                          <li>At least 10 characters</li>
                          <li>One uppercase letter</li>
                          <li>One lowercase letter</li>
                          <li>One number</li>
                          <li>One special character (!@#$%^&*)</li>
                        </ul>
                      </div>
                    </div>
                    {validationErrors.length > 0 && (
                      <div className="mt-2 p-2 bg-destructive/10 border border-destructive/20 rounded-md">
                        {validationErrors.map((error, idx) => (
                          <p key={idx} className="text-xs text-destructive">
                            {error}
                          </p>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {!isForgotPassword && !isSignUp && (
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="remember" 
                    checked={rememberMe}
                    onCheckedChange={(checked) => setRememberMe(checked as boolean)}
                  />
                  <label
                    htmlFor="remember"
                    className="text-xs text-muted-foreground cursor-pointer select-none"
                  >
                    Remember this device
                  </label>
                </div>
                <button
                  type="button"
                  onClick={() => setIsForgotPassword(true)}
                  className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                >
                  Forgot password?
                </button>
              </div>
            )}

            <Button
              type="submit"
              className="w-full"
              disabled={loading}
            >
              {loading 
                ? "Loading..." 
                : isForgotPassword 
                ? "Send Reset Link" 
                : isSignUp 
                ? "Sign Up" 
                : "Sign In"}
            </Button>
          </form>

          {isForgotPassword && (
            <button
              onClick={() => {
                setIsForgotPassword(false);
                setEmail("");
              }}
              className="w-full mt-4 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Back to sign in
            </button>
          )}

          {!isForgotPassword && (
            <>
              <div className="relative my-6">
                <Separator />
                <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-card px-2 text-xs text-muted-foreground">
                  OR
                </span>
              </div>

              <Button
                variant="outline"
                className="w-full"
                onClick={handleGoogleSignIn}
                disabled={loading}
              >
                <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                  <path
                    fill="currentColor"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="currentColor"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
                Continue with Google
              </Button>

              <button
                onClick={() => setIsSignUp(!isSignUp)}
                className="w-full mt-4 text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                {isSignUp
                  ? "Already have an account? Sign in"
                  : "Don't have an account? Sign up"}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
