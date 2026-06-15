import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router";
import confetti from "canvas-confetti";
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Check,
  Heart,
  Monitor,
  Moon,
  Sun,
  Zap,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useReadingPreferences } from "../context/ReadingPreferencesContext";
import { useTheme } from "../context/ThemeContext";
import { ProfileAvatar } from "../../ui/profile-avatar";
import {
  categoryOptions,
  defaultPreferences,
  onboardingStepOrder,
  type OnboardingStep,
  type TextSize,
  type UserPreferences,
} from "../../lib/types";
import { isDevBypassAuth } from "../../lib/dev-mode";
import { OnboardingCompletionShell, OnboardingShell } from "../../ui/onboarding-shell";
import { OnboardingPreview } from "../../ui/onboarding-preview";
import { PrimaryButton } from "../../ui/primary-button";

const onboardingSteps = onboardingStepOrder.filter(
  (step): step is Exclude<OnboardingStep, "complete"> => step !== "complete",
);

type VisualStep = (typeof onboardingSteps)[number];

const textSizeOptions = [
  { key: "compact" as const, label: "Compact", description: "Fast scanning" },
  { key: "comfortable" as const, label: "Comfortable", description: "Balanced" },
  { key: "large" as const, label: "Large", description: "More room" },
];

const welcomeFeatures = [
  {
    key: "narratives",
    title: "Synthesized narratives",
    description: "From global sources, shaped into one clear story.",
    Icon: BookOpen,
  },
  {
    key: "collections",
    title: "Save to collections",
    description: "Keep the stories that matter without losing your place.",
    Icon: Heart,
  },
  {
    key: "briefs",
    title: "Personalized briefs",
    description: "A calmer daily feed tuned to what you care about.",
    Icon: Zap,
  },
];

function getPreviousStep(step: VisualStep): VisualStep | null {
  const index = onboardingSteps.indexOf(step);
  if (index <= 0) return null;
  return onboardingSteps[index - 1];
}

function getStepCopy(step: VisualStep) {
  if (step === "account") {
    return {
      title: "Let's Get Acquainted",
      description: "Tell us how The Curator should address you across the app.",
    };
  }
  if (step === "categories") {
    return {
      title: "What Interests You?",
      description: "Select at least 3 topics to personalize your feed.",
    };
  }
  if (step === "appearance" || step === "notifications") {
    return {
      title: "Customize Your Experience",
      description: "Choose how you want to read The Curator.",
    };
  }
  return {
    title: "Shape Your Reading Ritual",
    description: "A few final choices before we drop you into home.",
  };
}

function textSizeToFontSize(size: TextSize): "small" | "medium" | "large" {
  if (size === "compact") return "small";
  if (size === "large") return "large";
  return "medium";
}

function previewStep(step: VisualStep): "account" | "categories" | "appearance" | "reading" {
  if (step === "notifications") return "appearance";
  if (step === "account" || step === "categories" || step === "appearance" || step === "reading") {
    return step;
  }
  return "account";
}

function SectionLabel({ children }: { children: string }) {
  return (
    <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-on-surface">{children}</p>
  );
}

function ValidationBanner({ tone, message }: { tone: "info" | "error"; message: string }) {
  return (
    <div
      className={`rounded-2xl border px-4 py-3 text-sm ${
        tone === "error"
          ? "border-error/30 bg-error-container/60 text-on-error-container"
          : "border-outline-variant/20 bg-surface-container-low text-on-surface-variant"
      }`}
    >
      {message}
    </div>
  );
}

function BottomNav({
  showSkip,
  onBack,
  onSkip,
  onContinue,
  continueDisabled,
  loading,
}: {
  showSkip: boolean;
  onBack?: () => void;
  onSkip?: () => void;
  onContinue: () => void;
  continueDisabled?: boolean;
  loading?: boolean;
}) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
      <div className="flex items-center gap-2 sm:shrink-0">
        {onBack ? (
          <button
            type="button"
            onClick={onBack}
            className="inline-flex items-center gap-2 rounded-full border border-outline-variant/20 bg-surface-container-lowest px-5 py-3.5 text-sm text-on-surface transition-colors hover:bg-surface-container"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </button>
        ) : null}
        {showSkip && onSkip ? (
          <button
            type="button"
            onClick={onSkip}
            className="rounded-full px-5 py-3.5 text-sm text-outline transition-colors hover:text-on-surface"
          >
            Skip
          </button>
        ) : null}
      </div>
      <div className="flex-1 sm:min-w-[200px]">
        <PrimaryButton
          label="Continue"
          loading={loading}
          disabled={continueDisabled}
          onClick={onContinue}
          icon={<ArrowRight className="h-5 w-5" />}
          className="!bg-primary !text-primary-foreground hover:!bg-primary-dim"
        />
      </div>
    </div>
  );
}

