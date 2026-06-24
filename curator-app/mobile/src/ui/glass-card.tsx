import { type PropsWithChildren } from "react";
import { Platform, StyleSheet, View, type StyleProp, type ViewStyle } from "react-native";
import { BlurView } from "expo-blur";

import { useTheme } from "../providers/theme-provider";

interface GlassCardProps extends PropsWithChildren {
  style?: StyleProp<ViewStyle>;
  borderRadius?: number;
  intensity?: number;
}

/**
 * Frosted card with a solid Android fallback.
 * Shadow lives on the outer wrapper so elevation is not clipped by overflow:hidden.
 */
export function GlassCard({
  children,
  style,
  borderRadius = 28,
  intensity = 72,
}: GlassCardProps) {
  const { palette, resolvedTheme } = useTheme();
  const tint = resolvedTheme === "dark" ? "dark" : "light";
  const isAndroid = Platform.OS === "android";
  const fillColor = isAndroid ? palette.surfaceContainerLow : palette.surfaceContainerLowest;
  const borderColor = palette.outlineVariant + (isAndroid ? "66" : "40");

  return (
    <View
      style={[
        styles.outer,
        {
          borderRadius,
          shadowOpacity: isAndroid ? 0.16 : 0.1,
          elevation: isAndroid ? 12 : 8,
        },
        style,
      ]}
    >
      <View
        style={[
          styles.inner,
          {
            borderRadius,
            borderColor,
            backgroundColor: fillColor,
          },
        ]}
      >
        {isAndroid ? (
          <View
            pointerEvents="none"
            style={[
              StyleSheet.absoluteFillObject,
              { backgroundColor: fillColor },
            ]}
          />
        ) : (
          <BlurView
            pointerEvents="none"
            intensity={intensity}
            tint={tint}
            style={[
              StyleSheet.absoluteFillObject,
              { backgroundColor: palette.surfaceContainerLowest + "CC" },
            ]}
          />
        )}
        <View style={styles.content}>{children}</View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  outer: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowRadius: 24,
  },
  inner: {
    overflow: "hidden",
    borderWidth: 2,
  },
  content: {
    position: "relative",
    zIndex: 1,
  },
});
