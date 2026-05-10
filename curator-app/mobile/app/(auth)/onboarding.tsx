import { BlurView } from "expo-blur";
import * as Haptics from "expo-haptics";
import { Redirect, useRouter } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { Pressable, Text, TextInput, useWindowDimensions, View } from "react-native";
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
} from "lucide-react-native";
import Animated, {
  FadeIn,
  interpolateColor,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import { spring } from "../../src/ui/tokens/motion";
import { type } from "../../src/ui/tokens/typography";

import {
  categoryOptions,
  defaultPreferences,
  onboardingStepOrder,
  type OnboardingStep,
  type UserPreferences,
} from "../../src/lib/types";
import { useAuth } from "../../src/providers/auth-provider";
import { useTheme } from "../../src/providers/theme-provider";
import { LoadingScreen } from "../../src/ui/loading-screen";
import { PrimaryButton } from "../../src/ui/primary-button";
import { Screen } from "../../src/ui/screen";

const onboardingSteps = onboardingStepOrder.filter(
  (step): step is Exclude<OnboardingStep, "complete"> => step !== "complete",
);

type VisualStep = (typeof onboardingSteps)[number];

// ─── Static data ───────────────────────────────────────────

const categoryEmojiByKey: Record<string, string> = {
  world: "🌍",
  business: "📈",
  technology: "💻",
  science: "🔬",
  culture: "🎭",
  design: "✦",
  climate: "🌿",
  policy: "🏛️",
  sport: "⚽",
};

const themeOptions = [
  { value: "light" as const, label: "Light", description: "Bright & crisp", Icon: Sun },
  { value: "dark" as const, label: "Dark", description: "Easy on eyes", Icon: Moon },
  { value: "system" as const, label: "Auto", description: "Match device", Icon: Monitor },
];

const notificationOptions = [
  { key: "daily" as const, label: "Daily brief" },
  { key: "breaking" as const, label: "Breaking news" },
  { key: "weekly" as const, label: "Weekly digest" },
  { key: "none" as const, label: "None" },
];

const textSizeOptions = [
  { key: "compact" as const, label: "Compact", description: "Fast scanning" },
  { key: "comfortable" as const, label: "Comfortable", description: "Balanced" },
  { key: "large" as const, label: "Large", description: "More room" },
];

const welcomeFeatures = [
  { key: "narratives", title: "Synthesized narratives", description: "From global sources, shaped into one clear story.", Icon: BookOpen },
  { key: "collections", title: "Save to collections", description: "Keep the stories that matter without losing your place.", Icon: Heart },
  { key: "briefs", title: "Personalized briefs", description: "A calmer daily feed tuned to what you care about.", Icon: Zap },
];

// ─── Visual step mapping (appearance + notifications share slot) ───

const visualStepKeys = ["account", "categories", "appearance", "reading"] as const;

function getVisualIndex(step: VisualStep): number {
  if (step === "notifications") return 2;
  return visualStepKeys.indexOf(step as (typeof visualStepKeys)[number]);
}

function getPreviousStep(step: VisualStep): VisualStep | null {
  const index = onboardingSteps.indexOf(step);
  if (index <= 0) return null;
  return onboardingSteps[index - 1];
}

function getStepCopy(step: VisualStep) {
  if (step === "account") return { title: "Let's Get Acquainted", description: "Tell us how The Curator should address you across the app." };
  if (step === "categories") return { title: "What Interests You?", description: "Select at least 3 topics to personalize your feed." };
  if (step === "appearance" || step === "notifications") return { title: "Customize Your Experience", description: "Choose how you want to read The Curator." };
  return { title: "Shape Your Reading Ritual", description: "A few final choices before we drop you into home." };
}

// ─── Border helpers ───────────────────────────────────────

const BORDER_SUBTLE = "33"; // 20% opacity — matches Figma's /20

// ─── Components ──────────────────────────────────────────

function ProgressSegment({ filled }: { filled: boolean }) {
  const { palette } = useTheme();
  const progress = useSharedValue(filled ? 1 : 0);

  useEffect(() => {
    progress.value = withTiming(filled ? 1 : 0, { duration: 400 });
  }, [filled, progress]);

  const animatedStyle = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(
      progress.value,
      [0, 1],
      [palette.surfaceContainerHigh, palette.primary],
    ),
  }));

  return <Animated.View style={[{ flex: 1, height: 4, borderRadius: 2 }, animatedStyle]} />;
}

