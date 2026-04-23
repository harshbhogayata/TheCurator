import React, { memo, useCallback } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import {
  AlertCircle,
  AlertTriangle,
  CheckCircle,
  Info,
  X,
} from "lucide-react-native";
import Animated, { SlideInRight, SlideOutRight } from "react-native-reanimated";

import { useTheme } from "../providers/theme-provider";
import { useToast, type ToastType } from "../providers/toast-provider";

function getToastConfig(type: ToastType, palette: any) {
  switch (type) {
    case "success":
      return {
        bg: palette.primaryContainer,
        Icon: CheckCircle,
        iconColor: "#4CAF50",
      };
    case "error":
      return {
        bg: palette.errorContainer,
        Icon: AlertCircle,
        iconColor: palette.error,
      };
    case "info":
      return {
        bg: palette.primaryContainer,
        Icon: Info,
        iconColor: palette.primary,
      };
    case "warning":
      return {
        bg: palette.secondaryContainer,
        Icon: AlertTriangle,
        iconColor: "#FFA000",
      };
  }
}

function ToastDisplayInner() {
  const { palette } = useTheme();
  const { currentToast, hideToast } = useToast();

  const handleDismiss = useCallback(() => {
    if (currentToast) {
      hideToast(currentToast.id);
    }
  }, [currentToast, hideToast]);

  if (!currentToast) {
    return null;
  }

  const config = getToastConfig(currentToast.type, palette);
  const { Icon } = config;

  return (
    <Animated.View
      entering={SlideInRight.duration(300)}
      exiting={SlideOutRight.duration(300)}
      style={styles.container}
    >
      <View
        style={[
          styles.toast,
          {
            backgroundColor: config.bg,
            borderColor: palette.outlineVariant + "26",
          },
        ]}
      >
        <Icon size={20} color={config.iconColor} />
        <Text
          style={[
            styles.message,
            { color: palette.onSurface },
          ]}
          numberOfLines={2}
        >
          {currentToast.message}
        </Text>
        <Pressable onPress={handleDismiss} hitSlop={8}>
          <X size={16} color={palette.onSurfaceVariant} />
        </Pressable>
      </View>
    </Animated.View>
  );
}

export const ToastDisplay = memo(ToastDisplayInner);

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    bottom: 100,
    right: 16,
    left: 16,
    zIndex: 100,
  },
  toast: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 8,
  },
  message: {
    flex: 1,
    fontFamily: "Manrope_500Medium",
    fontSize: 14,
  },
});
