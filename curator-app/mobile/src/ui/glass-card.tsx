import { type PropsWithChildren } from "react";
import { StyleSheet, View, type StyleProp, type ViewStyle } from "react-native";

import { useTheme } from "../providers/theme-provider";

interface GlassCardProps extends PropsWithChildren {
  style?: StyleProp<ViewStyle>;
  borderRadius?: number;
}

/** Solid surface card — matches settings rows and saved banners (no blur). */
export function GlassCard({
  children,
  style,
  borderRadius = 30,
}: GlassCardProps) {
  const { palette } = useTheme();

  return (
    <View
      style={[
        styles.card,
        {
          borderRadius,
          borderColor: palette.outlineVariant + "26",
          backgroundColor: palette.surfaceContainerLowest,
        },
        style,
      ]}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    overflow: "hidden",
  },
});
