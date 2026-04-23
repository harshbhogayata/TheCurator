import React from "react";
import { ActivityIndicator, Pressable, Text } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from "react-native-reanimated";

import { useTheme } from "../providers/theme-provider";
import { useReduceMotion } from "../hooks/use-motion";
import { spring } from "./tokens/motion";
import { tap } from "../lib/haptics";

type ButtonVariant = "primary" | "secondary" | "ghost";

interface PrimaryButtonProps {
  label: string;
  onPress: () => void | Promise<void>;
  disabled?: boolean;
  loading?: boolean;
  variant?: ButtonVariant;
  icon?: React.ReactNode;
  iconPosition?: "left" | "right";
}

export function PrimaryButton({
  label,
  onPress,
  disabled = false,
  loading = false,
  variant = "primary",
  icon,
  iconPosition = "right",
}: PrimaryButtonProps) {
  const { palette } = useTheme();
  const isInactive = disabled || loading;
  const reduceMotion = useReduceMotion();
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const colors =
    variant === "primary"
      ? {
          backgroundColor: palette.inverseSurface,
          color: palette.inversePrimary,
        }
      : variant === "secondary"
        ? {
            backgroundColor: palette.surfaceContainerLow,
            color: palette.onSurface,
          }
        : {
            backgroundColor: "transparent",
            color: palette.onSurfaceVariant,
          };

  const resolvedIcon =
    icon && React.isValidElement(icon)
      ? React.cloneElement(icon as React.ReactElement<{ color?: string }>, {
          color: colors.color,
        })
      : icon;

  return (
    <Animated.View style={animatedStyle}>
      <Pressable
        onPress={() => {
          void onPress();
        }}
        onPressIn={() => {
          tap();
          if (!reduceMotion) scale.value = withSpring(0.96, spring.press);
        }}
        onPressOut={() => {
          if (!reduceMotion) scale.value = withSpring(1, spring.settle);
        }}
        disabled={isInactive}
        accessibilityRole="button"
        accessibilityLabel={label}
        accessibilityState={{ disabled: isInactive, busy: loading }}
        style={{
          backgroundColor: colors.backgroundColor,
          borderRadius: 999,
          paddingVertical: 16,
          paddingHorizontal: 24,
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "center",
          gap: 8,
          ...(variant === "primary"
            ? {
                shadowColor: "#000",
                shadowOpacity: 0.12,
                shadowRadius: 10,
                shadowOffset: { width: 0, height: 4 },
                elevation: 4,
              }
            : null),
          opacity: isInactive ? 0.5 : 1,
        }}
      >
        {loading ? (
          <ActivityIndicator color={colors.color} />
        ) : (
          <>
            {iconPosition === "left" ? resolvedIcon : null}
            <Text
              numberOfLines={1}
              style={{
                color: colors.color,
                fontFamily: "Manrope_600SemiBold",
                fontSize: 16,
                letterSpacing: 0.4,
              }}
            >
              {label}
            </Text>
            {iconPosition === "right" ? resolvedIcon : null}
          </>
        )}
      </Pressable>
    </Animated.View>
  );
}
