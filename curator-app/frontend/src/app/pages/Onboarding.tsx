import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router";
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Check,
  Heart,
  Monitor,
  Moon,
  Sun,
  Zap
} from "lucide-react";
import { IdentityProviderButtons } from "../components/IdentityProviderButtons";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";

const categories = [
  { id: "technology", label: "Technology", emoji: "💻" },
  { id: "politics", label: "Politics", emoji: "🏛️" },
  { id: "business", label: "Business", emoji: "📈" },
  { id: "science", label: "Science", emoji: "🔬" },
  { id: "culture", label: "Culture", emoji: "🎭" },
  { id: "climate", label: "Climate", emoji: "🌍" },
  { id: "health", label: "Health", emoji: "⚕️" },
  { id: "sports", label: "Sports", emoji: "⚽" },
] as const;

type NotificationFrequency = "daily" | "breaking" | "weekly" | "none";
type ThemePreference = "light" | "dark" | "system";

export function Onboarding() {
  const navigate = useNavigate();
  const {
    authStatus,
    completeOnboarding,
    isAuthenticated,
    isLoading,
    onboarding,
    providerAvailability,
    saveOnboarding,
    signUp,
    user,
  } = useAuth();
  const { setTheme } = useTheme();

  const [step, setStep] = useState(1);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedTheme, setSelectedTheme] = useState<ThemePreference>("system");
  const [notificationFrequency, setNotificationFrequency] =
    useState<NotificationFrequency>("daily");
  const [autoSave, setAutoSave] = useState(true);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const showIdentityProviders =
    providerAvailability.entra && (providerAvailability.google || providerAvailability.apple);

  const selectedCountLabel = useMemo(() => {
    if (selectedCategories.length >= 3) {
      return `${selectedCategories.length} selected`;
    }

    return `Select ${3 - selectedCategories.length} more`;
  }, [selectedCategories]);

  useEffect(() => {
    // Do not route without permission:
    // if (authStatus === "authenticated" && onboarding?.completed) {
    //   navigate("/home", { replace: true });
    //   return;
    // }

    if (authStatus === "authenticated" && onboarding) {
      setStep(Math.max(2, onboarding.currentStep));
      setSelectedCategories(onboarding.selectedCategories);
      setSelectedTheme(onboarding.themePreference);
      setNotificationFrequency(onboarding.notificationPreference);
      setAutoSave(onboarding.autoSaveEnabled);
      setTheme(onboarding.themePreference);
    }
  }, [authStatus, navigate, onboarding, setTheme]);

  const handleCategoryToggle = (categoryId: string) => {
    setSelectedCategories((current) =>
      current.includes(categoryId)
        ? current.filter((id) => id !== categoryId)
        : [...current, categoryId],
    );
    setError("");
  };

  const handleAccountStep = async () => {
    if (!email || !password) {
      setError("Enter your email and password to continue.");
      return;
    }

    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }

    setIsSubmitting(true);
    setError("");

    try {
      await signUp("", email, password);
      setStep(2);
      navigate("/onboarding", { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to create your account right now.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInterestStep = async () => {
    if (selectedCategories.length < 3) {
      setError("Pick at least 3 topics so we can personalize your feed.");
      return;
    }

    setIsSubmitting(true);
    setError("");

    try {
      if (isAuthenticated) {
        await saveOnboarding({
          currentStep: 3,
          selectedCategories,
        });
      }
      setStep(3);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to save your interests right now.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSkipInterest = async () => {
    setError("");
    if (isAuthenticated) {
      try {
        await saveOnboarding({
          currentStep: 3,
          selectedCategories,
        });
      } catch (err) {
        console.error(err);
      }
    }
    setStep(3);
  };

  const handlePreferenceStep = async () => {
    setIsSubmitting(true);
    setError("");

    try {
      if (isAuthenticated) {
        await saveOnboarding({
          currentStep: 4,
          themePreference: selectedTheme,
          notificationPreference: notificationFrequency,
          autoSaveEnabled: autoSave,
        });
      }
      setTheme(selectedTheme);
      setStep(4);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Unable to save your preferences right now.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSkipPreference = async () => {
    setError("");
    setTheme(selectedTheme);
    if (isAuthenticated) {
      try {
        await saveOnboarding({
          currentStep: 4,
          themePreference: selectedTheme,
          notificationPreference: notificationFrequency,
          autoSaveEnabled: autoSave,
        });
      } catch (err) {
        console.error(err);
      }
    }
    setStep(4);
  };

  const handleComplete = async () => {
    setIsSubmitting(true);
    setError("");

    try {
      if (isAuthenticated) {
        await completeOnboarding();
      }
      // do not route without permission
      // navigate("/home", { replace: true });
      console.log('Would navigate to /home');
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to complete onboarding right now.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleNext = async () => {
    if (step === 1) {
      await handleAccountStep();
      return;
    }

    if (step === 2) {
      await handleInterestStep();
      return;
    }

    if (step === 3) {
      await handlePreferenceStep();
      return;
    }

    await handleComplete();
  };

  const handleBack = async () => {
    if (step <= 2) {
      return;
    }

    const previousStep = step - 1;
    setStep(previousStep);
    setError("");

    if (isAuthenticated) {
      try {
        await saveOnboarding({ currentStep: previousStep });
      } catch {
        // Keep the local step change responsive even if the network call fails.
      }
    }
  };

  const applyThemeSelection = (theme: ThemePreference) => {
    setSelectedTheme(theme);
    setTheme(theme);
  };

  if (isLoading) {
    return (
      <div className="min-h-[100dvh] bg-gradient-to-br from-surface via-background to-surface-container-low flex items-center justify-center p-6">
        <div className="rounded-full border border-outline-variant/15 bg-surface-container-lowest/80 px-6 py-4 text-sm text-on-surface-variant">
          Restoring your onboarding...
        </div>
      </div>
    );
  }

  /* ─── Bottom navigation bar (shared across steps 2, 3) ─── */
  const bottomNav = (
    onBack: () => void,
    onSkip: () => void,
    onContinue: () => void,
    disabled: boolean,
  ) => (
    <div className="flex items-center gap-3 pt-4 pb-2 mt-auto">
      <button
        onClick={onBack}
        className="px-6 py-4 rounded-full border-2 border-outline-variant/20 text-on-surface hover:bg-surface-container transition-all flex items-center gap-2 text-[15px]"
      >
        <ArrowLeft className="w-5 h-5" />
        Back
      </button>
      <button
        onClick={onSkip}
        className="px-6 py-4 rounded-full text-outline hover:text-on-surface transition-all text-[15px]"
      >
        Skip
      </button>
      <button
        onClick={onContinue}
        disabled={disabled}
        className="flex-1 bg-primary hover:bg-primary-dim text-primary-foreground py-4 px-8 rounded-full font-semibold tracking-wide shadow-xl transition-all duration-300 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 group text-[15px]"
      >
        Continue
        <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
      </button>
    </div>
  );

  return (
    <div className="min-h-[100dvh] bg-gradient-to-br from-surface via-background to-surface-container-low transition-colors duration-300">
      <div className="min-h-[100dvh] flex flex-col px-[5%] py-[4%] md:px-12 md:py-8">
        {/* ─── Progress bar ─── */}
        <div className="w-full max-w-2xl mx-auto mb-6">
          <div className="flex items-center gap-2 mb-1.5">
            {[1, 2, 3, 4].map((num) => (
              <div key={num} className="flex-1 h-1.5 rounded-full overflow-hidden bg-surface-container">
                <div
                  className={`h-full transition-all duration-500 ${
                    num <= step ? "bg-primary w-full" : "bg-transparent w-0"
                  }`}
                />
              </div>
            ))}
          </div>
          <p className="text-xs text-outline text-right">Step {step} of 4</p>
        </div>

        {/* ─── Main content ─── */}
        <div className="flex-1 w-full max-w-2xl mx-auto flex flex-col">
          {error && (
            <div className="mb-4 rounded-2xl border border-error/30 bg-error-container/60 px-4 py-3 text-sm text-on-error-container">
              {error}
            </div>
          )}

          {/* ════════════════  STEP 1 — Account  ════════════════ */}
          {step === 1 && (
            <div className="flex-1 flex flex-col justify-center space-y-6 animate-fade-in">
              <div className="text-center space-y-2">
                <h1 className="font-[family-name:var(--font-headline)] italic text-[clamp(2rem,8vw,3.5rem)] text-on-surface leading-tight">
                  Create Your Account
                </h1>
                <p className="text-outline text-[clamp(0.875rem,2.5vw,1.125rem)]">
                  Join thoughtful readers in a calmer, smarter news experience.
                </p>
              </div>

              {showIdentityProviders && (
                <div className="space-y-4">
                  <IdentityProviderButtons mode="signup" />
                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-outline-variant/20" />
                    </div>
                    <div className="relative flex justify-center text-sm">
                      <span className="px-4 bg-background text-outline">or create with email</span>
                    </div>
                  </div>
                </div>
              )}

              <div className="space-y-3">
                <div>
                  <label className="block text-on-surface mb-1.5 text-sm font-medium">
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="your@email.com"
                    autoComplete="email"
                    required
                    className="w-full bg-input-background border border-outline-variant/20 rounded-full px-5 py-3.5 text-on-surface placeholder:text-outline focus:outline-none focus:ring-2 focus:ring-primary transition-all text-[15px]"
                  />
                </div>

                <div>
                  <label className="block text-on-surface mb-1.5 text-sm font-medium">Password</label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="At least 8 characters"
                    autoComplete="new-password"
                    required
                    className="w-full bg-input-background border border-outline-variant/20 rounded-full px-5 py-3.5 text-on-surface placeholder:text-outline focus:outline-none focus:ring-2 focus:ring-primary transition-all text-[15px]"
                  />
                </div>
              </div>

              <button
                onClick={() => void handleNext()}
                disabled={isSubmitting}
                className="w-full bg-primary hover:bg-primary-dim text-primary-foreground py-4 px-10 rounded-full font-semibold tracking-wide shadow-xl transition-all duration-300 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 group text-[15px]"
              >
                {isSubmitting ? "Creating Account..." : "Continue"}
                {!isSubmitting && <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />}
              </button>
            </div>
          )}

          {/* ════════════════  STEP 2 — Interests  ════════════════ */}
          {step === 2 && (
            <div className="flex-1 flex flex-col animate-fade-in">
              <div className="text-center space-y-2 mb-5">
                <h1 className="font-[family-name:var(--font-headline)] italic text-[clamp(2rem,8vw,3.5rem)] text-on-surface leading-tight">
                  What Interests You?
                </h1>
                <p className="text-outline text-[clamp(0.875rem,2.5vw,1.125rem)]">
                  Select at least 3 topics to personalize your feed
                </p>
              </div>

              {/* Category grid — 2 cols, aspect-ratio based so it scales on any phone */}
              <div className="grid grid-cols-2 gap-[3%] flex-1 content-center">
                {categories.map((category) => {
                  const isSelected = selectedCategories.includes(category.id);

                  return (
                    <button
                      key={category.id}
                      onClick={() => handleCategoryToggle(category.id)}
                      className={`relative flex flex-col items-center justify-center rounded-2xl sm:rounded-3xl transition-all duration-300 py-[12%] ${
                        isSelected
                          ? "bg-primary border-2 border-primary shadow-lg scale-[1.03]"
                          : "bg-surface-container-lowest border-2 border-outline-variant/20 hover:border-primary/50 hover:scale-[1.02]"
                      }`}
                    >
                      {isSelected && (
                        <div className="absolute top-2 right-2 w-6 h-6 bg-white rounded-full flex items-center justify-center">
                          <Check className="w-4 h-4 text-primary" />
                        </div>
                      )}

                      <div className="text-[clamp(2rem,7vw,3rem)] mb-2">{category.emoji}</div>
                      <div
                        className={`text-sm font-medium ${
                          isSelected ? "text-primary-foreground" : "text-on-surface"
                        }`}
                      >
                        {category.label}
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Bottom nav */}
              {bottomNav(
                () => authStatus !== "authenticated" ? navigate("/") : undefined,
                () => void handleSkipInterest(),
                () => void handleNext(),
                isSubmitting || selectedCategories.length < 3,
              )}
            </div>
          )}

          {/* ════════════════  STEP 3 — Preferences  ════════════════ */}
          {step === 3 && (
            <div className="flex-1 flex flex-col animate-fade-in">
              <div className="text-center space-y-2 mb-5">
                <h1 className="font-[family-name:var(--font-headline)] italic text-[clamp(2rem,8vw,3.5rem)] text-on-surface leading-tight">
                  Customize Your Experience
                </h1>
                <p className="text-outline text-[clamp(0.875rem,2.5vw,1.125rem)]">
                  Choose how you want to read The Curator
                </p>
              </div>

              <div className="flex-1 flex flex-col gap-5 overflow-y-auto">
                {/* Theme — vertical stack matching Figma */}
                <div className="space-y-3">
                  {[
                    { value: "light" as const, icon: Sun, label: "Light", desc: "Bright & crisp" },
                    { value: "dark" as const, icon: Moon, label: "Dark", desc: "Easy on eyes" },
                    {
                      value: "system" as const,
                      icon: Monitor,
                      label: "Auto",
                      desc: "Match device",
                    },
                  ].map((themeOption) => {
                    const Icon = themeOption.icon;
                    const isSelected = selectedTheme === themeOption.value;

                    return (
                      <button
                        key={themeOption.value}
                        onClick={() => applyThemeSelection(themeOption.value)}
                        className={`relative w-full p-5 rounded-2xl sm:rounded-3xl border-2 transition-all duration-300 ${
                          isSelected
                            ? "bg-primary border-primary shadow-lg scale-[1.02]"
                            : "bg-surface-container-lowest border-outline-variant/20 hover:border-primary/50"
                        }`}
                      >
                        {isSelected && (
                          <div className="absolute top-4 right-4 w-6 h-6 bg-white rounded-full flex items-center justify-center">
                            <Check className="w-4 h-4 text-primary" />
                          </div>
                        )}
                        <Icon
                          className={`w-7 h-7 mb-2 ${
                            isSelected ? "text-primary-foreground" : "text-primary"
                          }`}
                        />
                        <div
                          className={`text-lg font-medium mb-0.5 text-center ${
                            isSelected ? "text-primary-foreground" : "text-on-surface"
                          }`}
                        >
                          {themeOption.label}
                        </div>
                        <div
                          className={`text-sm text-center ${
                            isSelected ? "text-primary-foreground/80" : "text-outline"
                          }`}
                        >
                          {themeOption.desc}
                        </div>
                      </button>
                    );
                  })}
                </div>

                {/* Notifications */}
                <div className="space-y-3">
                  <h3 className="text-on-surface font-medium text-sm uppercase tracking-wider">
                    Notifications
                  </h3>
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { value: "daily" as const, label: "Daily Brief" },
                      { value: "breaking" as const, label: "Breaking News" },
                      { value: "weekly" as const, label: "Weekly Digest" },
                      { value: "none" as const, label: "None" },
                    ].map((option) => (
                      <button
                        key={option.value}
                        onClick={() => setNotificationFrequency(option.value)}
                        className={`py-3.5 px-4 rounded-2xl border-2 transition-all text-sm font-medium ${
                          notificationFrequency === option.value
                            ? "bg-primary border-primary text-primary-foreground"
                            : "bg-surface-container-lowest border-outline-variant/20 text-on-surface hover:border-primary/50"
                        }`}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Auto-save */}
                <div className="flex items-center justify-between p-5 bg-surface-container-lowest rounded-2xl sm:rounded-3xl border border-outline-variant/20">
                  <div>
                    <div className="text-on-surface font-medium mb-0.5">Auto-save articles</div>
                    <div className="text-outline text-sm">
                      Automatically save articles you read
                    </div>
                  </div>
                  <button
                    onClick={() => setAutoSave((current) => !current)}
                    className={`w-14 h-8 rounded-full transition-all relative shrink-0 ml-4 ${autoSave ? "bg-primary" : "bg-outline-variant"}`}
                  >
                    <div
                      className={`w-6 h-6 bg-white rounded-full transition-all absolute top-1 ${
                        autoSave ? "translate-x-7" : "translate-x-1"
                      }`}
                    />
                  </button>
                </div>
              </div>

              {/* Bottom nav */}
              {bottomNav(
                () => void handleBack(),
                () => void handleSkipPreference(),
                () => void handleNext(),
                isSubmitting,
              )}
            </div>
          )}

          {/* ════════════════  STEP 4 — All Set  ════════════════ */}
          {step === 4 && (
            <div className="flex-1 flex flex-col justify-center space-y-8 animate-fade-in">
              <div className="text-center space-y-6">
                <div className="w-24 h-24 mx-auto bg-primary rounded-full flex items-center justify-center">
                  <Check className="w-12 h-12 text-primary-foreground" />
                </div>

                <div>
                  <h1 className="font-[family-name:var(--font-headline)] italic text-[clamp(2rem,8vw,3.5rem)] text-on-surface mb-3 leading-tight">
                    You&apos;re All Set!
                  </h1>
                  <p className="text-outline text-[clamp(0.875rem,2.5vw,1.125rem)]">
                    Welcome to The Curator, {(user?.name || email.split("@")[0] || "Reader").replace(/[._-]+/g, " ")}
                  </p>
                </div>
              </div>

              <div className="space-y-3 max-w-md mx-auto w-full">
                <div className="flex items-start gap-4 p-4 bg-surface-container-lowest/50 backdrop-blur-xl rounded-2xl border border-outline-variant/20">
                  <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center shrink-0">
                    <BookOpen className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <div className="text-on-surface font-medium mb-0.5 text-[15px]">Synthesized Narratives</div>
                    <div className="text-outline text-sm">From 100+ trusted sources worldwide</div>
                  </div>
                </div>

                <div className="flex items-start gap-4 p-4 bg-surface-container-lowest/50 backdrop-blur-xl rounded-2xl border border-outline-variant/20">
                  <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center shrink-0">
                    <Heart className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <div className="text-on-surface font-medium mb-0.5 text-[15px]">Save to Collections</div>
                    <div className="text-outline text-sm">Organize articles that matter to you</div>
                  </div>
                </div>

                <div className="flex items-start gap-4 p-4 bg-surface-container-lowest/50 backdrop-blur-xl rounded-2xl border border-outline-variant/20">
                  <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center shrink-0">
                    <Zap className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <div className="text-on-surface font-medium mb-0.5 text-[15px]">Personalized Briefs</div>
                    <div className="text-outline text-sm">Daily insights tailored to your interests</div>
                  </div>
                </div>
              </div>

              <button
                onClick={() => void handleNext()}
                disabled={isSubmitting}
                className="w-full max-w-md mx-auto bg-primary hover:bg-primary-dim text-primary-foreground py-4 px-10 rounded-full font-semibold tracking-wide shadow-xl transition-all duration-300 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 group text-[15px]"
              >
                {isSubmitting ? "Finishing..." : "Start Reading"}
                {!isSubmitting && <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
