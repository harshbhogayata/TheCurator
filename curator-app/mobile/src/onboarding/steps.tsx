import { Pressable, Text, TextInput, View } from "react-native";
import { ArrowRight, Camera, Check } from "lucide-react-native";
import Animated, { FadeIn } from "react-native-reanimated";

import { categoryOptions, type UserPreferences } from "../lib/types";
import { useTheme } from "../providers/theme-provider";
import { PrimaryButton } from "../ui/primary-button";
import { ProfileAvatar } from "../ui/profile-avatar";
import { type } from "../ui/tokens/typography";

import {
  BenefitItem,
  ButtonRow,
  CategoryCard,
  CelebrationBenefitItem,
  CompactCard,
  SectionLabel,
  ThemeCard,
  ToggleRow,
} from "./components";
import {
  BORDER_SUBTLE,
  categoryEmojiByKey,
  notificationOptions,
  textSizeOptions,
  themeOptions,
  welcomeFeatures,
} from "./constants";

type AccountStepProps = {
  displayName: string;
  onDisplayNameChange: (value: string) => void;
  isNameFocused: boolean;
  onNameFocus: () => void;
  onNameBlur: () => void;
  avatarUrl?: string | null;
  sessionDisplayName?: string | null;
  sessionEmail?: string | null;
  onPickImage: () => void;
  validationMessage: string | null;
  isBusy: boolean;
  onContinue: () => void | Promise<void>;
};

export function AccountStep({
  displayName,
  onDisplayNameChange,
  isNameFocused,
  onNameFocus,
  onNameBlur,
  avatarUrl,
  sessionDisplayName,
  sessionEmail,
  onPickImage,
  validationMessage,
  isBusy,
  onContinue,
}: AccountStepProps) {
  const { palette } = useTheme();

  return (
    <View style={{ gap: 24 }}>
      <View style={{ alignItems: "center" }}>
        <Pressable onPress={onPickImage}>
          <View
            style={{
              width: 96,
              height: 96,
              borderRadius: 48,
              overflow: "hidden",
              borderWidth: 3,
              borderColor: palette.outlineVariant + "40",
              backgroundColor: palette.surfaceContainerLowest,
            }}
          >
            <ProfileAvatar
              avatarUrl={avatarUrl}
              displayName={sessionDisplayName}
              email={sessionEmail}
              size={90}
            />
          </View>
          <View
            style={{
              position: "absolute",
              bottom: 0,
              right: 0,
              backgroundColor: palette.primary,
              width: 32,
              height: 32,
              borderRadius: 16,
              alignItems: "center",
              justifyContent: "center",
              borderWidth: 3,
              borderColor: palette.background,
            }}
          >
            <Camera size={14} color={palette.primaryForeground} />
          </View>
        </Pressable>
      </View>
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
            onChangeText={onDisplayNameChange}
            onFocus={onNameFocus}
            onBlur={onNameBlur}
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
          You can refine this later from Profile → Account Details. For now, keep it simple and recognizable.
        </Text>
      </View>

      <PrimaryButton
        label="Continue"
        loading={isBusy}
        disabled={Boolean(validationMessage)}
        icon={<ArrowRight size={18} color={palette.primaryForeground} />}
        onPress={onContinue}
      />
    </View>
  );
}

type CategoriesStepProps = {
  selectedCategories: string[];
  onToggleCategory: (key: string, selected: boolean) => void;
  selectedCount: number;
  onBack: () => void;
  onSkip: () => void;
  onContinue: () => void | Promise<void>;
  validationMessage: string | null;
  isBusy: boolean;
};

