import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { ArrowLeft, Eye, EyeOff, Lock, Mail } from "lucide-react";
import { IdentityProviderButtons } from "../components/IdentityProviderButtons";
import { useAuth } from "../context/AuthContext";

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

  useEffect(() => {
    if (authStatus === "authenticated" && onboarding) {
      navigate(onboarding.completed ? "/home" : "/onboarding", { replace: true });
    }
  }, [authStatus, navigate, onboarding]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const session = await signIn(email, password);
      navigate(session.onboarding.completed ? "/home" : "/onboarding", { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Invalid email or password. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-surface via-background to-surface-container-low flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        <button
          onClick={() => navigate("/")}
          className="mb-8 flex items-center gap-2 text-on-surface-variant hover:text-on-surface transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>Back to Home</span>
        </button>

        <div className="bg-surface-container-lowest/70 backdrop-blur-xl border border-outline-variant/15 rounded-[40px] md:rounded-[60px] p-6 md:p-10 shadow-2xl">
          <div className="text-center mb-8">
            <h1 className="font-[family-name:var(--font-headline)] italic text-4xl md:text-5xl text-on-surface mb-3">
              Welcome Back
            </h1>
            <p className="text-on-surface-variant">
              Sign in to continue your journey with The Curator.
            </p>
          </div>

          {error && (
            <div className="mb-6 bg-error-container/50 border border-error text-on-error-container rounded-[30px] p-4 text-sm">
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
            <div>
              <label className="flex items-center gap-2 mb-2 text-on-surface text-sm font-medium">
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
                className="w-full bg-surface-container-lowest/50 border border-outline-variant/20 rounded-2xl px-5 py-4 text-on-surface text-[15px] focus:outline-none focus:ring-2 focus:ring-primary transition-all"
              />
            </div>

            <div>
              <label className="flex items-center gap-2 mb-2 text-on-surface text-sm font-medium">
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
              className="w-full bg-inverse-surface text-white py-5 px-10 rounded-full font-semibold tracking-wide shadow-xl hover:bg-zinc-800 transition-all duration-300 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
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
            <button
              onClick={() => navigate("/sign-up")}
              className="bg-surface-container-lowest/30 border border-outline-variant/15 text-on-surface py-4 px-10 rounded-full font-medium tracking-wide hover:bg-surface-container-low transition-all duration-300 active:scale-95"
            >
              Create Account
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
