import React, { memo, useCallback } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Image } from "expo-image";
import { Bookmark, Headphones } from "lucide-react-native";
import { LinearGradient } from "expo-linear-gradient";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";
import { useRouter } from "expo-router";

import { useTheme } from "../providers/theme-provider";
import { useSavedArticles } from "../providers/saved-articles-provider";
import { useReduceMotion } from "../hooks/use-motion";
import { medium as hapticMedium } from "../lib/haptics";
import { type } from "./tokens/typography";
import { shape } from "./tokens/spacing";
import type { Article } from "../data/articles";
import { IMAGES } from "../data/images";

interface ArticleCardProps {
  article: Article;
  variant?: "default" | "compact" | "featured";
  onPress?: () => void;
  showSaveButton?: boolean;
}

export function getImageUrl(article: Article): string {
  const query = article.imageQuery.toLowerCase();

  if (query.includes("modern architecture shadows geometric")) return IMAGES.editorial.economy;
  if (query.includes("futuristic circuit board technology dark")) return IMAGES.editorial.technology;
  if (query.includes("climate environment nature earth")) return IMAGES.briefs.climate;
  if (query.includes("culture art museum gallery")) return IMAGES.editorial.brief;
  if (query.includes("health wellness medicine medical")) return IMAGES.profile.woman;
  if (query.includes("politics government capitol building")) return IMAGES.editorial.avatar;
  if (query.includes("science research laboratory discovery")) return IMAGES.hero.welcome;

  return IMAGES.editorial.brief;
}

