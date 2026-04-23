import React, { memo, useCallback, useMemo } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { BlurView } from "expo-blur";
import { LinearGradient } from "expo-linear-gradient";
import { Pause, Play, SkipBack, SkipForward, X } from "lucide-react-native";
import Animated, { SlideInDown, SlideOutDown } from "react-native-reanimated";
import { useSegments } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useTheme } from "../providers/theme-provider";
import { useAudio } from "../providers/audio-provider";
import { dailyBriefs } from "../data/briefs";
import { articles } from "../data/articles";

function formatTime(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

function AudioMiniPlayerInner() {
  const { palette, resolvedTheme } = useTheme();
  const {
    state,
    currentBriefId,
    positionMs,
    durationMs,
    pause,
    resume,
    skipForward,
    skipBackward,
    stopBrief,
  } = useAudio();
  const segments = useSegments();
  const insets = useSafeAreaInsets();

  const isPlaying = state === "playing";
  const progress = durationMs > 0 ? positionMs / durationMs : 0;
  const progressPercent = `${Math.min(progress * 100, 100)}%`;

  const isInTabs = segments.some((s) => s === "(tabs)");
  const bottomPos = isInTabs ? 96 : Math.max(insets.bottom + 16, 24);

  const handlePlayPause = useCallback(() => {
    if (isPlaying) {
      pause();
    } else {
      resume();
    }
  }, [isPlaying, pause, resume]);

  const briefTitle = useMemo(() => {
    if (!currentBriefId) return "Daily Brief";
    const brief = dailyBriefs.find((b) => b.id === currentBriefId);
    if (brief) return brief.title;
    const article = articles.find((a) => a.id === currentBriefId);
    if (article) return article.title;
    return "Daily Brief";
  }, [currentBriefId]);

  if (state === "idle") {
    return null;
  }

  const tint = resolvedTheme === "dark" ? "dark" : "light";

  return (
    <Animated.View
      entering={SlideInDown.duration(250)}
      exiting={SlideOutDown.duration(250)}
      style={[styles.container, { bottom: bottomPos }]}
    >
      <View
        style={[
          styles.innerContainer,
          {
            borderColor: palette.outlineVariant + "26",
          },
        ]}
      >
        <BlurView
          intensity={80}
          tint={tint}
          style={[
            StyleSheet.absoluteFill,
            {
              borderTopLeftRadius: 40,
              borderTopRightRadius: 30,
              borderBottomRightRadius: 50,
              borderBottomLeftRadius: 35,
              backgroundColor: palette.surfaceContainerLowest + "E6",
            },
          ]}
        />

        {/* Progress bar */}
        <View
          style={[
            styles.progressTrack,
            { backgroundColor: palette.surfaceContainerHigh },
          ]}
        >
          <LinearGradient
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            colors={[palette.primary, palette.secondary, palette.tertiary]}
            style={[styles.progressFill, { width: progressPercent as any }]}
          />
        </View>

        {/* Controls row */}
        <View style={styles.controlsRow}>
          {/* Title area */}
          <View style={styles.titleArea}>
            <Text
              numberOfLines={1}
              style={[
                styles.briefTitle,
                { color: palette.onSurface },
              ]}
            >
              {briefTitle}
            </Text>
            <Text
              style={[
                styles.timeText,
                { color: palette.onSurfaceVariant },
              ]}
            >
              {formatTime(positionMs)} / {formatTime(durationMs)}
            </Text>
          </View>

          {/* Skip back */}
          <Pressable onPress={skipBackward} style={styles.controlButton}>
            <SkipBack size={16} color={palette.onSurface} />
          </Pressable>

          {/* Play/Pause */}
          <Pressable
            onPress={handlePlayPause}
            style={[
              styles.playButton,
              { backgroundColor: palette.primary },
            ]}
          >
            {isPlaying ? (
              <Pause
                size={18}
                color={palette.primaryForeground}
                fill={palette.primaryForeground}
              />
            ) : (
              <Play
                size={18}
                color={palette.primaryForeground}
                fill={palette.primaryForeground}
              />
            )}
          </Pressable>

          {/* Skip forward */}
          <Pressable onPress={skipForward} style={styles.controlButton}>
            <SkipForward size={16} color={palette.onSurface} />
          </Pressable>

          {/* Close */}
          <Pressable onPress={stopBrief} style={styles.controlButton}>
            <X size={16} color={palette.onSurfaceVariant} />
          </Pressable>
        </View>
      </View>
    </Animated.View>
  );
}

export const AudioMiniPlayer = memo(AudioMiniPlayerInner);

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    left: 16,
    right: 16,
    zIndex: 40,
  },
  innerContainer: {
    overflow: "hidden",
    borderWidth: 1,
    borderTopLeftRadius: 40,
    borderTopRightRadius: 30,
    borderBottomRightRadius: 50,
    borderBottomLeftRadius: 35,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 8,
  },
  progressTrack: {
    height: 3,
  },
  progressFill: {
    height: "100%",
  },
  controlsRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 4,
  },
  titleArea: {
    flex: 1,
  },
  briefTitle: {
    fontFamily: "Manrope_500Medium",
    fontSize: 12,
  },
  timeText: {
    fontFamily: "Manrope_400Regular",
    fontSize: 10,
  },
  controlButton: {
    width: 36,
    height: 36,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
  },
  playButton: {
    width: 44,
    height: 44,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
  },
});