function ProgressBar({ activeStep }: { activeStep: VisualStep }) {
  const { palette } = useTheme();
  const activeIndex = getVisualIndex(activeStep);

  return (
    <View style={{ gap: 8 }}>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
        {visualStepKeys.map((step, index) => (
          <ProgressSegment key={step} filled={index <= activeIndex} />
        ))}
      </View>
      <Text style={[type.labelSm, { fontFamily: "Manrope_400Regular", textAlign: "right", color: palette.outline }]}>
        Step {Math.max(activeIndex + 1, 1)} of {visualStepKeys.length}
      </Text>
    </View>
  );
}

function ValidationBanner({ tone, message }: { tone: "info" | "error"; message: string }) {
  const { palette } = useTheme();
  return (
    <View
      style={{
        borderRadius: 16,
        borderWidth: 1,
        borderColor: tone === "error" ? palette.error + BORDER_SUBTLE : palette.outlineVariant + BORDER_SUBTLE,
        backgroundColor: tone === "error" ? palette.errorContainer : palette.surfaceContainerLow,
        paddingHorizontal: 16,
        paddingVertical: 12,
      }}
    >
      <Text style={[type.label, { fontFamily: "Manrope_500Medium", color: tone === "error" ? palette.onErrorContainer : palette.onSurfaceVariant }]}>
        {message}
      </Text>
    </View>
  );
}

function CategoryCard({
  label,
  emoji,
  selected,
  onPress,
}: {
  label: string;
  emoji: string;
  selected: boolean;
  onPress: () => void;
}) {
  const { palette } = useTheme();
  const scale = useSharedValue(selected ? 1.04 : 1);

  useEffect(() => {
    scale.value = withSpring(selected ? 1.04 : 1, spring.enter);
  }, [scale, selected]);

  const animatedStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  return (
    <Animated.View style={[{ width: "48%" }, animatedStyle]}>
      <Pressable
        onPress={() => {
          void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          onPress();
        }}
        style={{
          borderRadius: 24,
          borderWidth: 1.5,
          borderColor: selected ? palette.primary : palette.outlineVariant + BORDER_SUBTLE,
          backgroundColor: selected ? palette.primary : palette.surfaceContainerLowest,
          padding: 20,
        }}
      >
        {selected ? (
          <View
            style={{
              position: "absolute",
              top: 8,
              right: 8,
              width: 24,
              height: 24,
              alignItems: "center",
              justifyContent: "center",
              borderRadius: 12,
              backgroundColor: palette.surfaceContainerLowest,
            }}
          >
            <Check size={14} color={palette.primary} strokeWidth={2.5} />
          </View>
        ) : null}
        <Text style={{ fontSize: 34, marginBottom: 10 }}>{emoji}</Text>
        <Text style={[type.label, { color: selected ? palette.primaryForeground : palette.onSurface }]}>
          {label}
        </Text>
      </Pressable>
    </Animated.View>
  );
}

