import { Redirect, useRouter } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { Text, useWindowDimensions, View } from "react-native";
import Animated, { FadeIn } from "react-native-reanimated";

import { useAndroidBackNavigation } from "../../src/hooks/use-android-back-navigation";
import { pickProfileImageUri } from "../../src/lib/pick-profile-image";
import { AvatarUploadError, isAvatarUploadAvailable } from "../../src/services/avatar-upload";
import {
  categoryOptions,
  defaultPreferences,
  type UserPreferences,
} from "../../src/lib/types";
import { ProgressBar, ValidationBanner } from "../../src/onboarding/components";
import { getPreviousStep, getStepCopy, type VisualStep } from "../../src/onboarding/helpers";
import {
  AccountStep,
  CategoriesStep,
  CompletionView,
  PreferencesStep,
  ReadingStep,
} from "../../src/onboarding/steps";
import { needsEmailVerification, UNVERIFIED_ARTICLE_READ_LIMIT } from "../../src/lib/email-verification";
import { useAuth } from "../../src/providers/auth-provider";
import { useReadingPreferences } from "../../src/providers/reading-preferences-provider";
import { useTheme } from "../../src/providers/theme-provider";
import { useToast } from "../../src/providers/toast-provider";
import { LoadingScreen } from "../../src/ui/loading-screen";
import { Screen } from "../../src/ui/screen";
import { type } from "../../src/ui/tokens/typography";

export default function OnboardingScreen() {
  const router = useRouter();
  useAndroidBackNavigation("/welcome");
  const { palette, setPreference } = useTheme();
  const { showToast } = useToast();
  const {
    session,
    status,
    updateOnboardingProfile,
    updateOnboardingCategories,
    updateOnboardingPreferences,
    completeOnboarding,
    updateProfileAvatar,
    errorMessage,
    isBusy,
    clearError,
  } = useAuth();
  const { hydrateFontSize } = useReadingPreferences();

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

  const handlePickImage = async () => {
    if (!isAvatarUploadAvailable()) {
      showToast("info", "Photo upload comes with Firebase Storage. Your initials work great for now.");
      return;
    }

    try {
      const uri = await pickProfileImageUri();
      if (!uri) {
        return;
      }

      await updateProfileAvatar(uri);
      showToast("success", "Profile picture updated");
    } catch (error) {
      if (error instanceof AvatarUploadError) {
        showToast(error.code === "storage_unavailable" ? "info" : "error", error.message);
        return;
      }
      console.error("Image pick error", error);
      showToast("error", "Failed to update profile picture");
    }
  };

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
    return <LoadingScreen message="We're restoring your saved onboarding step so you can continue cleanly." />;
  }

  if ((session.onboarding.isCompleted || serverStep === "complete") && !showCompletion && !completionIntent) {
    return <Redirect href="/(app)/(tabs)" />;
  }

  const handleBack = () => {
    clearError();
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

  const continuePreferences = async () => {
    clearError();
    try {
      await updateOnboardingPreferences(preferences, { skipNotifications: false });
    } catch { /* errorMessage surfaced by AuthProvider */ }
  };

  const skipPreferences = async () => {
    clearError();
    try {
      await updateOnboardingPreferences(preferences, {
        skipNotifications: localStep === "appearance",
      });
    } catch { /* errorMessage surfaced by AuthProvider */ }
  };

  const handleToggleCategory = (key: string, selected: boolean) => {
    clearError();
    setSelectedCategories((curr) =>
      selected ? curr.filter((k) => k !== key) : [...curr, key],
    );
  };

  const handlePreferencesChange = (updater: (current: UserPreferences) => UserPreferences) => {
    clearError();
    setPreferences(updater);
  };

  const handleThemeChange = (value: UserPreferences["themePreference"]) => {
    clearError();
    setPreference(value);
    setPreferences((cur) => ({ ...cur, themePreference: value }));
  };

  const handleTextSizeChange = (key: UserPreferences["textSize"]) => {
    clearError();
    setPreferences((cur) => ({ ...cur, textSize: key }));
    hydrateFontSize(key);
  };

  const renderStep = () => {
    if (localStep === "account") {
      return (
        <AccountStep
          displayName={displayName}
          onDisplayNameChange={(v) => { clearError(); setDisplayName(v); }}
          isNameFocused={isNameFocused}
          onNameFocus={() => setIsNameFocused(true)}
          onNameBlur={() => setIsNameFocused(false)}
          avatarUrl={session.user.avatarUrl}
          sessionDisplayName={session.user.displayName}
          sessionEmail={session.user.email}
          onPickImage={() => { void handlePickImage(); }}
          validationMessage={validationMessage}
          isBusy={isBusy}
          onContinue={() => saveStep("account")}
        />
      );
    }

    if (localStep === "categories") {
      return (
        <CategoriesStep
          selectedCategories={selectedCategories}
          onToggleCategory={handleToggleCategory}
          selectedCount={selectedCount}
          onBack={handleBack}
          onSkip={() => { void saveStep("categories", { skip: true }); }}
          onContinue={() => saveStep("categories")}
          validationMessage={validationMessage}
          isBusy={isBusy}
        />
      );
    }

    if (localStep === "appearance" || localStep === "notifications") {
      return (
        <PreferencesStep
          preferences={preferences}
          onPreferencesChange={handlePreferencesChange}
          onThemeChange={handleThemeChange}
          onBack={handleBack}
          onSkip={() => { void skipPreferences(); }}
          onContinue={() => { void continuePreferences(); }}
          isBusy={isBusy}
        />
      );
    }

    return (
      <ReadingStep
        preferences={preferences}
        onPreferencesChange={handlePreferencesChange}
        onTextSizeChange={handleTextSizeChange}
        onBack={handleBack}
        onContinue={() => saveStep("reading")}
        isBusy={isBusy}
      />
    );
  };

  const completionName = displayName.trim() || session.user.displayName?.trim() || "Reader";
  const needsVerify = needsEmailVerification(session);

  return (
    <Screen tabBarPadding={false}>
      <View style={{ width: "100%", maxWidth: 600, alignSelf: "center", gap: 24, paddingTop: 4 }}>
        {showCompletion ? (
          <CompletionView
            completionCircleSize={completionCircleSize}
            completionName={completionName}
            needsVerify={needsVerify}
            trialArticleLimit={UNVERIFIED_ARTICLE_READ_LIMIT}
            onStartReading={() => router.replace("/(app)/(tabs)")}
          />
        ) : (
          <>
            <ProgressBar activeStep={localStep} />

            <Animated.View key={localStep} entering={FadeIn.duration(250).delay(60)} style={{ gap: 22, width: "100%" }}>
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
