import { type PropsWithChildren } from "react";
import { StyleSheet, View, type StyleProp, type ViewStyle } from "react-native";

import { useTheme } from "../providers/theme-provider";

interface FrostedPillProps extends PropsWithChildren {
  style?: StyleProp<ViewStyle>;
  borderColor: string;
}

/** Solid header pill — same treatment as tab Header, without blur. */
export function FrostedPill({ children, style, borderColor }: FrostedPillProps) {
  const { palette } = useTheme();

  return (
    <View
      style={[
        styles.pill,
        {
          borderColor,
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
  pill: {
    borderRadius: 999,
    borderWidth: 2,
    overflow: "hidden",
  },
});