function ThemeCard({
  label,
  description,
  selected,
  Icon,
  onPress,
}: {
  label: string;
  description: string;
  selected: boolean;
  Icon: typeof Sun;
  onPress: () => void;
}) {
  const { palette } = useTheme();
  const scale = useSharedValue(selected ? 1.04 : 1);

  useEffect(() => {
    scale.value = withSpring(selected ? 1.04 : 1, spring.enter);
  }, [scale, selected]);

  const animatedStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  return (
    <Animated.View style={[{ width: "100%" }, animatedStyle]}>
      <Pressable
        onPress={() => {
          void Haptics.selectionAsync();
          onPress();
        }}
        style={{
          borderRadius: 20,
          borderWidth: 1.5,
          borderColor: selected ? palette.primary : palette.outlineVariant + BORDER_SUBTLE,
          backgroundColor: selected ? palette.primary : palette.surfaceContainerLowest,
          padding: 16,
        }}
      >
        {selected ? (
          <View
            style={{
              position: "absolute",
              top: 8,
              right: 8,
              width: 22,
              height: 22,
              alignItems: "center",
              justifyContent: "center",
              borderRadius: 11,
              backgroundColor: palette.surfaceContainerLowest,
            }}
          >
            <Check size={13} color={palette.primary} strokeWidth={2.5} />
          </View>
        ) : null}
        <Icon
          size={24}
          color={selected ? palette.primaryForeground : palette.primary}
          style={{ marginBottom: 12 }}
        />
        <Text style={[type.label, { fontSize: 15, color: selected ? palette.primaryForeground : palette.onSurface, marginBottom: 2 }]}>
          {label}
        </Text>
        <Text style={[type.labelSm, { fontFamily: "Manrope_400Regular", lineHeight: 17, color: selected ? palette.primaryForeground + "CC" : palette.onSurfaceVariant }]}>
          {description}
        </Text>
      </Pressable>
    </Animated.View>
  );
}

function CompactCard({
  label,
  selected,
  onPress,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
}) {
  const { palette } = useTheme();
  return (
    <Pressable
      onPress={() => {
        void Haptics.selectionAsync();
        onPress();
      }}
      style={{
        borderRadius: 14,
        borderWidth: 1.5,
        borderColor: selected ? palette.primary : palette.outlineVariant + BORDER_SUBTLE,
        backgroundColor: selected ? palette.primary : palette.surfaceContainerLowest,
        paddingHorizontal: 8,
        paddingVertical: 14,
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Text
        numberOfLines={1}
        adjustsFontSizeToFit
        minimumFontScale={0.85}
        style={[type.label, { fontSize: 13, color: selected ? palette.primaryForeground : palette.onSurface, textAlign: "center" }]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

function Toggle({ value, onValueChange }: { value: boolean; onValueChange: (v: boolean) => void }) {
  const { palette } = useTheme();
  const progress = useSharedValue(value ? 1 : 0);

  useEffect(() => {
    progress.value = withTiming(value ? 1 : 0, { duration: 200 });
  }, [progress, value]);

  const trackStyle = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(progress.value, [0, 1], [palette.switchBackground, palette.primary]),
  }));

  const thumbStyle = useAnimatedStyle(() => {
    // Clamp between 4 and 28 so the thumb never leaves the track
    const x = Math.min(Math.max(4 + progress.value * 24, 4), 28);
    return { transform: [{ translateX: x }] };
  });

  return (
    <Pressable onPress={() => onValueChange(!value)} hitSlop={8}>
      <Animated.View style={[{ width: 56, height: 32, borderRadius: 16, justifyContent: "center" }, trackStyle]}>
        <Animated.View
          style={[
            {
              position: "absolute",
              top: 4,
              width: 24,
              height: 24,
              borderRadius: 12,
              backgroundColor: "#FFFFFF",
              shadowColor: "#000",
              shadowOpacity: 0.15,
              shadowRadius: 6,
              shadowOffset: { width: 0, height: 2 },
              elevation: 2,
            },
            thumbStyle,
          ]}
        />
      </Animated.View>
    </Pressable>
  );
}

function ToggleRow({
  title,
  description,
  value,
  onValueChange,
}: {
  title: string;
  description: string;
  value: boolean;
  onValueChange: (v: boolean) => void;
}) {
  const { palette } = useTheme();
  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        borderRadius: 20,
        borderWidth: 1,
        borderColor: palette.outlineVariant + BORDER_SUBTLE,
        backgroundColor: palette.surfaceContainerLowest,
        paddingHorizontal: 18,
        paddingVertical: 16,
      }}
    >
      <View style={{ flex: 1, gap: 3, marginRight: 16 }}>
        <Text style={[type.label, { fontSize: 15, color: palette.onSurface }]}>
          {title}
        </Text>
        <Text style={[type.labelSm, { fontFamily: "Manrope_400Regular", fontSize: 13, lineHeight: 19, color: palette.onSurfaceVariant }]}>
          {description}
        </Text>
      </View>
      <Toggle value={value} onValueChange={onValueChange} />
    </View>
  );
}

