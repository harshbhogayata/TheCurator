import React, { memo, useCallback, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";
import { Headphones, Lock, Pause, Play, SkipBack, SkipForward } from "lucide-react-native";
import { useRouter } from "expo-router";

import { useTheme } from "../providers/theme-provider";
import { useAudio } from "../providers/audio-provider";
import { useSubscription } from "../providers/subscription-provider";
import { PaywallModal } from "./paywall-modal";

interface ArticleAudioPlayerProps {
  articleId: string;
  audioUrl?: string;
  durationSec?: number;
  title: string;
}

function formatTime(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

function ArticleAudioPlayerInner({
  articleId,
  audioUrl,
  durationSec,
  title,
}: ArticleAudioPlayerProps) {
  const { palette } = useTheme();
  const router = useRouter();
  const { hasAudioAccess } = useSubscription();
  const {
    state,
    currentBriefId,
    positionMs,
    durationMs,
    playBrief,
    pause,
    resume,
    skipForward,
    skipBackward,
  } = useAudio();

  const [paywallVisible, setPaywallVisible] = useState(false);

  if (!audioUrl) return null;

  const isThisArticle = currentBriefId === articleId;
  const isPlaying = isThisArticle && state === "playing";
  const isLoading = isThisArticle && state === "loading";
  const isActive = isThisArticle && state !== "idle";

  const effectiveDurationMs =
    isActive && durationMs > 0 ? durationMs : (durationSec ?? 0) * 1000;
  const effectivePositionMs = isActive ? positionMs : 0;
  const progress =
    effectiveDurationMs > 0 ? effectivePositionMs / effectiveDurationMs : 0;
  const progressPercent = `${Math.min(progress * 100, 100)}%`;

  const handlePlayPause = useCallback(() => {
    if (!hasAudioAccess) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      setPaywallVisible(true);
      return;
    }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (!isActive) {
      playBrief(articleId, audioUrl);
      return;
    }
    if (isPlaying) {
      pause();
    } else {
      resume();
    }
  }, [
    hasAudioAccess,
    isActive,
    isPlaying,
    playBrief,
    pause,
    resume,
    articleId,
    audioUrl,
  ]);

  return (
    <>
      <View
        style={[
          styles.container,
          {
            backgroundColor: palette.surfaceContainerLow,
            borderColor: palette.outlineVariant + "33",
          },
        ]}
      >
        {/* Top row: icon + label + lock */}
        <View style={styles.headerRow}>
          <View
            style={[
              styles.iconBadge,
              { backgroundColor: palette.primaryContainer },
            ]}
          >
            <Headphones size={14} color={palette.onPrimaryContainer} />
          </View>
          <View style={styles.headerTextCol}>
            <Text
              style={[styles.kicker, { color: palette.onSurfaceVariant }]}
              numberOfLines={1}
            >
              LISTEN TO THIS STORY
            </Text>
            <Text
              style={[styles.durationText, { color: palette.outline }]}
              numberOfLines={1}
            >
              {hasAudioAccess
                ? `${formatTime(effectivePositionMs)} / ${formatTime(effectiveDurationMs)}`
                : "Subscriber exclusive"}
            </Text>
          </View>
          {!hasAudioAccess && (
            <View
              style={[
                styles.lockBadge,
                { backgroundColor: palette.surfaceContainerHigh },
              ]}
            >
              <Lock size={12} color={palette.onSurfaceVariant} />
            </View>
          )}
        </View>

        {/* Progress track */}
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

        {/* Controls */}
        <View style={styles.controlsRow}>
          <Pressable
            onPress={hasAudioAccess ? skipBackward : () => setPaywallVisible(true)}
            disabled={!isActive}
            style={[
              styles.controlButton,
              { backgroundColor: palette.surfaceContainerLowest },
              !isActive && { opacity: 0.4 },
            ]}
            accessibilityLabel="Skip back 15 seconds"
          >
            <SkipBack size={16} color={palette.onSurface} />
          </Pressable>

          <Pressable
            onPress={handlePlayPause}
            style={[
              styles.playButton,
              { backgroundColor: palette.primary },
            ]}
            accessibilityLabel={
              !hasAudioAccess
                ? "Unlock audio"
                : isPlaying
                  ? "Pause audio"
                  : "Play audio"
            }
          >
            {!hasAudioAccess ? (
              <Lock size={22} color={palette.primaryForeground} />
            ) : isLoading ? (
              <Text style={{ color: palette.primaryForeground, fontSize: 14 }}>
                …
              </Text>
            ) : isPlaying ? (
              <Pause
                size={22}
                color={palette.primaryForeground}
                fill={palette.primaryForeground}
              />
            ) : (
              <Play
                size={22}
                color={palette.primaryForeground}
                fill={palette.primaryForeground}
              />
            )}
          </Pressable>

          <Pressable
            onPress={hasAudioAccess ? skipForward : () => setPaywallVisible(true)}
            disabled={!isActive}
            style={[
              styles.controlButton,
              { backgroundColor: palette.surfaceContainerLowest },
              !isActive && { opacity: 0.4 },
            ]}
            accessibilityLabel="Skip forward 15 seconds"
          >
            <SkipForward size={16} color={palette.onSurface} />
          </Pressable>

          <View style={styles.titleCol}>
            <Text
              numberOfLines={2}
              style={[styles.title, { color: palette.onSurface }]}
            >
              {title}
            </Text>
          </View>
        </View>
      </View>

      <PaywallModal
        visible={paywallVisible}
        onClose={() => setPaywallVisible(false)}
        featureName="Narrated Stories"
        requiredTier="basic"
        onUpgrade={() => {
          setPaywallVisible(false);
          router.push("/(app)/donate");
        }}
      />
    </>
  );
}

export const ArticleAudioPlayer = memo(ArticleAudioPlayerInner);

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 16,
    marginBottom: 24,
    padding: 16,
    borderRadius: 28,
    borderWidth: 1,
    gap: 12,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  iconBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTextCol: {
    flex: 1,
    gap: 2,
  },
  kicker: {
    fontFamily: "Manrope_600SemiBold",
    fontSize: 10,
    textTransform: "uppercase",
    letterSpacing: 3,
  },
  durationText: {
    fontFamily: "Manrope_400Regular",
    fontSize: 11,
  },
  lockBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  progressTrack: {
    height: 3,
    borderRadius: 2,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
  },
  controlsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  controlButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  playButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  titleCol: {
    flex: 1,
    marginLeft: 4,
  },
  title: {
    fontFamily: "Newsreader_500Medium_Italic",
    fontSize: 13,
    lineHeight: 17,
  },
});