function ArticleCardInner({
  article,
  variant = "default",
  onPress,
  showSaveButton = true,
}: ArticleCardProps) {
  const { palette } = useTheme();
  const { isArticleSaved, saveArticle, unsaveArticle } = useSavedArticles();
  const router = useRouter();

  const scale = useSharedValue(1);
  const reduceMotion = useReduceMotion();
  const isSaved = isArticleSaved(article.id);
  const imageUrl = getImageUrl(article);

  const pressAnimationStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = useCallback(() => {
    if (!reduceMotion) scale.value = withSpring(0.98, { damping: 15, stiffness: 150 });
  }, [scale, reduceMotion]);

  const handlePressOut = useCallback(() => {
    if (!reduceMotion) scale.value = withSpring(1, { damping: 15, stiffness: 150 });
  }, [scale, reduceMotion]);

  const handleNavigate = useCallback(() => {
    if (onPress) {
      onPress();
    } else {
      router.push(`/(app)/article/${article.id}`);
    }
  }, [onPress, router, article.id]);

  const handleBookmarkPress = useCallback(() => {
    hapticMedium();
    if (isSaved) {
      unsaveArticle(article.id);
    } else {
      saveArticle(article.id);
    }
  }, [isSaved, article.id, saveArticle, unsaveArticle]);

  if (variant === "compact") {
    return (
      <Animated.View style={pressAnimationStyle}>
      <Pressable
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        onPress={handleNavigate}
        style={styles.compactContainer}
        accessibilityRole="button"
        accessibilityLabel={article.title}
        accessibilityHint="Opens article"
      >
        <View
          style={[
            styles.compactImage,
            shape.imageCard,
            { borderColor: palette.outlineVariant + "26" },
          ]}
        >
          <Image
            source={{ uri: imageUrl }}
            style={StyleSheet.absoluteFill}
            contentFit="cover"
            transition={200}
          />
        </View>
        <View style={styles.compactContent}>
          <Text
            style={[
              styles.compactCategory,
              { color: palette.outline },
            ]}
          >
            {article.category}
          </Text>
          <Text
            numberOfLines={2}
            style={[
              styles.compactTitle,
              { color: palette.onSurface },
            ]}
          >
            {article.title}
          </Text>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
            <Text style={[styles.compactReadTime, { color: palette.outline }]}>
              {article.readTime}
            </Text>
            {article.audioUrl ? (
              <Headphones size={11} color={palette.outline} />
            ) : null}
          </View>
        </View>
        {showSaveButton && (
          <Pressable
            onPress={handleBookmarkPress}
            style={styles.compactBookmark}
            accessibilityRole="button"
            accessibilityLabel={isSaved ? "Remove from saved" : "Save article"}
          >
            <Bookmark
              size={16}
              color={isSaved ? palette.primary : palette.onSurface}
              fill={isSaved ? palette.primary : "none"}
            />
          </Pressable>
        )}
      </Pressable>
      </Animated.View>
    );
  }

  // Default and Featured variants share the same layout
  return (
    <Animated.View style={pressAnimationStyle}>
      <Pressable
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        onPress={handleNavigate}
        accessibilityRole="button"
        accessibilityLabel={article.title}
        accessibilityHint="Opens article"
      >
        {/* Image container */}
        <View
          style={[
            styles.imageContainer,
            styles.imageShadow,
            shape.imageHero,
            { borderColor: palette.outlineVariant + "26" },
          ]}
        >
          <Image
            source={{ uri: imageUrl }}
            style={{ width: "100%", height: "100%" }}
            contentFit="cover"
            transition={200}
          />
          <LinearGradient
            colors={["transparent", palette.inverseSurface + "B3"]}
            style={StyleSheet.absoluteFill}
          />

          {/* Save button */}
          {showSaveButton && (
            <Pressable
              onPress={handleBookmarkPress}
              style={[
                styles.saveButton,
                { backgroundColor: palette.surfaceContainerLowest + "CC" },
              ]}
              accessibilityRole="button"
              accessibilityLabel={isSaved ? "Remove from saved" : "Save article"}
            >
              <Bookmark
                size={16}
                color={isSaved ? palette.primary : palette.onSurface}
                fill={isSaved ? palette.primary : "none"}
              />
            </Pressable>
          )}

          {/* Audio available badge */}
          {article.audioUrl ? (
            <View
              style={[
                styles.audioBadge,
                { backgroundColor: palette.surfaceContainerLowest + "CC" },
              ]}
            >
              <Headphones size={12} color={palette.onSurface} />
            </View>
          ) : null}

          {/* Source badges at bottom */}
          <View style={styles.sourcesRow}>
            {article.sources.slice(0, 4).map((source, index) => (
              <View
                key={`${source}-${index}`}
                style={[
                  styles.sourceCircle,
                  {
                    backgroundColor: palette.surfaceContainerLowest,
                    borderColor: palette.inverseSurface + "33",
                    marginLeft: index > 0 ? -10 : 0,
                    zIndex: 10 - index,
                  },
                ]}
              >
                <Text style={[styles.sourceText, { color: palette.onSurface }]}>
                  {source.slice(0, 2).toUpperCase()}
                </Text>
              </View>
            ))}
            {article.sources.length > 4 && (
              <View
                style={[
                  styles.sourceCircle,
                  {
                    backgroundColor: palette.surfaceContainerHigh,
                    borderColor: palette.inverseSurface + "33",
                    marginLeft: -10,
                    zIndex: 5,
                  },
                ]}
              >
                <Text style={[styles.sourceText, { color: palette.onSurfaceVariant }]}>
                  +{article.sources.length - 4}
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* Content below image */}
        <View style={styles.contentBelow}>
          <Text
            numberOfLines={2}
            style={[
              styles.defaultTitle,
              { color: palette.onSurface },
            ]}
          >
            {article.title}
          </Text>
          <Text
            numberOfLines={2}
            style={[
              styles.defaultExcerpt,
              { color: palette.onSurfaceVariant },
            ]}
          >
            {article.excerpt}
          </Text>
          <View style={styles.metaRow}>
            <Text
              style={[
                styles.metaText,
                { color: palette.outline },
              ]}
            >
              {article.category.toUpperCase()}
            </Text>
            <Text
              style={[
                styles.metaText,
                { color: palette.outline },
              ]}
            >
              ·
            </Text>
            <Text
              style={[
                styles.metaText,
                { color: palette.outline },
              ]}
            >
              {article.readTime.toUpperCase()}
            </Text>
          </View>
        </View>
      </Pressable>
    </Animated.View>
  );
}

export const ArticleCard = memo(ArticleCardInner);

const styles = StyleSheet.create({
  imageContainer: {
    height: 300,
    overflow: "hidden",
    borderWidth: 1,
  },
  imageShadow: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 12,
  },
  saveButton: {
    position: "absolute",
    top: 12,
    right: 12,
    zIndex: 10,
    width: 36,
    height: 36,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
  },
  audioBadge: {
    position: "absolute",
    top: 12,
    left: 12,
    zIndex: 10,
    width: 30,
    height: 30,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
  },
  sourcesRow: {
    position: "absolute",
    bottom: 24,
    left: 24,
    flexDirection: "row",
    alignItems: "center",
  },
  sourceCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
  },
  sourceText: {
    fontFamily: "Manrope_600SemiBold",
    fontSize: 9,
    letterSpacing: -0.3,
  },
  contentBelow: {
    gap: 12,
    paddingTop: 16,
  },
  defaultTitle: {
    ...type.title,
  },
  defaultExcerpt: {
    ...type.labelSm,
    opacity: 0.8,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
  metaText: {
    ...type.overline,
  },
  // Compact variant
  compactContainer: {
    flexDirection: "row",
    gap: 16,
    alignItems: "center",
  },
  compactImage: {
    width: 80,
    aspectRatio: 1,
    overflow: "hidden",
    borderWidth: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 6,
  },
  compactContent: {
    flex: 1,
    minWidth: 0,
    justifyContent: "center",
    gap: 4,
  },
  compactCategory: {
    ...type.overline,
    letterSpacing: 1.5,
  },
  compactTitle: {
    ...type.titleSm,
  },
  compactReadTime: {
    ...type.caption,
  },
  compactBookmark: {
    alignSelf: "center",
    padding: 8,
  },
});