function SectionLabel({ label }: { label: string }) {
  const { palette } = useTheme();
  return (
    <Text style={[type.overline, { fontSize: 11, letterSpacing: 1.5, color: palette.onSurface }]}>
      {label}
    </Text>
  );
}

function ButtonRow({
  onBack,
  showSkip,
  onSkip,
  onContinue,
  continueDisabled,
  loading,
}: {
  onBack: () => void;
  showSkip: boolean;
  onSkip: () => void;
  onContinue: () => void | Promise<void>;
  continueDisabled: boolean;
  loading: boolean;
}) {
  const { palette } = useTheme();

  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
      <Pressable
        onPress={onBack}
        style={{
          flexDirection: "row",
          alignItems: "center",
          gap: 5,
          paddingHorizontal: 14,
          paddingVertical: 14,
          borderRadius: 999,
          borderWidth: 1.5,
          borderColor: palette.outlineVariant + BORDER_SUBTLE,
          backgroundColor: palette.surfaceContainerLowest,
        }}
      >
        <ArrowLeft size={15} color={palette.onSurface} />
        <Text style={[type.label, { color: palette.onSurface }]}>
          Back
        </Text>
      </Pressable>

      {showSkip ? (
        <Pressable
          onPress={onSkip}
          style={{ paddingHorizontal: 12, paddingVertical: 14, borderRadius: 999 }}
        >
          <Text style={[type.label, { fontFamily: "Manrope_500Medium", color: palette.outline }]}>
            Skip
          </Text>
        </Pressable>
      ) : null}

      <View style={{ flex: 1 }}>
        <PrimaryButton
          label="Continue"
          loading={loading}
          disabled={continueDisabled}
          onPress={onContinue}
        />
      </View>
    </View>
  );
}

function BenefitItem({ title, description, Icon }: { title: string; description: string; Icon: typeof BookOpen }) {
  const { palette } = useTheme();
  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "flex-start",
        gap: 14,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: palette.outlineVariant + BORDER_SUBTLE,
        backgroundColor: palette.surfaceContainerLowest,
        paddingHorizontal: 16,
        paddingVertical: 16,
      }}
    >
      <View
        style={{
          width: 38,
          height: 38,
          alignItems: "center",
          justifyContent: "center",
          borderRadius: 19,
          backgroundColor: palette.primary + "18",
        }}
      >
        <Icon size={17} color={palette.primary} />
      </View>
      <View style={{ flex: 1, gap: 3 }}>
        <Text style={[type.label, { fontSize: 15, color: palette.onSurface }]}>
          {title}
        </Text>
        <Text style={[type.labelSm, { fontFamily: "Manrope_400Regular", fontSize: 13, lineHeight: 19, color: palette.onSurfaceVariant }]}>
          {description}
        </Text>
      </View>
    </View>
  );
}

