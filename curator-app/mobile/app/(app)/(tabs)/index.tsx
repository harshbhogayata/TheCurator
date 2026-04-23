import React, { useCallback, useEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  RefreshControl,
  StyleSheet,
} from "react-native";
import { PressableScale } from "../../../src/ui/animated-pressable";
import { SafeAreaView } from "react-native-safe-area-context";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";
import { Sparkles, Play, Pause, Lock, Quote } from "lucide-react-native";

import { useTheme } from "../../../src/providers/theme-provider";
import { useSubscription } from "../../../src/providers/subscription-provider";
import { useAudio } from "../../../src/providers/audio-provider";
import { useBriefs } from "../../../src/hooks/use-briefs";
import { useHeaderOffset } from "../../../src/lib/layout";
import { shape } from "../../../src/ui/tokens/spacing";
import { Header } from "../../../src/ui/header";
import { AdBanner } from "../../../src/ui/ad-banner";
import { BriefCardSkeleton } from "../../../src/ui/skeleton-loader";
import { PaywallModal } from "../../../src/ui/paywall-modal";
import { dailyBriefs } from "../../../src/data/briefs";

export default function BriefsScreen() {
  const { palette } = useTheme();
  const { hasAdFree, hasAudioAccess } = useSubscription();
  const { playBrief, state, currentBriefId, pause, resume } = useAudio();
  const { data: briefs = dailyBriefs, isFetching, refetch } = useBriefs();
  const headerOffset = useHeaderOffset();

  const [refreshing, setRefreshing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [paywallVisible, setPaywallVisible] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setIsLoading(false), 600);
    return () => clearTimeout(t);
  }, []);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    void refetch().finally(() => setRefreshing(false));
  }, [refetch]);

  const featuredBrief = briefs[0] ?? dailyBriefs[0];
  const moreBriefs = briefs.length > 1 ? briefs.slice(1) : dailyBriefs.slice(1);

  const handlePlayBrief = useCallback(
    (id: string, audioUrl: string) => {
      if (!hasAudioAccess) {
        setPaywallVisible(true);
        return;
      }

      if (currentBriefId === id) {
        if (state === "playing") pause();
        else resume();
      } else {
        playBrief(id, audioUrl);
      }
    },
    [hasAudioAccess, currentBriefId, state, playBrief, pause, resume]
  );

  return (
    <SafeAreaView
      edges={[]}
      style={{ flex: 1, backgroundColor: palette.background }}
    >
      <Header title="Briefs" showBadge={false} />

      <ScrollView
        showsVerticalScrollIndicator={false}
        removeClippedSubviews
        contentContainerStyle={{
          paddingTop: headerOffset,
          paddingBottom: 150,
          paddingHorizontal: 16,
        }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={palette.primary}
          />
        }
      >
        {!hasAdFree && (
          <View style={{ marginBottom: 16 }}>
            <AdBanner position="top" />
          </View>
        )}

        {!hasAudioAccess && (
          <View
            style={[
              styles.paywallNotice,
              {
                backgroundColor: palette.primaryContainer + "80", // /50
                borderColor: palette.outlineVariant + "26",
              },
            ]}
          >
            <View
              style={[
                styles.paywallIcon,
                { backgroundColor: palette.primary },
              ]}
            >
              <Lock size={20} color={palette.primaryForeground} />
            </View>
            <View style={{ flex: 1 }}>
              <Text
                style={[
                  styles.paywallTitle,
                  { color: palette.onSurface },
                ]}
              >
                Unlock Audio Briefs
              </Text>
              <Text
                style={[
                  styles.paywallText,
                  { color: palette.onSurfaceVariant },
                ]}
              >
                Subscribe to Premium to listen to audio versions of all articles and briefs.
              </Text>
            </View>
          </View>
        )}

        {isLoading || isFetching ? (
          <View style={{ gap: 24 }}>
            <BriefCardSkeleton />
            <BriefCardSkeleton />
            <BriefCardSkeleton />
          </View>
        ) : (
          <>
        {/* Featured Brief */}
        <View style={{ marginBottom: 40 }}>
          <View
            style={[
              styles.featuredCard,
              {
                backgroundColor: palette.surfaceContainerLowest + "B3",
                borderColor: palette.outlineVariant + "26",
              },
            ]}
          >
            <LinearGradient
              colors={[palette.primary, palette.secondary]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.featuredTagPill}
            >
              <View style={styles.featuredTagRow}>
                <Sparkles size={16} color={palette.primaryForeground} fill={palette.primaryForeground} />
                <Text style={[styles.featuredTagText, { color: palette.primaryForeground }]}>
                  Today's Featured
                </Text>
              </View>
            </LinearGradient>

            <View style={styles.featuredContentRow}>
              <View
                style={[
                  styles.featuredImage,
                  { borderColor: palette.outlineVariant + "4D" },
                ]}
              >
                <Image
                  source={{ uri: featuredBrief.imageUrl }}
                  style={StyleSheet.absoluteFill}
                  contentFit="cover"
                />
              </View>

              <View style={styles.featuredTextArea}>
                <Text
                  style={[
                    styles.featuredTitle,
                    { color: palette.onBackground },
                  ]}
                >
                  {featuredBrief.title}
                </Text>
                <View style={styles.featuredMetaRow}>
                  <Text style={[styles.featuredMetaText, { color: palette.outline }]}>
                    {featuredBrief.duration}
                  </Text>
                  <Text style={[styles.featuredMetaText, { color: palette.outline }]}>
                    •
                  </Text>
                  <Text style={[styles.featuredMetaText, { color: palette.outline }]}>
                    {featuredBrief.insights} insights
                  </Text>
                </View>
              </View>
            </View>

            {/* Summary text for non-subscribers */}
            {!hasAudioAccess && (
              <Text
                numberOfLines={3}
                style={[
                  styles.paywallText,
                  { color: palette.onSurfaceVariant, marginBottom: 16, fontSize: 13, lineHeight: 19 },
                ]}
              >
                {featuredBrief.summary}
              </Text>
            )}

            {/* Play Button Row */}
            <View style={styles.featuredPlayRow}>
              <Pressable
                onPress={() =>
                  handlePlayBrief(featuredBrief.id, featuredBrief.audioUrl)
                }
                style={[
                  styles.featuredPlayButton,
                  { backgroundColor: palette.inverseSurface },
                ]}
              >
                {!hasAudioAccess ? (
                  <Lock size={26} color={palette.inverseOnSurface} />
                ) : currentBriefId === featuredBrief.id && state === "playing" ? (
                  <Pause size={28} color={palette.inverseOnSurface} fill={palette.inverseOnSurface} />
                ) : (
                  <Play size={28} color={palette.inverseOnSurface} fill={palette.inverseOnSurface} style={{ marginLeft: 4 }} />
                )}
              </Pressable>
            </View>
          </View>
        </View>

        {!hasAdFree && <AdBanner position="inline" />}

        {/* More Briefs */}
        <View style={{ marginTop: 24, paddingHorizontal: 4 }}>
          <Text
            style={[
              styles.moreBriefsTitle,
              { color: palette.onSurface },
            ]}
          >
            More Briefs
          </Text>

          <View style={styles.moreBriefsList}>
            {moreBriefs.map((brief) => {
              const isPlaying =
                currentBriefId === brief.id && state === "playing";

              return (
                <PressableScale
                  key={brief.id}
                  onPress={() => handlePlayBrief(brief.id, brief.audioUrl)}
                  style={[
                    styles.briefItemCard,
                    {
                      backgroundColor: palette.surfaceContainerLowest + "B3",
                      borderColor: palette.outlineVariant + "26",
                    },
                  ]}
                >
                  <View style={styles.briefItemRow}>
                    <View
                      style={[
                        styles.briefItemPlayBtn,
                        { backgroundColor: palette.inverseSurface },
                      ]}
                    >
                      {!hasAudioAccess ? (
                        <Lock size={18} color={palette.inverseOnSurface} />
                      ) : isPlaying ? (
                        <Pause size={20} color={palette.inverseOnSurface} fill={palette.inverseOnSurface} />
                      ) : (
                        <Play size={20} color={palette.inverseOnSurface} fill={palette.inverseOnSurface} style={{ marginLeft: 2 }} />
                      )}
                    </View>

                    <View
                      style={[
                        styles.briefItemImage,
                        { borderColor: palette.outlineVariant + "33" },
                      ]}
                    >
                      <Image
                        source={{ uri: brief.imageUrl }}
                        style={StyleSheet.absoluteFill}
                        contentFit="cover"
                      />
                    </View>

                    <View style={styles.briefItemTextArea}>
                      <Text
                        style={[
                          styles.briefItemCategory,
                          { color: palette.outline },
                        ]}
                      >
                        {brief.category}
                      </Text>
                      <Text
                        numberOfLines={2}
                        style={[
                          styles.briefItemTitle,
                          { color: palette.onSurface },
                        ]}
                      >
                        {brief.title}
                      </Text>
                      <View style={styles.featuredMetaRow}>
                        <Text
                          style={[
                            styles.featuredMetaText,
                            { color: palette.outline, fontSize: 10 },
                          ]}
                        >
                          {brief.duration}
                        </Text>
                        <Text
                          style={[
                            styles.featuredMetaText,
                            { color: palette.outline, fontSize: 10 },
                          ]}
                        >
                          •
                        </Text>
                        <Text
                          style={[
                            styles.featuredMetaText,
                            { color: palette.outline, fontSize: 10 },
                          ]}
                        >
                          {brief.publishedDate}
                        </Text>
                      </View>
                      {!hasAudioAccess && (
                        <Text
                          numberOfLines={2}
                          style={{
                            fontFamily: "Manrope_400Regular",
                            fontSize: 12,
                            color: palette.onSurfaceVariant,
                            lineHeight: 17,
                            marginTop: 6,
                          }}
                        >
                          {brief.summary}
                        </Text>
                      )}
                    </View>
                  </View>
                </PressableScale>
              );
            })}
          </View>
        </View>

        {/* Editorial Quote */}
        <View style={{ marginTop: 32, marginHorizontal: 4 }}>
          <View
            style={[
              styles.quoteCard,
              {
                backgroundColor: palette.surfaceContainerLow,
                borderColor: palette.outlineVariant + "26",
              },
            ]}
          >
            <View
              style={[
                styles.decorativeCircle,
                { backgroundColor: palette.outlineVariant },
              ]}
            />
            <Quote
              size={48}
              color={palette.outline}
              style={{ opacity: 0.3, marginBottom: 24 }}
            />
            <Text style={[styles.quoteText, { color: palette.onBackground }]}>
              {"\u201CTruth is not a destination, but a distillation of perspectives.\u201D"}
            </Text>
            <Text style={[styles.quoteAttribution, { color: palette.outline }]}>
              {"\u2014 The Curator Editorial Board"}
            </Text>
          </View>
        </View>
          </>
        )}
      </ScrollView>

      <PaywallModal
        visible={paywallVisible}
        onClose={() => setPaywallVisible(false)}
        featureName="Audio Briefs"
        requiredTier="basic"
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  paywallNotice: {
    padding: 24,
    borderWidth: 1,
    ...shape.imageCard,
    flexDirection: "row",
    gap: 16,
    marginBottom: 24,
  },
  paywallIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  paywallTitle: {
    fontFamily: "Newsreader_500Medium_Italic",
    fontSize: 20,
    marginBottom: 8,
  },
  paywallText: {
    fontFamily: "Manrope_400Regular",
    fontSize: 14,
    lineHeight: 20,
  },
  featuredCard: {
    borderWidth: 1,
    padding: 24,
    borderTopLeftRadius: 60,
    borderTopRightRadius: 30,
    borderBottomRightRadius: 80,
    borderBottomLeftRadius: 40,
  },
  featuredTagRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  featuredTagPill: {
    alignSelf: "flex-start",
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 8,
    marginBottom: 20,
  },
  featuredTagText: {
    fontSize: 10,
    textTransform: "uppercase",
    letterSpacing: 1.5,
    fontFamily: "Manrope_500Medium",
  },
  featuredContentRow: {
    flexDirection: "column",
    alignItems: "center",
    gap: 24,
    marginBottom: 24,
  },
  featuredImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 4,
    overflow: "hidden",
  },
  featuredTextArea: {
    alignItems: "center",
  },
  featuredTitle: {
    fontFamily: "Newsreader_500Medium",
    fontSize: 28,
    textAlign: "center",
    lineHeight: 34,
    marginBottom: 12,
  },
  featuredMetaRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
  },
  featuredMetaText: {
    fontFamily: "Manrope_500Medium",
    fontSize: 12,
  },
  featuredPlayRow: {
    alignItems: "center",
    justifyContent: "center",
  },
  featuredPlayButton: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 12,
  },
  moreBriefsTitle: {
    fontFamily: "Newsreader_500Medium_Italic",
    fontSize: 26,
    marginBottom: 24,
  },
  moreBriefsList: {
    gap: 16,
  },
  briefItemCard: {
    borderWidth: 1,
    padding: 16,
    borderTopLeftRadius: 40,
    borderTopRightRadius: 25,
    borderBottomRightRadius: 50,
    borderBottomLeftRadius: 30,
  },
  briefItemRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
  briefItemPlayBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  briefItemImage: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 2,
    overflow: "hidden",
  },
  briefItemTextArea: {
    flex: 1,
  },
  briefItemCategory: {
    fontSize: 10,
    textTransform: "uppercase",
    letterSpacing: 1.5,
    fontFamily: "Manrope_500Medium",
    marginBottom: 4,
  },
  briefItemTitle: {
    fontFamily: "Newsreader_500Medium",
    fontSize: 18,
    lineHeight: 22,
    marginBottom: 8,
  },
  quoteCard: {
    borderRadius: 40,
    padding: 32,
    alignItems: "center",
    borderWidth: 1,
    overflow: "hidden",
  },
  decorativeCircle: {
    position: "absolute",
    top: -40,
    left: -40,
    width: 160,
    height: 160,
    borderRadius: 80,
    opacity: 0.15,
  },
  quoteText: {
    fontFamily: "Newsreader_500Medium_Italic",
    fontSize: 24,
    lineHeight: 30,
    letterSpacing: -0.1,
    textAlign: "center",
    marginBottom: 24,
  },
  quoteAttribution: {
    fontFamily: "Manrope_600SemiBold",
    fontSize: 10,
    lineHeight: 14,
    letterSpacing: 3,
  },
});
