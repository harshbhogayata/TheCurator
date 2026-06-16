import { BlurView } from "expo-blur";
import * as Haptics from "expo-haptics";
import { useEffect } from "react";
import { Pressable, Text, View } from "react-native";
import { ArrowLeft, BookOpen, Check, Sun } from "lucide-react-native";
import Animated, {
  interpolateColor,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from "react-native-reanimated";

import { useTheme } from "../providers/theme-provider";
import { PrimaryButton } from "../ui/primary-button";
import { spring } from "../ui/tokens/motion";
import { type } from "../ui/tokens/typography";

import { BORDER_SUBTLE, visualStepKeys } from "./constants";
import { type VisualStep, getVisualIndex } from "./helpers";

export function ProgressSegment({ filled }: { filled: boolean }) {
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

export function ProgressBar({ activeStep }: { activeStep: VisualStep }) {
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

export function ValidationBanner({ tone, message }: { tone: "info" | "error"; message: string }) {
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

export function CategoryCard({
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

export function ThemeCard({
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

export function CompactCard({
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

export function Toggle({ value, onValueChange }: { value: boolean; onValueChange: (v: boolean) => void }) {
  const { palette } = useTheme();
  const progress = useSharedValue(value ? 1 : 0);

  useEffect(() => {
    progress.value = withTiming(value ? 1 : 0, { duration: 200 });
  }, [progress, value]);

  const trackStyle = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(progress.value, [0, 1], [palette.switchBackground, palette.primary]),
  }));

  const thumbStyle = useAnimatedStyle(() => {
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

export function ToggleRow({
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

export function SectionLabel({ label }: { label: string }) {
  const { palette } = useTheme();
  return (
    <Text style={[type.overline, { fontSize: 11, letterSpacing: 1.5, color: palette.onSurface }]}>
      {label}
    </Text>
  );
}

export function ButtonRow({
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

export function BenefitItem({ title, description, Icon }: { title: string; description: string; Icon: typeof BookOpen }) {
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

export function CelebrationBenefitItem({ title, description, Icon }: { title: string; description: string; Icon: typeof BookOpen }) {
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