function CelebrationBenefitItem({ title, description, Icon }: { title: string; description: string; Icon: typeof BookOpen }) {
  const { palette, resolvedTheme } = useTheme();
  return (
    <View style={{ borderRadius: 20, overflow: "hidden", borderWidth: 1, borderColor: palette.outlineVariant + BORDER_SUBTLE }}>
      <BlurView
        intensity={80}
        tint={resolvedTheme === "dark" ? "dark" : "light"}
        style={{ padding: 16, backgroundColor: palette.surfaceContainerLowest + "C0" }}
      >
        <View style={{ flexDirection: "row", alignItems: "flex-start", gap: 14 }}>
          <View
            style={{
              width: 38,
              height: 38,
              alignItems: "center",
              justifyContent: "center",
              borderRadius: 19,
              backgroundColor: palette.primary + "18",
            }}
          >
            <Icon size={17} color={palette.primary} />
          </View>
          <View style={{ flex: 1, gap: 3 }}>
            <Text style={[type.label, { fontSize: 15, color: palette.onSurface }]}>
              {title}
            </Text>
            <Text style={[type.labelSm, { fontFamily: "Manrope_400Regular", fontSize: 13, lineHeight: 19, color: palette.onSurfaceVariant }]}>
              {description}
            </Text>
          </View>
        </View>
      </BlurView>
    </View>
  );
}

// ─── Main screen ─────────────────────────────────────────

