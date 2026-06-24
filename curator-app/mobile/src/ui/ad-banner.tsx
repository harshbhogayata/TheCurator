import React, { memo, useCallback, useMemo, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { ExternalLink, X } from "lucide-react-native";
import { useRouter } from "expo-router";

import { useTheme } from "../providers/theme-provider";
import { useSubscription } from "../providers/subscription-provider";

interface AdBannerProps {
  position?: "top" | "inline" | "feed";
  onClose?: () => void;
}

const SUPPORT_VARIANTS = [
  {
    title: "Go ad-free",
    description: "Support independent journalism with Basic — from ₹499/mo.",
  },
  {
    title: "Reader-supported",
    description: "Upgrade to remove promos and unlock more saves.",
  },
  {
    title: "Support The Curator",
    description: "Help us stay independent. Plans start at ₹499/mo.",
  },
] as const;

function AdBannerInner({ position = "inline", onClose }: AdBannerProps) {
  const { palette } = useTheme();
  const { tier, isTierResolving } = useSubscription();
  const router = useRouter();
  const [dismissed, setDismissed] = useState(false);

  const supportVariant = useMemo(() => {
    const index = Math.floor(Math.random() * SUPPORT_VARIANTS.length);
    return SUPPORT_VARIANTS[index];
  }, []);

  const handleClose = useCallback(() => {
    setDismissed(true);
    onClose?.();
  }, [onClose]);

  if (isTierResolving || tier !== "free" || dismissed) {
    return null;
  }

  if (position === "feed") {
    return (
      <View style={styles.feedWrap}>
        <View style={[styles.feedRule, { backgroundColor: palette.outlineVariant + "33" }]} />
        <View style={styles.feedRow}>
          <View style={{ flex: 1 }}>
            <Text style={[styles.feedEyebrow, { color: palette.outline }]}>SUPPORT CURATOR</Text>
            <Text style={[styles.feedTitle, { color: palette.onSurface }]}>{supportVariant.title}</Text>
            <Text style={[styles.feedCopy, { color: palette.onSurfaceVariant }]}>
              {supportVariant.description}
            </Text>
          </View>
          <Pressable
            onPress={() => router.push("/(app)/donate")}
            style={[styles.feedCta, { borderColor: palette.outlineVariant + "55" }]}
          >
            <Text style={[styles.feedCtaText, { color: palette.onSurface }]}>Upgrade</Text>
            <ExternalLink size={12} color={palette.onSurface} />
          </Pressable>
        </View>
        <View style={[styles.feedRule, { backgroundColor: palette.outlineVariant + "33" }]} />
      </View>
    );
  }

  return (
    <View
      style={[
        styles.container,
        { borderColor: palette.outlineVariant + "26" },
      ]}
    >
      <LinearGradient
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        colors={[palette.surfaceContainerLow, palette.surfaceContainer]}
        style={styles.gradient}
      >
        <View style={styles.content}>
          <View style={styles.textArea}>
            <Text
              style={[
                styles.adLabel,
                { color: palette.outline },
              ]}
            >
              SUPPORT CURATOR
            </Text>
            <Text
              style={[
                styles.adTitle,
                { color: palette.onSurface },
              ]}
            >
              {supportVariant.title}
            </Text>
            <Text
              style={[
                styles.adDescription,
                { color: palette.onSurfaceVariant },
              ]}
            >
              {supportVariant.description}
            </Text>
          </View>
          <Pressable
            onPress={() => router.push("/(app)/donate")}
            style={[
              styles.ctaButton,
              { backgroundColor: palette.inverseSurface },
            ]}
          >
            <Text
              style={[
                styles.ctaText,
                { color: palette.inverseOnSurface },
              ]}
            >
              UPGRADE
            </Text>
          </Pressable>
          <Pressable
            onPress={handleClose}
            style={styles.closeButton}
            hitSlop={8}
          >
            <X size={14} color={palette.outline} />
          </Pressable>
        </View>
      </LinearGradient>
    </View>
  );
}

export const AdBanner = memo(AdBannerInner);

const styles = StyleSheet.create({
  container: {
    borderRadius: 16,
    overflow: "hidden",
    borderWidth: 1,
  },
  gradient: {
    width: "100%",
  },
  content: {
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  textArea: {
    flex: 1,
  },
  adLabel: {
    fontFamily: "Manrope_500Medium",
    fontSize: 8,
    letterSpacing: 2,
    textTransform: "uppercase",
  },
  adTitle: {
    fontFamily: "Manrope_600SemiBold",
    fontSize: 14,
    marginTop: 4,
  },
  adDescription: {
    fontFamily: "Manrope_400Regular",
    fontSize: 12,
    marginTop: 2,
  },
  ctaButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 999,
  },
  ctaText: {
    fontFamily: "Manrope_600SemiBold",
    fontSize: 10,
    textTransform: "uppercase",
  },
  closeButton: {
    width: 24,
    height: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  feedWrap: {
    gap: 16,
    paddingVertical: 8,
  },
  feedRule: {
    height: StyleSheet.hairlineWidth,
    width: "100%",
  },
  feedRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    paddingHorizontal: 4,
  },
  feedEyebrow: {
    fontFamily: "Manrope_500Medium",
    fontSize: 9,
    letterSpacing: 2,
    textTransform: "uppercase",
  },
  feedTitle: {
    fontFamily: "Newsreader_500Medium",
    fontSize: 18,
    marginTop: 4,
  },
  feedCopy: {
    fontFamily: "Manrope_400Regular",
    fontSize: 13,
    lineHeight: 18,
    marginTop: 4,
  },
  feedCta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  feedCtaText: {
    fontFamily: "Manrope_600SemiBold",
    fontSize: 12,
  },
});
