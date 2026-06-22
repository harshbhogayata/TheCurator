import { memo } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
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
  const { palette } = useTheme();
  const insets = useSafeAreaInsets();
  const layout = DONATE_SUBSCRIBE_PILL_LAYOUT;
  const floatBottom = Math.max(insets.bottom + layout.safeBottomPadding, layout.bottomInsetMin);

  return (
    <View
      pointerEvents="box-none"
      style={[styles.anchor, { bottom: floatBottom, left: layout.horizontalInset, right: layout.horizontalInset }]}
    >
      <Pressable
        testID={testID}
        onPress={onPress}
        disabled={disabled}
        android_ripple={{ color: "rgba(255,255,255,0.14)" }}
        style={({ pressed }) => [
          styles.pill,
          {
            minHeight: layout.pillHeight,
            borderRadius: layout.borderRadius,
            paddingHorizontal: layout.paddingHorizontal,
            paddingVertical: layout.paddingVertical,
            backgroundColor: palette.primary,
            borderColor: palette.outlineVariant + "40",
            opacity: pressed || disabled ? 0.9 : 1,
          },
        ]}
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
              color: palette.primaryForeground,
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
              color: palette.primaryForeground + "D9",
            },
          ]}
        >
          {subtitle}
        </Text>
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
    alignItems: "center",
    justifyContent: "center",
    gap: 2,
    borderWidth: 1,
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