export default function OnboardingScreen() {
  const router = useRouter();
  const { palette, setPreference } = useTheme();
  const {
    session,
    status,
    errorMessage,
    isBusy,
    updateOnboardingProfile,
    updateOnboardingCategories,
    updateOnboardingPreferences,
    completeOnboarding,
    clearError,
  } = useAuth();

  const [displayName, setDisplayName] = useState(session?.user.displayName ?? "");
  const [selectedCategories, setSelectedCategories] = useState<string[]>(
    session?.onboarding.selectedCategories ?? [],
  );
  const [preferences, setPreferences] = useState<UserPreferences>(
    session?.preferences ?? defaultPreferences,
  );
  const [localStep, setLocalStep] = useState<VisualStep>(
    session?.onboarding.currentStep && session.onboarding.currentStep !== "complete"
      ? session.onboarding.currentStep
      : "account",
  );
  const [isNameFocused, setIsNameFocused] = useState(false);
  const [completionIntent, setCompletionIntent] = useState(false);
  const [showCompletion, setShowCompletion] = useState(false);

  const { width: screenWidth } = useWindowDimensions();
  const completionCircleSize = Math.min(screenWidth * 0.22, 96);
  const serverStep = session?.onboarding.currentStep ?? "account";
  const selectedCount = selectedCategories.length;
  const stepCopy = useMemo(() => getStepCopy(localStep), [localStep]);

  useEffect(() => {
    setDisplayName(session?.user.displayName ?? "");
    setSelectedCategories(session?.onboarding.selectedCategories ?? []);
    setPreferences(session?.preferences ?? defaultPreferences);
  }, [session]);

  useEffect(() => {
    if (!session || showCompletion) return;
    if (session.onboarding.currentStep !== "complete") {
      setLocalStep(session.onboarding.currentStep);
    }
  }, [session, showCompletion]);

  useEffect(() => {
    if (completionIntent && session?.onboarding.isCompleted) {
      setShowCompletion(true);
      setCompletionIntent(false);
    }
  }, [completionIntent, session?.onboarding.isCompleted]);

  const validationMessage = useMemo(() => {
    if (localStep === "account" && !displayName.trim()) return "Add the name you want to see across the app.";
    if (localStep === "categories" && selectedCount < 3) return `Select at least 3 categories. ${3 - selectedCount} to go.`;
    return null;
  }, [displayName, localStep, selectedCount]);

  const fallbackCategories = useMemo(() => {
    if (selectedCategories.length >= 3) return selectedCategories;
    if ((session?.onboarding.selectedCategories ?? []).length >= 3) return session?.onboarding.selectedCategories ?? [];
    return categoryOptions.slice(0, 3).map((c) => c.key);
  }, [selectedCategories, session?.onboarding.selectedCategories]);

  if (status === "loading" || !session) {
    return <LoadingScreen title="Preparing your setup" message="We're restoring your saved onboarding step so you can continue cleanly." />;
  }

  if ((session.onboarding.isCompleted || serverStep === "complete") && !showCompletion && !completionIntent) {
    return <Redirect href="/(app)/(tabs)" />;
  }

  const handleBack = () => {
    clearError();
    if (localStep === "notifications") { setLocalStep("categories"); return; }
    const prev = getPreviousStep(localStep);
    if (prev) setLocalStep(prev);
  };

  const saveStep = async (step: VisualStep = localStep, opts?: { skip?: boolean }) => {
    clearError();
    try {
      if (step === "account") { await updateOnboardingProfile({ displayName }); return; }
      if (step === "categories") {
        const cats = opts?.skip ? fallbackCategories : selectedCategories;
        if (opts?.skip) setSelectedCategories(cats);
        await updateOnboardingCategories({ categories: cats }); return;
      }
      await updateOnboardingPreferences(preferences);
      if (step === "reading") { setCompletionIntent(true); await completeOnboarding(); }
    } catch { if (step === "reading") setCompletionIntent(false); }
  };

  // Merged preferences step (appearance + notifications) — two saves in one press.
  const savePreferences = async () => {
    clearError();
    try {
      await updateOnboardingPreferences(preferences, {
        skipNotifications: localStep === "appearance",
      });
    } catch { /* errorMessage surfaced by AuthProvider */ }
  };

  const renderStep = () => {
    // ── Account ──────────────────────────────────────────
    if (localStep === "account") {
      return (
        <View style={{ gap: 16 }}>
          <View style={{ gap: 8 }}>
            <Text style={[type.overline, { fontSize: 13, letterSpacing: 0.5, color: palette.onSurface }]}>
              Display name
            </Text>
            <View
              style={{
                borderRadius: 999,
                borderWidth: 1.5,
                borderColor: isNameFocused ? palette.primary : palette.outlineVariant + BORDER_SUBTLE,
                backgroundColor: palette.surfaceContainerLowest,
                paddingHorizontal: 22,
                paddingVertical: 14,
              }}
            >
              <TextInput
                value={displayName}
                onChangeText={(v) => { clearError(); setDisplayName(v); }}
                onFocus={() => setIsNameFocused(true)}
                onBlur={() => setIsNameFocused(false)}
                placeholder="How should Curator address you?"
                placeholderTextColor={palette.outline}
                selectionColor={palette.primary}
                style={[type.label, { fontFamily: "Manrope_400Regular", fontSize: 16, padding: 0, color: palette.onSurface }]}
              />
            </View>
          </View>

          <View
            style={{
              borderRadius: 16,
              borderWidth: 1,
              borderColor: palette.outlineVariant + BORDER_SUBTLE,
              backgroundColor: palette.surfaceContainerLowest,
              paddingHorizontal: 16,
              paddingVertical: 14,
            }}
          >
            <Text style={[type.labelSm, { fontFamily: "Manrope_400Regular", fontSize: 13, lineHeight: 20, color: palette.onSurfaceVariant }]}>
              You can refine this later from your account screen. For now, keep it simple and recognizable.
            </Text>
          </View>

          <PrimaryButton
            label="Continue"
            loading={isBusy}
            disabled={Boolean(validationMessage)}
            icon={<ArrowRight size={18} color={palette.primaryForeground} />}
            onPress={() => saveStep("account")}
          />
        </View>
      );
    }

    // ── Categories ───────────────────────────────────────
    if (localStep === "categories") {
      return (
        <View style={{ gap: 16 }}>
          <Text
            style={[type.labelSm, { fontSize: 13, textAlign: "center", color: palette.outline }]}
          >
            {selectedCount} selected
          </Text>

          <View style={{ flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between", rowGap: 12 }}>
            {categoryOptions.map((cat) => {
              const selected = selectedCategories.includes(cat.key);
              return (
                <CategoryCard
                  key={cat.key}
                  label={cat.label}
                  emoji={categoryEmojiByKey[cat.key] ?? "✦"}
                  selected={selected}
                  onPress={() => {
                    clearError();
                    setSelectedCategories((curr) =>
                      selected ? curr.filter((k) => k !== cat.key) : [...curr, cat.key],
                    );
                  }}
                />
              );
            })}
          </View>

          <ButtonRow
            showSkip
            onBack={handleBack}
            onSkip={() => { void saveStep("categories", { skip: true }); }}
            onContinue={() => saveStep("categories")}
            continueDisabled={Boolean(validationMessage)}
            loading={isBusy}
          />
        </View>
      );
    }

    // ── Preferences (appearance + notifications merged) ──
    if (localStep === "appearance" || localStep === "notifications") {
      return (
        <View style={{ gap: 20 }}>
          <View style={{ gap: 10 }}>
            <SectionLabel label="Appearance" />
            <View style={{ gap: 10 }}>
              {themeOptions.map((t) => {
                const selected = preferences.themePreference === t.value;
                return (
                  <ThemeCard
                    key={t.value}
                    label={t.label}
                    description={t.description}
                    selected={selected}
                    Icon={t.Icon}
                    onPress={() => {
                      clearError();
                      setPreference(t.value);
                      setPreferences((cur) => ({ ...cur, themePreference: t.value }));
                    }}
                  />
                );
              })}
            </View>
          </View>

          <View style={{ gap: 10 }}>
            <SectionLabel label="Notification cadence" />
            <View style={{ flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between", rowGap: 10 }}>
              {notificationOptions.map((opt) => (
                <View key={opt.key} style={{ width: "48%" }}>
                  <CompactCard
                    label={opt.label}
                    selected={preferences.notificationFrequency === opt.key}
                    onPress={() => {
                      clearError();
                      setPreferences((cur) => ({ ...cur, notificationFrequency: opt.key }));
                    }}
                  />
                </View>
              ))}
            </View>
          </View>

          <ToggleRow
            title="Allow push when we're ready"
            description="Save your preference now. The native permission prompt can come later."
            value={preferences.pushEnabled}
            onValueChange={(v) => { clearError(); setPreferences((cur) => ({ ...cur, pushEnabled: v })); }}
          />

          <ToggleRow
            title="Email digest backup"
            description="Keep a written version of your preferred cadence in your inbox."
            value={preferences.emailDigestEnabled}
            onValueChange={(v) => { clearError(); setPreferences((cur) => ({ ...cur, emailDigestEnabled: v })); }}
          />

          <ButtonRow
            showSkip
            onBack={handleBack}
            onSkip={savePreferences}
            onContinue={savePreferences}
            continueDisabled={false}
            loading={isBusy}
          />
        </View>
      );
    }

    // ── Reading ──────────────────────────────────────────
    return (
      <View style={{ gap: 20 }}>
        <View style={{ gap: 10 }}>
          <SectionLabel label="Text size" />
          <View style={{ flexDirection: "row", gap: 10 }}>
            {textSizeOptions.map((opt) => (
              <View key={opt.key} style={{ flex: 1 }}>
                <CompactCard
                  label={opt.label}
                  selected={preferences.textSize === opt.key}
                  onPress={() => {
                    clearError();
                    setPreferences((cur) => ({ ...cur, textSize: opt.key }));
                  }}
                />
              </View>
            ))}
          </View>
        </View>

        <ToggleRow
          title="Auto-save worthy stories"
          description="Save article state automatically so the app feels resilient across sessions."
          value={preferences.autoSaveEnabled}
          onValueChange={(v) => { clearError(); setPreferences((cur) => ({ ...cur, autoSaveEnabled: v })); }}
        />

        <ToggleRow
          title="Reduce motion"
          description="Tone down transitions and keep motion subtle across the app."
          value={preferences.reduceMotionEnabled}
          onValueChange={(v) => { clearError(); setPreferences((cur) => ({ ...cur, reduceMotionEnabled: v })); }}
        />

        <View style={{ gap: 10 }}>
          {welcomeFeatures.map((f) => (
            <BenefitItem key={f.key} title={f.title} description={f.description} Icon={f.Icon} />
          ))}
        </View>

        <ButtonRow
          showSkip={false}
          onBack={handleBack}
          onSkip={() => {}}
          onContinue={() => saveStep("reading")}
          continueDisabled={false}
          loading={isBusy}
        />
      </View>
    );
  };

  const completionName = displayName.trim() || session.user.displayName?.trim() || "Reader";

  return (
    <Screen tabBarPadding={false}>
      <View style={{ width: "100%", maxWidth: 600, alignSelf: "center", gap: 24, paddingTop: 4 }}>
        {showCompletion ? (
          <Animated.View key="completion" entering={FadeIn.duration(300).delay(80)}>
            <View style={{ alignItems: "center", gap: 24 }}>
              <View
                style={{
                  width: completionCircleSize,
                  height: completionCircleSize,
                  alignItems: "center",
                  justifyContent: "center",
                  borderRadius: 999,
                  backgroundColor: palette.primary,
                }}
              >
                <Check size={completionCircleSize * 0.5} color={palette.primaryForeground} strokeWidth={2.5} />
              </View>

              <View style={{ alignItems: "center", gap: 8 }}>
                <Text
                  style={{
                    ...type.display,
                    fontFamily: "Newsreader_400Regular_Italic",
                    lineHeight: 54,
                    letterSpacing: -1,
                    textAlign: "center",
                    color: palette.onSurface,
                  }}
                >
                  You're All Set!
                </Text>
                <Text style={[type.label, { fontFamily: "Manrope_400Regular", fontSize: 17, lineHeight: 25, textAlign: "center", color: palette.onSurfaceVariant }]}>
                  Welcome to The Curator, {completionName}
                </Text>
              </View>

              <View style={{ width: "100%", gap: 10 }}>
                {welcomeFeatures.map((f) => (
                  <CelebrationBenefitItem key={f.key} title={f.title} description={f.description} Icon={f.Icon} />
                ))}
              </View>

              <View style={{ width: "100%" }}>
                <PrimaryButton
                  label="Start reading"
                  icon={<ArrowRight size={18} color={palette.primaryForeground} />}
                  onPress={() => router.replace("/(app)/(tabs)")}
                />
              </View>
            </View>
          </Animated.View>
        ) : (
          <>
            <ProgressBar activeStep={localStep} />

            <Animated.View key={localStep} entering={FadeIn.duration(250).delay(60)} style={{ gap: 22, width: "100%" }}>
              {/* Title block */}
              <View style={{ alignItems: "center", gap: 12, paddingHorizontal: "4%" }}>
                <Text
                  style={{
                    ...type.display,
                    fontFamily: "Newsreader_400Regular_Italic",
                    lineHeight: 54,
                    letterSpacing: -1,
                    textAlign: "center",
                    color: palette.onSurface,
                  }}
                >
                  {stepCopy.title}
                </Text>
                <Text style={[type.label, { fontFamily: "Manrope_400Regular", fontSize: 18, lineHeight: 27, textAlign: "center", width: "88%", color: palette.onSurfaceVariant }]}>
                  {stepCopy.description}
                </Text>
              </View>

              {errorMessage ? <ValidationBanner tone="error" message={errorMessage} /> : null}
              {validationMessage ? <ValidationBanner tone="info" message={validationMessage} /> : null}

              {renderStep()}
            </Animated.View>
          </>
        )}
      </View>
    </Screen>
  );
}
