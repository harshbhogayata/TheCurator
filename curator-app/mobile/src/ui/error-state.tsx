import { memo } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { AlertCircle } from "lucide-react-native";
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from "react-native-reanimated";

import { useTheme } from "../providers/theme-provider";
import { spring } from "./tokens/motion";
import { tap } from "../lib/haptics";

interface ErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
}

function ErrorStateInner({
  title = "Something went wrong",
  message = "Failed to load. Tap to try again.",
  onRetry,
}: ErrorStateProps) {
  const { palette } = useTheme();
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <View style={styles.container}>
      <AlertCircle size={48} color={palette.error} />
      <Text style={[styles.title, { color: palette.onSurface }]}>{title}</Text>
      <Text style={[styles.message, { color: palette.onSurfaceVariant }]}>{message}</Text>
      {onRetry && (
        <Animated.View style={animatedStyle}>
          <Pressable
            onPress={() => { tap(); onRetry(); }}
            onPressIn={() => { scale.value = withSpring(0.96, spring.press); }}
            onPressOut={() => { scale.value = withSpring(1, spring.settle); }}
            style={[styles.button, { backgroundColor: palette.inverseSurface }]}
          >
            <Text style={[styles.buttonText, { color: palette.inverseOnSurface }]}>
              Try Again
            </Text>
          </Pressable>
        </Animated.View>
      )}
    </View>
  );
}

export const ErrorState = memo(ErrorStateInner);

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 80,
    paddingHorizontal: 24,
    gap: 12,
  },
  title: {
    fontFamily: "Newsreader_500Medium",
    fontSize: 20,
    textAlign: "center",
  },
  message: {
    fontFamily: "Manrope_400Regular",
    fontSize: 14,
    lineHeight: 20,
    textAlign: "center",
  },
  button: {
    marginTop: 8,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 999,
  },
  buttonText: {
    fontFamily: "Manrope_600SemiBold",
    fontSize: 14,
  },
});
