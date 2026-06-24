import { type PropsWithChildren } from "react";
import { Platform, StyleSheet, View, type StyleProp, type ViewStyle } from "react-native";
import { BlurView } from "expo-blur";

import { useTheme } from "../providers/theme-provider";

interface FrostedPillProps extends PropsWithChildren {
  style?: StyleProp<ViewStyle>;
  borderColor: string;
  blurIntensity?: number;
}

/** Header/modal pill with solid fill on Android where BlurView often renders transparent. */
export function FrostedPill({
  children,
  style,
  borderColor,
  blurIntensity = 60,
}: FrostedPillProps) {
  const { palette, resolvedTheme } = useTheme();
  const tint = resolvedTheme === "dark" ? "dark" : "light";
  const isAndroid = Platform.OS === "android";
  const fillColor = isAndroid ? palette.surfaceContainerLow : palette.surfaceContainerLowest;

  return (
    <View
      style={[
        styles.pill,
        {
          borderColor,
          backgroundColor: isAndroid ? fillColor : undefined,
        },
        style,
      ]}
    >
      {isAndroid ? (
        <View
          pointerEvents="none"
          style={[StyleSheet.absoluteFillObject, { backgroundColor: fillColor }]}
        />
      ) : (
        <BlurView
          pointerEvents="none"
          intensity={blurIntensity}
          tint={tint}
          style={[
            StyleSheet.absoluteFillObject,
            { backgroundColor: palette.surfaceContainerLowest + "CC" },
          ]}
        />
      )}
      <View style={styles.content}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  pill: {
    borderRadius: 999,
    borderWidth: 2,
    overflow: "hidden",
  },
  content: {
    position: "relative",
    zIndex: 1,
  },
});