function SelectableCard({
  selected,
  onClick,
  children,
  className = "",
}: {
  selected: boolean;
  onClick: () => void;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`relative rounded-2xl border-[1.5px] text-left transition-all duration-200 ${
        selected
          ? "border-primary bg-primary text-primary-foreground shadow-md"
          : "border-outline-variant/20 bg-surface-container-lowest text-on-surface hover:border-primary/40 hover:bg-surface-container-low"
      } ${className}`}
    >
      {selected ? (
        <span className="absolute right-3 top-3 flex h-6 w-6 items-center justify-center rounded-full bg-white">
          <Check className="h-3.5 w-3.5 text-primary" strokeWidth={2.5} />
        </span>
      ) : null}
      {children}
    </button>
  );
}

function ToggleRow({
  title,
  description,
  checked,
  onChange,
}: {
  title: string;
  description: string;
  checked: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-2xl border border-outline-variant/15 bg-surface-container-lowest px-5 py-4">
      <div className="min-w-0">
        <p className="text-[15px] font-medium text-on-surface">{title}</p>
        <p className="mt-0.5 text-sm leading-relaxed text-on-surface-variant">{description}</p>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`relative h-8 w-14 shrink-0 rounded-full transition-colors ${
          checked ? "bg-primary" : "bg-outline-variant/50"
        }`}
      >
        <span
          className={`absolute top-1 h-6 w-6 rounded-full bg-white shadow-sm transition-transform ${
            checked ? "translate-x-7" : "translate-x-1"
          }`}
        />
      </button>
    </div>
  );
}

