import { memo } from "react";
import { Platform, Pressable, StyleSheet, Text, View } from "react-native";
import { BlurView } from "expo-blur";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useTheme } from "../providers/theme-provider";

/**
 * Hardcoded geometry for the Support Us subscribe pill only.
 * Intentionally not shared with any other floating surface.
 */
export const DONATE_SUBSCRIBE_PILL_LAYOUT = {
  horizontalInset: 16,
  bottomInsetMin: 24,
  safeBottomPadding: 16,
  pillHeight: 64,
  borderRadius: 999,
  paddingHorizontal: 20,
  paddingVertical: 12,
  scrollTailGap: 20,
  titleFontSize: 15,
  titleLineHeight: 19,
  subtitleFontSize: 12,
  subtitleLineHeight: 16,
  shadowOffsetY: 8,
  shadowRadius: 24,
  shadowOpacity: 0.16,
  elevation: 12,
} as const;

export function getDonateSubscribeScrollPadding(bottomInset: number): number {
  const layout = DONATE_SUBSCRIBE_PILL_LAYOUT;
  const floatBottom = Math.max(bottomInset + layout.safeBottomPadding, layout.bottomInsetMin);
  return floatBottom + layout.pillHeight + layout.scrollTailGap;
}

interface DonateSubscribePillProps {
  title: string;
  subtitle: string;
  onPress: () => void;
  disabled?: boolean;
  testID?: string;
}

function DonateSubscribePillInner({
  title,
  subtitle,
  onPress,
  disabled = false,
  testID,
}: DonateSubscribePillProps) {
  const { palette, resolvedTheme } = useTheme();
  const insets = useSafeAreaInsets();
  const layout = DONATE_SUBSCRIBE_PILL_LAYOUT;
  const floatBottom = Math.max(insets.bottom + layout.safeBottomPadding, layout.bottomInsetMin);
  const blurTint = resolvedTheme === "dark" ? "dark" : "light";
  const frostedFill = palette.surfaceContainerLowest + (Platform.OS === "android" ? "F2" : "E6");

  return (
    <View
      pointerEvents="box-none"
      style={[styles.anchor, { bottom: floatBottom, left: layout.horizontalInset, right: layout.horizontalInset }]}
    >
      <Pressable
        testID={testID}
        accessibilityRole="button"
        accessibilityLabel={title}
        accessibilityState={{ disabled }}
        onPress={onPress}
        disabled={disabled}
        android_ripple={{ color: palette.primary + "33" }}
        style={({ pressed }) => [
          styles.pill,
          {
            minHeight: layout.pillHeight,
            borderRadius: layout.borderRadius,
            borderColor: palette.outlineVariant + "66",
            opacity: pressed || disabled ? 0.92 : 1,
          },
        ]}
      >
        <BlurView
          intensity={80}
          tint={blurTint}
          style={[
            StyleSheet.absoluteFill,
            {
              borderRadius: layout.borderRadius,
              backgroundColor: frostedFill,
            },
          ]}
        />
        <View
          style={{
            paddingHorizontal: layout.paddingHorizontal,
            paddingVertical: layout.paddingVertical,
            alignItems: "center",
            justifyContent: "center",
            gap: 2,
          }}
        >
          <Text
            numberOfLines={1}
            adjustsFontSizeToFit
            minimumFontScale={0.86}
            style={[
              styles.title,
              {
                fontSize: layout.titleFontSize,
                lineHeight: layout.titleLineHeight,
                color: palette.onSurface,
              },
            ]}
          >
            {title}
          </Text>
          <Text
            numberOfLines={1}
            adjustsFontSizeToFit
            minimumFontScale={0.86}
            style={[
              styles.subtitle,
              {
                fontSize: layout.subtitleFontSize,
                lineHeight: layout.subtitleLineHeight,
                color: palette.onSurfaceVariant,
              },
            ]}
          >
            {subtitle}
          </Text>
        </View>
      </Pressable>
    </View>
  );
}

export const DonateSubscribePill = memo(DonateSubscribePillInner);

const styles = StyleSheet.create({
  anchor: {
    position: "absolute",
    zIndex: 40,
    alignItems: "center",
  },
  pill: {
    width: "100%",
    maxWidth: 420,
    overflow: "hidden",
    borderWidth: 2,
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: DONATE_SUBSCRIBE_PILL_LAYOUT.shadowOffsetY },
    shadowOpacity: DONATE_SUBSCRIBE_PILL_LAYOUT.shadowOpacity,
    shadowRadius: DONATE_SUBSCRIBE_PILL_LAYOUT.shadowRadius,
    elevation: DONATE_SUBSCRIBE_PILL_LAYOUT.elevation,
  },
  title: {
    fontFamily: "Manrope_700Bold",
    textAlign: "center",
    width: "100%",
  },
  subtitle: {
    fontFamily: "Manrope_500Medium",
    textAlign: "center",
    width: "100%",
  },
});
