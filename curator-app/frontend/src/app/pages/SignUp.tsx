import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router";
import { ArrowLeft, ArrowRight, User } from "lucide-react";
import { IdentityProviderButtons } from "../components/IdentityProviderButtons";
import { useAuth } from "../context/AuthContext";
import { isDevBypassAuth } from "../../lib/dev-mode";
import { AuthScreenLayout } from "../../ui/auth-screen-layout";
import { PrimaryButton } from "../../ui/primary-button";

export function SignUp() {
  const navigate = useNavigate();
  const { authStatus, onboarding, providerAvailability, signUp } = useAuth();
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const showIdentityProviders =
    !isDevBypassAuth &&
    providerAvailability.entra &&
    (providerAvailability.google || providerAvailability.apple);

  const onboardingComplete = onboarding?.completed ?? false;

  useEffect(() => {
    if (authStatus === "loading") return;

    if (isDevBypassAuth) {
      navigate("/brief", { replace: true });
      return;
    }

    if (authStatus === "authenticated") {
      navigate(onboardingComplete ? "/brief" : "/onboarding", { replace: true });
    }
  }, [authStatus, navigate, onboardingComplete]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!email || !password) {
      setError("Enter your email and password to continue.");
      return;
    }

    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }

    if (!agreedToTerms) {
      setError("Agree to the Privacy Policy and Terms of Service to continue.");
      return;
    }

    setIsSubmitting(true);
    setError("");

    try {
      await signUp(displayName, email, password);
      navigate("/onboarding", { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to create your account right now.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AuthScreenLayout>
      <div className="flex flex-col px-6 py-6 lg:px-0 lg:py-0">
        <Link
          to="/welcome"
          className="relative z-30 mb-6 flex w-fit items-center gap-2 rounded-full border border-outline-variant/20 bg-surface-container-lowest/80 px-4 py-2 text-sm text-on-surface-variant no-underline shadow-sm transition-colors hover:bg-surface-container hover:text-on-surface"
        >
          <ArrowLeft className="h-5 w-5" />
          Back
        </Link>

        <div className="editorial-card space-y-6 p-7 md:p-9">
            <div className="space-y-2 text-center">
              <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-outline">
                Create account
              </p>
              <h1 className="font-[family-name:var(--font-headline)] text-[clamp(2rem,8vw,3rem)] italic leading-tight text-on-surface">
                Join The Curator
              </h1>
              <p className="text-[clamp(0.875rem,2.5vw,1.05rem)] text-on-surface-variant">
                Create your account, then we&apos;ll tailor your experience.
              </p>
            </div>

            {error && (
              <div className="rounded-2xl border border-error/30 bg-error-container/60 px-4 py-3 text-sm text-on-error-container">
                {error}
              </div>
            )}

            {showIdentityProviders && (
              <div className="space-y-4">
                <IdentityProviderButtons mode="signup" />
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-outline-variant/20" />
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="bg-surface-container-lowest px-4 text-outline">
                      or create with email
                    </span>
                  </div>
                </div>
              </div>
            )}

            <form onSubmit={(event) => void handleSubmit(event)} className="space-y-3">
              <div>
                <label className="mb-1.5 flex items-center gap-2 text-sm font-medium text-on-surface">
                  <User className="h-4 w-4 text-outline" />
                  Display name
                </label>
                <input
                  type="text"
                  value={displayName}
                  onChange={(event) => setDisplayName(event.target.value)}
                  placeholder="Optional"
                  autoComplete="name"
                  maxLength={60}
                  className="search-hero-input w-full"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-on-surface">
                  Email address
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="your@email.com"
                  autoComplete="email"
                  required
                  className="search-hero-input w-full"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-on-surface">Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="At least 8 characters"
                  autoComplete="new-password"
                  required
                  className="search-hero-input w-full"
                />
              </div>

              <label className="flex cursor-pointer items-start gap-3 text-sm text-on-surface-variant">
                <input
                  type="checkbox"
                  checked={agreedToTerms}
                  onChange={(event) => setAgreedToTerms(event.target.checked)}
                  className="mt-0.5 h-5 w-5 rounded-md accent-primary"
                />
                <span>
                  I agree to the{" "}
                  <a className="font-semibold text-primary hover:underline" href="/privacy">
                    Privacy Policy
                  </a>{" "}
                  and{" "}
                  <a className="font-semibold text-primary hover:underline" href="/terms">
                    Terms of Service
                  </a>
                  .
                </span>
              </label>

              <PrimaryButton
                type="submit"
                label="Continue"
                loading={isSubmitting}
                disabled={!agreedToTerms}
                icon={!isSubmitting ? <ArrowRight className="h-5 w-5" /> : undefined}
              />
            </form>

            <p className="text-center text-sm text-on-surface-variant">
              Already have an account?{" "}
              <Link to="/sign-in" className="font-semibold text-primary hover:underline">
                Sign in
              </Link>
            </p>
          </div>
      </div>
    </AuthScreenLayout>
  );
}