export function CategoriesStep({
  selectedCategories,
  onToggleCategory,
  selectedCount,
  onBack,
  onSkip,
  onContinue,
  validationMessage,
  isBusy,
}: CategoriesStepProps) {
  const { palette } = useTheme();

  return (
    <View style={{ gap: 16 }}>
      <Text style={[type.labelSm, { fontSize: 13, textAlign: "center", color: palette.outline }]}>
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
              onPress={() => onToggleCategory(cat.key, selected)}
            />
          );
        })}
      </View>

      <ButtonRow
        showSkip
        onBack={onBack}
        onSkip={onSkip}
        onContinue={onContinue}
        continueDisabled={Boolean(validationMessage)}
        loading={isBusy}
      />
    </View>
  );
}

type PreferencesStepProps = {
  preferences: UserPreferences;
  onPreferencesChange: (updater: (current: UserPreferences) => UserPreferences) => void;
  onThemeChange: (value: UserPreferences["themePreference"]) => void;
  onBack: () => void;
  onSkip: () => void | Promise<void>;
  onContinue: () => void | Promise<void>;
  isBusy: boolean;
};

export function PreferencesStep({
  preferences,
  onPreferencesChange,
  onThemeChange,
  onBack,
  onSkip,
  onContinue,
  isBusy,
}: PreferencesStepProps) {
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
                onPress={() => onThemeChange(t.value)}
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
                onPress={() => onPreferencesChange((cur) => ({ ...cur, notificationFrequency: opt.key }))}
              />
            </View>
          ))}
        </View>
      </View>

      <ToggleRow
        title="Allow push when we're ready"
        description="Save your preference now. The native permission prompt can come later."
        value={preferences.pushEnabled}
        onValueChange={(v) => onPreferencesChange((cur) => ({ ...cur, pushEnabled: v }))}
      />

      <ToggleRow
        title="Email digest backup"
        description="Keep a written version of your preferred cadence in your inbox."
        value={preferences.emailDigestEnabled}
        onValueChange={(v) => onPreferencesChange((cur) => ({ ...cur, emailDigestEnabled: v }))}
      />

      <ButtonRow
        showSkip
        onBack={onBack}
        onSkip={onSkip}
        onContinue={onContinue}
        continueDisabled={false}
        loading={isBusy}
      />
    </View>
  );
}

type ReadingStepProps = {
  preferences: UserPreferences;
  onPreferencesChange: (updater: (current: UserPreferences) => UserPreferences) => void;
  onTextSizeChange: (key: UserPreferences["textSize"]) => void;
  onBack: () => void;
  onContinue: () => void | Promise<void>;
  isBusy: boolean;
};

export function ReadingStep({
  preferences,
  onPreferencesChange,
  onTextSizeChange,
  onBack,
  onContinue,
  isBusy,
}: ReadingStepProps) {
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
                onPress={() => onTextSizeChange(opt.key)}
              />
            </View>
          ))}
        </View>
      </View>

      <ToggleRow
        title="Auto-save worthy stories"
        description="Save article state automatically so the app feels resilient across sessions."
        value={preferences.autoSaveEnabled}
        onValueChange={(v) => onPreferencesChange((cur) => ({ ...cur, autoSaveEnabled: v }))}
      />

      <ToggleRow
        title="Reduce motion"
        description="Tone down transitions and keep motion subtle across the app."
        value={preferences.reduceMotionEnabled}
        onValueChange={(v) => onPreferencesChange((cur) => ({ ...cur, reduceMotionEnabled: v }))}
      />

      <View style={{ gap: 10 }}>
        {welcomeFeatures.map((f) => (
          <BenefitItem key={f.key} title={f.title} description={f.description} Icon={f.Icon} />
        ))}
      </View>

      <ButtonRow
        showSkip={false}
        onBack={onBack}
        onSkip={() => {}}
        onContinue={onContinue}
        continueDisabled={false}
        loading={isBusy}
      />
    </View>
  );
}

type CompletionViewProps = {
  completionCircleSize: number;
  completionName: string;
  onStartReading: () => void;
};

export function CompletionView({ completionCircleSize, completionName, onStartReading }: CompletionViewProps) {
  const { palette } = useTheme();

  return (
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
            onPress={onStartReading}
          />
        </View>
      </View>
    </Animated.View>
  );
}
