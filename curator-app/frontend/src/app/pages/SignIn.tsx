import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router";
import { ArrowLeft, Eye, EyeOff, Lock, Mail } from "lucide-react";
import { IdentityProviderButtons } from "../components/IdentityProviderButtons";
import { useAuth } from "../context/AuthContext";
import { AuthScreenLayout } from "../../ui/auth-screen-layout";

export function SignIn() {
  const navigate = useNavigate();
  const { authStatus, onboarding, providerAvailability, signIn } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const showIdentityProviders =
    providerAvailability.entra && (providerAvailability.google || providerAvailability.apple);

  const onboardingComplete = onboarding?.completed ?? false;

  useEffect(() => {
    if (authStatus === "loading") return;
    if (authStatus === "authenticated") {
      navigate(onboardingComplete ? "/brief" : "/onboarding", { replace: true });
    }
  }, [authStatus, navigate, onboardingComplete]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const session = await signIn(email, password);
      navigate(session.onboarding.completed ? "/brief" : "/onboarding", { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Invalid email or password. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthScreenLayout>
      <div className="w-full px-6 py-6 lg:px-0">
        <Link
          to="/welcome"
          className="relative z-30 mb-5 inline-flex items-center gap-2 rounded-full border border-outline-variant/20 bg-surface-container-lowest px-4 py-2 text-sm text-on-surface-variant no-underline shadow-sm transition-colors hover:bg-surface-container hover:text-on-surface"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>Back</span>
        </Link>

        <div className="editorial-card p-7 md:p-9">
          <div className="mb-8">
            <p className="mb-3 text-[10px] font-semibold uppercase tracking-[0.2em] text-outline">
              Sign in
            </p>
            <h1 className="mb-3 font-[family-name:var(--font-headline)] text-[32px] italic leading-[1.2] text-on-surface">
              Welcome Back
            </h1>
            <p className="text-sm leading-6 text-on-surface-variant">
              We&apos;ll restore your profile and settings exactly where you left them.
            </p>
          </div>

          {error && (
            <div className="mb-6 rounded-2xl bg-error-container px-4 py-3 text-sm leading-5 text-on-error-container">
              {error}
            </div>
          )}

          {showIdentityProviders && (
            <div className="mb-6 space-y-4">
              <IdentityProviderButtons mode="signin" />
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-outline-variant/20" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-4 bg-surface-container-lowest text-outline">
                    or sign in with email
                  </span>
                </div>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="rounded-[28px] border border-outline-variant/20 bg-surface-container-low p-5 focus-within:border-primary">
              <label className="mb-2.5 flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.15em] text-outline">
                <Mail className="w-4 h-4 text-outline" />
                Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                autoComplete="email"
                required
                className="w-full bg-transparent p-0 text-[17px] text-on-surface outline-none placeholder:text-outline/60"
              />
            </div>

            <div className="rounded-[28px] border border-outline-variant/20 bg-surface-container-low p-5 focus-within:border-primary">
              <label className="mb-2.5 flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.15em] text-outline">
                <Lock className="w-4 h-4 text-outline" />
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  autoComplete="current-password"
                  required
                  className="w-full bg-transparent p-0 pr-10 text-[17px] text-on-surface outline-none placeholder:text-outline/60"
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

            <div className="text-right">
              <button
                type="button"
                onClick={() => navigate("/forgot-password")}
                className="text-primary text-sm hover:underline"
              >
                Forgot password?
              </button>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full rounded-full bg-primary px-10 py-4 font-semibold tracking-wide text-primary-foreground shadow-xl transition-all duration-300 hover:bg-primary-dim active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isLoading ? "Signing In..." : "Sign In"}
            </button>
          </form>

          <div className="relative my-8">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-outline-variant/20" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-surface-container-lowest text-outline">or</span>
            </div>
          </div>

          <div className="text-center">
            <p className="text-on-surface-variant mb-4">Don&apos;t have an account?</p>
            <Link
              to="/sign-up"
              className="relative z-30 block w-full rounded-full border border-outline-variant/20 bg-surface-container-low px-10 py-4 text-center font-medium tracking-wide text-on-surface no-underline transition-all duration-300 hover:bg-surface-container active:scale-[0.98]"
            >
              Create Account
            </Link>
          </div>
        </div>
      </div>
    </AuthScreenLayout>
  );
}