export function Onboarding() {
  const navigate = useNavigate();
  const { setTheme } = useTheme();
  const { setFontSize } = useReadingPreferences();
  const {
    authStatus,
    completeOnboarding,
    isLoading,
    onboarding,
    preferences: sessionPreferences,
    updateOnboardingCategories,
    updateOnboardingPreferences,
    updateOnboardingProfile,
    user,
  } = useAuth();

  const [displayName, setDisplayName] = useState(user?.name ?? "");
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [preferences, setPreferences] = useState<UserPreferences>(defaultPreferences);
  const [localStep, setLocalStep] = useState<VisualStep>("account");
  const [showCompletion, setShowCompletion] = useState(false);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [nameFocused, setNameFocused] = useState(false);

  const reduceMotion =
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const goToStep = (step: VisualStep) => setLocalStep(step);

  const stepCopy = useMemo(() => getStepCopy(localStep), [localStep]);
  const selectedCount = selectedCategories.length;

  const fallbackCategories = useMemo(() => {
    if (selectedCategories.length >= 3) return selectedCategories;
    if ((onboarding?.selectedCategories ?? []).length >= 3) {
      return onboarding?.selectedCategories ?? [];
    }
    return categoryOptions.slice(0, 3).map((category) => category.key);
  }, [onboarding?.selectedCategories, selectedCategories]);

  const validationMessage = useMemo(() => {
    if (localStep === "account" && !displayName.trim()) {
      return "Add the name you want to see across the app.";
    }
    if (localStep === "categories" && selectedCount < 3) {
      return `Select at least 3 categories. ${3 - selectedCount} to go.`;
    }
    return null;
  }, [displayName, localStep, selectedCount]);

  useEffect(() => {
    if (isDevBypassAuth) {
      navigate("/brief", { replace: true });
      return;
    }
    if (authStatus === "loading") return;
    if (authStatus === "unauthenticated") {
      navigate("/sign-up", { replace: true });
      return;
    }
    if (authStatus === "authenticated" && onboarding?.completed && !showCompletion) {
      navigate("/brief", { replace: true });
    }
  }, [authStatus, navigate, onboarding?.completed, showCompletion]);

  useEffect(() => {
    if (!user) return;
    setDisplayName(user.name ?? "");
  }, [user]);

  useEffect(() => {
    if (!sessionPreferences) return;
    setPreferences(sessionPreferences);
    setTheme(sessionPreferences.themePreference);
    setFontSize(textSizeToFontSize(sessionPreferences.textSize));
  }, [sessionPreferences, setFontSize, setTheme]);

  useEffect(() => {
    if (!onboarding || showCompletion) return;
    if (onboarding.completed) return;
    const serverStep = numberToVisualStep(onboarding.currentStep);
    if (serverStep !== "complete") setLocalStep(serverStep);
    setSelectedCategories(onboarding.selectedCategories);
  }, [onboarding, showCompletion]);

  useEffect(() => {
    if (!showCompletion || reduceMotion) return;
    void confetti({
      particleCount: 72,
      spread: 68,
      startVelocity: 34,
      origin: { y: 0.62 },
      colors: ["#5f5e5e", "#e7e2d7", "#31332b", "#efeee5"],
    });
  }, [reduceMotion, showCompletion]);

  const handleCategoryToggle = (categoryId: string) => {
    setSelectedCategories((current) =>
      current.includes(categoryId)
        ? current.filter((id) => id !== categoryId)
        : [...current, categoryId],
    );
    setError("");
  };

  const saveStep = async (step: VisualStep = localStep, opts?: { skip?: boolean }) => {
    setError("");
    setIsSubmitting(true);

    try {
      if (step === "account") {
        await updateOnboardingProfile({ displayName: displayName.trim() });
        goToStep("categories");
        return;
      }
      if (step === "categories") {
        const categories = opts?.skip ? fallbackCategories : selectedCategories;
        if (opts?.skip) setSelectedCategories(categories);
        await updateOnboardingCategories({ categories });
        goToStep("appearance");
        return;
      }
      if (step === "appearance" || step === "notifications") {
        await updateOnboardingPreferences(preferences, {
          skipNotifications: localStep === "appearance",
        });
        goToStep("reading");
        return;
      }
      await updateOnboardingPreferences(preferences);
      await completeOnboarding();
      setShowCompletion(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to save your progress right now.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBack = () => {
    setError("");
    if (localStep === "notifications") {
      goToStep("categories");
      return;
    }
    const previous = getPreviousStep(localStep);
    if (previous) goToStep(previous);
  };

  const applyThemeSelection = (theme: UserPreferences["themePreference"]) => {
    setPreferences((current) => ({ ...current, themePreference: theme }));
    setTheme(theme);
  };

  const applyTextSize = (textSize: TextSize) => {
    setPreferences((current) => ({ ...current, textSize }));
    setFontSize(textSizeToFontSize(textSize));
  };

  if (isLoading || authStatus !== "authenticated") {
    return (
      <div className="curator-shell flex min-h-[100dvh] items-center justify-center mesh-gradient p-6">
        <div className="editorial-card px-6 py-4 text-sm text-on-surface-variant">
          Preparing your setup…
        </div>
      </div>
    );
  }

  const completionName = displayName.trim() || user?.name?.trim() || "Reader";

  if (showCompletion) {
    return (
      <OnboardingCompletionShell>
        <div className="space-y-8 text-center">
          <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-full bg-primary">
            <Check className="h-12 w-12 text-primary-foreground" strokeWidth={2.5} />
          </div>
          <div className="space-y-2">
            <h1 className="font-[family-name:var(--font-headline)] text-4xl italic leading-tight text-on-surface sm:text-5xl">
              You&apos;re All Set!
            </h1>
            <p className="text-lg text-on-surface-variant">
              Welcome to The Curator, {completionName}
            </p>
          </div>

          <div className="grid gap-3 text-left sm:grid-cols-3">
            {welcomeFeatures.map(({ key, title, description, Icon }) => (
              <div key={key} className="editorial-card flex flex-col gap-3 p-5">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                  <Icon className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="font-medium text-on-surface">{title}</p>
                  <p className="mt-1 text-sm leading-relaxed text-on-surface-variant">
                    {description}
                  </p>
                </div>
              </div>
            ))}
          </div>

          <PrimaryButton
            label="Start reading"
            to="/brief"
            icon={<ArrowRight className="h-5 w-5" />}
            className="!bg-primary !text-primary-foreground hover:!bg-primary-dim"
          />
        </div>
      </OnboardingCompletionShell>
    );
  }

  const preview = (
    <OnboardingPreview
      step={previewStep(localStep)}
      displayName={displayName}
      selectedCategories={selectedCategories}
      preferences={preferences}
    />
  );

  const banners = (
    <>
      {error ? <ValidationBanner tone="error" message={error} /> : null}
      {validationMessage ? <ValidationBanner tone="info" message={validationMessage} /> : null}
    </>
  );

  const shellProps = {
    activeStep: previewStep(localStep),
    title: stepCopy.title,
    description: stepCopy.description,
    preview,
    banners: error || validationMessage ? banners : undefined,
  };

  if (localStep === "account") {
    return (
      <OnboardingShell
        {...shellProps}
        footer={
          <PrimaryButton
            label="Continue"
            loading={isSubmitting}
            disabled={Boolean(validationMessage)}
            onClick={() => void saveStep("account")}
            icon={<ArrowRight className="h-5 w-5" />}
            className="!bg-primary !text-primary-foreground hover:!bg-primary-dim sm:max-w-md"
          />
        }
      >
        <div className="grid max-w-3xl gap-8 lg:grid-cols-[auto_1fr] lg:items-start lg:gap-10">
          <div className="flex justify-center lg:justify-start">
            <ProfileAvatar
              avatarUrl={user?.profileImage}
              displayName={displayName}
              email={user?.email}
              size={112}
              className="border-[3px] border-outline-variant/25"
            />
          </div>

          <div className="space-y-5">
            <div className="space-y-2">
              <label className="text-[13px] font-medium tracking-wide text-on-surface">
                Display name
              </label>
              <input
                type="text"
                value={displayName}
                onChange={(event) => {
                  setError("");
                  setDisplayName(event.target.value);
                }}
                onFocus={() => setNameFocused(true)}
                onBlur={() => setNameFocused(false)}
                placeholder="How should Curator address you?"
                autoComplete="name"
                maxLength={60}
                className={`search-hero-input w-full px-6 py-4 text-base transition-colors ${
                  nameFocused ? "border-primary/40" : ""
                }`}
              />
            </div>

            <p className="rounded-2xl border border-outline-variant/15 bg-surface-container-lowest px-4 py-3.5 text-sm leading-relaxed text-on-surface-variant">
              You can refine this later from your account screen. For now, keep it simple and
              recognizable.
            </p>
          </div>
        </div>
      </OnboardingShell>
    );
  }

  if (localStep === "categories") {
    return (
      <OnboardingShell
        {...shellProps}
        footer={
          <BottomNav
            showSkip
            onBack={handleBack}
            onSkip={() => void saveStep("categories", { skip: true })}
            onContinue={() => void saveStep("categories")}
            continueDisabled={Boolean(validationMessage)}
            loading={isSubmitting}
          />
        }
      >
        <div className="max-w-4xl space-y-4">
          <p className="text-center text-sm text-outline lg:text-left">
            {selectedCount} selected · pick at least 3
          </p>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 lg:gap-4">
            {categoryOptions.map((category) => {
              const isSelected = selectedCategories.includes(category.key);
              return (
                <SelectableCard
                  key={category.key}
                  selected={isSelected}
                  onClick={() => handleCategoryToggle(category.key)}
                  className="flex min-h-[120px] flex-col items-center justify-center p-5 sm:min-h-[132px]"
                >
                  <span className="mb-2 text-3xl sm:text-4xl">{category.emoji}</span>
                  <span className="text-sm font-medium">{category.label}</span>
                </SelectableCard>
              );
            })}
          </div>
        </div>
      </OnboardingShell>
    );
  }

  if (localStep === "appearance" || localStep === "notifications") {
    return (
      <OnboardingShell
        {...shellProps}
        footer={
          <BottomNav
            showSkip
            onBack={handleBack}
            onSkip={() => void saveStep(localStep)}
            onContinue={() => void saveStep(localStep)}
            loading={isSubmitting}
          />
        }
      >
        <div className="grid max-w-5xl gap-8 lg:grid-cols-2 lg:gap-10">
          <div className="space-y-4">
            <SectionLabel>Appearance</SectionLabel>
            <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1 xl:grid-cols-3">
              {[
                { value: "light" as const, icon: Sun, label: "Light", desc: "Bright & crisp" },
                { value: "dark" as const, icon: Moon, label: "Dark", desc: "Easy on eyes" },
                { value: "system" as const, icon: Monitor, label: "Auto", desc: "Match device" },
              ].map((themeOption) => {
                const Icon = themeOption.icon;
                const isSelected = preferences.themePreference === themeOption.value;
                return (
                  <SelectableCard
                    key={themeOption.value}
                    selected={isSelected}
                    onClick={() => applyThemeSelection(themeOption.value)}
                    className="p-5"
                  >
                    <Icon className={`mb-3 h-7 w-7 ${isSelected ? "" : "text-primary"}`} />
                    <p className="text-base font-medium">{themeOption.label}</p>
                    <p className={`mt-1 text-sm ${isSelected ? "opacity-80" : "text-outline"}`}>
                      {themeOption.desc}
                    </p>
                  </SelectableCard>
                );
              })}
            </div>
          </div>

          <div className="space-y-4">
            <SectionLabel>Notification cadence</SectionLabel>
            <div className="grid grid-cols-2 gap-3">
              {[
                { value: "daily" as const, label: "Daily brief" },
                { value: "breaking" as const, label: "Breaking news" },
                { value: "weekly" as const, label: "Weekly digest" },
                { value: "none" as const, label: "None" },
              ].map((option) => (
                <SelectableCard
                  key={option.value}
                  selected={preferences.notificationFrequency === option.value}
                  onClick={() =>
                    setPreferences((current) => ({
                      ...current,
                      notificationFrequency: option.value,
                    }))
                  }
                  className="px-4 py-3.5 text-center text-sm font-medium"
                >
                  {option.label}
                </SelectableCard>
              ))}
            </div>

            <div className="space-y-3 pt-2">
              <ToggleRow
                title="Allow push when we're ready"
                description="Save your preference now. The browser permission prompt can come later."
                checked={preferences.pushEnabled}
                onChange={(value) =>
                  setPreferences((current) => ({ ...current, pushEnabled: value }))
                }
              />
              <ToggleRow
                title="Email digest backup"
                description="Keep a written version of your preferred cadence in your inbox."
                checked={preferences.emailDigestEnabled}
                onChange={(value) =>
                  setPreferences((current) => ({ ...current, emailDigestEnabled: value }))
                }
              />
            </div>
          </div>
        </div>
      </OnboardingShell>
    );
  }

  return (
    <OnboardingShell
      {...shellProps}
      footer={
        <BottomNav
          showSkip={false}
          onBack={handleBack}
          onContinue={() => void saveStep("reading")}
          loading={isSubmitting}
        />
      }
    >
      <div className="grid max-w-5xl gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)] lg:gap-10">
        <div className="space-y-5">
          <div className="space-y-3">
            <SectionLabel>Text size</SectionLabel>
            <div className="grid grid-cols-3 gap-3">
              {textSizeOptions.map((option) => (
                <SelectableCard
                  key={option.key}
                  selected={preferences.textSize === option.key}
                  onClick={() => applyTextSize(option.key)}
                  className="px-3 py-4 text-center"
                >
                  <p className="text-sm font-medium">{option.label}</p>
                  <p className={`mt-1 text-xs ${preferences.textSize === option.key ? "opacity-80" : "text-outline"}`}>
                    {option.description}
                  </p>
                </SelectableCard>
              ))}
            </div>
          </div>

          <ToggleRow
            title="Auto-save worthy stories"
            description="Save article state automatically so the app feels resilient across sessions."
            checked={preferences.autoSaveEnabled}
            onChange={(value) =>
              setPreferences((current) => ({ ...current, autoSaveEnabled: value }))
            }
          />
          <ToggleRow
            title="Reduce motion"
            description="Tone down transitions and keep motion subtle across the app."
            checked={preferences.reduceMotionEnabled}
            onChange={(value) =>
              setPreferences((current) => ({ ...current, reduceMotionEnabled: value }))
            }
          />
        </div>

        <div className="space-y-3">
          <SectionLabel>What you&apos;re unlocking</SectionLabel>
          {welcomeFeatures.map(({ key, title, description, Icon }) => (
            <div key={key} className="editorial-card flex items-start gap-4 p-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10">
                <Icon className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="font-medium text-on-surface">{title}</p>
                <p className="mt-0.5 text-sm leading-relaxed text-on-surface-variant">
                  {description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </OnboardingShell>
  );
}

function numberToVisualStep(step: number): VisualStep {
  const mapped = onboardingSteps[Math.max(0, Math.min(step - 1, onboardingSteps.length - 1))];
  return mapped ?? "account";
}
