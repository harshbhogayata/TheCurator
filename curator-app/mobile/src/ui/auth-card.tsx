import { BlurView } from "expo-blur";
import { type PropsWithChildren } from "react";
import { StyleSheet, Text, View } from "react-native";

import { useTheme } from "../providers/theme-provider";

interface AuthCardProps extends PropsWithChildren {
  eyebrow?: string;
  title: string;
  description: string;
}

export function AuthCard({
  eyebrow,
  title,
  description,
  children,
}: AuthCardProps) {
  const { palette, resolvedTheme } = useTheme();

  return (
    <View
      style={{
        borderRadius: 56,
        overflow: "hidden",
        borderWidth: 1,
        borderColor: palette.outlineVariant + "26",
        shadowColor: "#050c13",
        shadowOpacity: 0.1,
        shadowRadius: 40,
        shadowOffset: { width: 0, height: 12 },
        elevation: 8,
      }}
    >
      <BlurView
        intensity={60}
        tint={resolvedTheme === "dark" ? "dark" : "light"}
        style={{ padding: 28 }}
      >
        <View
          style={[
            StyleSheet.absoluteFill,
            { backgroundColor: palette.surfaceContainerLowest + "CC" },
          ]}
        />

        <View style={{ gap: 12 }}>
          {eyebrow ? (
            <Text
              style={{
                fontFamily: "Manrope_600SemiBold",
                fontSize: 10,
                textTransform: "uppercase",
                letterSpacing: 2,
                color: palette.outline,
              }}
            >
              {eyebrow}
            </Text>
          ) : null}
          <Text
            style={{
              fontFamily: "Newsreader_500Medium_Italic",
              fontSize: 32,
              lineHeight: 38,
              color: palette.onSurface,
            }}
          >
            {title}
          </Text>
          <Text
            style={{
              fontFamily: "Manrope_400Regular",
              fontSize: 14,
              lineHeight: 22,
              color: palette.onSurfaceVariant,
            }}
          >
            {description}
          </Text>
        </View>

        <View style={{ marginTop: 28, gap: 16 }}>{children}</View>
      </BlurView>
    </View>
  );
}
