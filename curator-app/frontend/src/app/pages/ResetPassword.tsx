import { useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router";
import { ArrowLeft, Eye, EyeOff, Lock, CheckCircle } from "lucide-react";
import { useAuth } from "../context/AuthContext";

export function ResetPassword() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { resetPassword } = useAuth();
  const token = useMemo(() => searchParams.get("token") || "", [searchParams]);
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!token) {
      setError("This reset link is invalid or incomplete.");
      return;
    }

    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }

    setIsLoading(true);

    try {
      const session = await resetPassword(token, password);
      setIsComplete(true);
      setTimeout(() => {
        navigate(session.onboarding.completed ? "/home" : "/onboarding", { replace: true });
      }, 800);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to reset your password right now.");
    } finally {
      setIsLoading(false);
    }
  };

  if (isComplete) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-surface via-background to-surface-container-low flex items-center justify-center p-6">
        <div className="w-full max-w-md bg-surface-container-lowest/70 backdrop-blur-xl border border-outline-variant/15 rounded-[40px] md:rounded-[60px] p-6 md:p-10 shadow-2xl text-center">
          <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-primary-container flex items-center justify-center">
            <CheckCircle className="w-10 h-10 text-on-primary-container" />
          </div>
          <h1 className="font-[family-name:var(--font-headline)] italic text-3xl text-on-surface mb-4">
            Password Updated
          </h1>
          <p className="text-on-surface-variant">
            Your password has been reset. We&apos;re taking you back into The Curator now.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-surface via-background to-surface-container-low flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        <button
          onClick={() => navigate("/sign-in")}
          className="mb-8 flex items-center gap-2 text-on-surface-variant hover:text-on-surface transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>Back to Sign In</span>
        </button>

        <div className="bg-surface-container-lowest/70 backdrop-blur-xl border border-outline-variant/15 rounded-[40px] md:rounded-[60px] p-6 md:p-10 shadow-2xl">
          <div className="text-center mb-8">
            <h1 className="font-[family-name:var(--font-headline)] italic text-4xl md:text-5xl text-on-surface mb-3">
              Create New Password
            </h1>
            <p className="text-on-surface-variant">
              Choose a strong password you haven&apos;t used before.
            </p>
          </div>

          {error && (
            <div className="mb-6 bg-error-container/50 border border-error text-on-error-container rounded-[30px] p-4 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="flex items-center gap-2 mb-2 text-on-surface text-sm font-medium">
                <Lock className="w-4 h-4 text-outline" />
                New Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="At least 8 characters"
                  required
                  className="w-full bg-surface-container-lowest/50 border border-outline-variant/20 rounded-2xl pl-5 pr-12 py-4 text-on-surface text-[15px] focus:outline-none focus:ring-2 focus:ring-primary transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((current) => !current)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-outline hover:text-on-surface transition-colors"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-inverse-surface text-white py-5 px-10 rounded-full font-semibold tracking-wide shadow-xl hover:bg-zinc-800 transition-all duration-300 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? "Updating..." : "Reset Password"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
