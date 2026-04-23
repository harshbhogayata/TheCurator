import React, { memo } from "react";
import { StyleSheet, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";

import { useTheme } from "../providers/theme-provider";

interface ReadingProgressBarProps {
  progress: number; // 0-1
}

function ReadingProgressBarInner({ progress }: ReadingProgressBarProps) {
  const { palette } = useTheme();
  const clampedProgress = Math.max(0, Math.min(1, progress));
  const widthPercent = `${clampedProgress * 100}%`;

  return (
    <View style={styles.container}>
      <View
        style={[
          styles.track,
          { backgroundColor: palette.surfaceContainerHigh + "4D" },
        ]}
      />
      <LinearGradient
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        colors={[palette.primary, palette.secondary, palette.tertiary]}
        style={[styles.fill, { width: widthPercent as any }]}
      />
    </View>
  );
}

export const ReadingProgressBar = memo(ReadingProgressBarInner);

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 60,
    height: 3,
  },
  track: {
    height: "100%",
  },
  fill: {
    position: "absolute",
    top: 0,
    left: 0,
    height: "100%",
  },
});
