import { useEffect, useRef, useState, useCallback, useMemo } from "react";
import {
  View,
  Text,
  Pressable,
  Share,
  ScrollView,
  StyleSheet,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { medium as hapticMedium } from "../../../src/lib/haptics";
import { type } from "../../../src/ui/tokens/typography";
import {
  ArrowLeft,
  Type,
  Bookmark,
  Share2,
  FolderPlus,
} from "lucide-react-native";

import { useLayout } from "../../../src/lib/layout";
import { useTheme } from "../../../src/providers/theme-provider";
import { useAuth } from "../../../src/providers/auth-provider";
import { useSavedArticles } from "../../../src/providers/saved-articles-provider";
import { useReadingPreferences } from "../../../src/providers/reading-preferences-provider";
import { useReadingStats } from "../../../src/providers/reading-stats-provider";
import { ReadingProgressBar } from "../../../src/ui/reading-progress-bar";
import { TypographySettings } from "../../../src/ui/typography-settings";
import { ArticleCard, getImageUrl } from "../../../src/ui/article-card";
import { ArticleAudioPlayer } from "../../../src/ui/article-audio-player";
import { AddToCollectionModal } from "../../../src/ui/add-to-collection-modal";
import { useArticle, useArticles } from "../../../src/hooks/use-articles";

function generateFallbackContent(excerpt: string, sources: string[]): string {
  return `This is a synthesized narrative from ${sources.length} trusted sources, providing a comprehensive view on the developments shaping our world today.

${excerpt}

Our editorial team has analyzed perspectives from leading publications and research institutions to bring you this distilled insight. The convergence of these viewpoints reveals patterns and implications that individual articles might miss.

This approach to journalism—aggregating and synthesizing multiple authoritative sources—represents a new paradigm in news consumption. Rather than presenting a single perspective, we offer a curated synthesis that respects the complexity of important issues while making them accessible.

The implications of these developments extend across multiple sectors and geographies. Understanding these connections is essential for making informed decisions in an increasingly interconnected world.

As this story continues to develop, we'll update this narrative with new insights from our network of sources, ensuring you have access to the most current and comprehensive understanding available.`;
}

export default function ArticleScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { palette } = useTheme();
  const { maxContentWidth } = useLayout();
  const { session } = useAuth();
  const { isArticleSaved, saveArticle, unsaveArticle } = useSavedArticles();
  const { fontSizeValue, lineHeightValue } = useReadingPreferences();
  const { recordArticleRead } = useReadingStats();
  const { data: article, isLoading: isArticleLoading } = useArticle(id ?? "");
  const { data: allArticles = [] } = useArticles();

  const [typographyVisible, setTypographyVisible] = useState(false);
  const [collectionModalVisible, setCollectionModalVisible] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);

  const startTime = useRef(Date.now());
  const scrollRef = useRef<ScrollView>(null);
  const savedScrollY = useRef(0);
  const scrollKey = `curator.scroll.${id}`;

  // Related articles: same category first, pad with others to always reach 3
  const relatedArticles = useMemo(() => {
    if (!article) return [];
    const sameCategory = allArticles.filter(
      (candidate) => candidate.id !== article.id && candidate.category === article.category,
    );
    if (sameCategory.length >= 3) return sameCategory.slice(0, 3);
    const others = allArticles.filter(
      (candidate) => candidate.id !== article.id && candidate.category !== article.category,
    );
    return [...sameCategory, ...others].slice(0, 3);
  }, [article, allArticles]);

  // Article content
  const articleContent = useMemo(() => {
    if (!article) return "";
    return article.content || generateFallbackContent(article.excerpt, article.sources);
  }, [article]);

  const paragraphs = useMemo(
    () => articleContent.split("\n\n").filter((p) => p.trim().length > 0),
    [articleContent],
  );

  // Reading session tracking
  useEffect(() => {
    startTime.current = Date.now();
    return () => {
      const readTimeMs = Date.now() - startTime.current;
      if (readTimeMs > 5000 && article?.id) {
        recordArticleRead(readTimeMs, article.id);
      }
    };
  }, [recordArticleRead, article?.id]);

  // Restore reading position
  useEffect(() => {
    AsyncStorage.getItem(scrollKey).then((val) => {
      if (!val) return;
      const y = parseInt(val, 10);
      if (y > 50) {
        setTimeout(() => scrollRef.current?.scrollTo({ y, animated: false }), 80);
      }
    });
  }, [scrollKey]);

  // Save reading position on unmount
  useEffect(() => {
    return () => {
      const y = savedScrollY.current;
      if (y > 50) {
        AsyncStorage.setItem(scrollKey, String(Math.floor(y)));
      } else {
        AsyncStorage.removeItem(scrollKey);
      }
    };
  }, [scrollKey]);

  // Auto-save when preference is enabled and article isn't already saved
  useEffect(() => {
    if (article && session?.preferences.autoSaveEnabled && !isArticleSaved(article.id)) {
      saveArticle(article.id);
    }
  }, [article, session?.preferences.autoSaveEnabled, isArticleSaved, saveArticle]);

  // Bookmark
  const isSaved = article ? isArticleSaved(article.id) : false;

  const toggleBookmark = useCallback(() => {
    if (!article) return;
    hapticMedium();
    if (isSaved) {
      unsaveArticle(article.id);
    } else {
      saveArticle(article.id);
    }
  }, [article, isSaved, saveArticle, unsaveArticle]);

  // Share
  const shareArticle = useCallback(async () => {
    if (!article) return;
    try {
      await Share.share({
        title: article.title,
        message: article.excerpt,
      });
    } catch {
      // user cancelled
    }
  }, [article]);

  // Scroll tracking
  const handleScroll = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      const { contentOffset, contentSize, layoutMeasurement } = event.nativeEvent;
      const y = contentOffset.y;
      savedScrollY.current = y;
      const maxScroll = contentSize.height - layoutMeasurement.height;
      if (maxScroll > 0) {
        setScrollProgress(Math.min(y / maxScroll, 1));
      }
    },
    [],
  );

  // Not found
  if (isArticleLoading) {
    return (
      <View style={[styles.notFound, { backgroundColor: palette.background }]}> 
        <Text
          style={{
            fontFamily: "Newsreader_500Medium",
            fontSize: 24,
            color: palette.onSurface,
            marginBottom: 16,
          }}
        >
          Loading article...
        </Text>
      </View>
    );
  }

  if (!article) {
    return (
      <View style={[styles.notFound, { backgroundColor: palette.background }]}>
        <Text
          style={{
            fontFamily: "Newsreader_500Medium",
            fontSize: 24,
            color: palette.onSurface,
            marginBottom: 16,
          }}
        >
          Article not found
        </Text>
        <Pressable
          onPress={() => router.back()}
          style={[styles.notFoundButton, { backgroundColor: palette.inverseSurface }]}
        >
          <Text
            style={{
              fontFamily: "Manrope_600SemiBold",
              fontSize: 14,
              color: palette.inverseOnSurface,
            }}
          >
            Go Back
          </Text>
        </Pressable>
      </View>
    );
  }

  const imageUrl = getImageUrl(article);

  return (
    <View style={[styles.root, { backgroundColor: palette.background }]}>
      {/* Reading Progress Bar */}
      <ReadingProgressBar progress={scrollProgress} />

      {/* Fixed Header */}
      <View
        style={[
          styles.header,
          { top: insets.top + 8 },
        ]}
      >
        {/* Back button */}
        <Pressable
          onPress={() => router.back()}
          accessibilityRole="button"
          accessibilityLabel="Go back"
          style={[
            styles.headerButton,
            { backgroundColor: palette.surfaceContainerLowest + "CC" },
          ]}
        >
          <ArrowLeft size={20} color={palette.onSurface} />
        </Pressable>

        {/* Right controls */}
        <View style={styles.headerRight}>
          <Pressable
            onPress={() => setTypographyVisible(true)}
            accessibilityRole="button"
            accessibilityLabel="Typography settings"
            style={[
              styles.headerButton,
              { backgroundColor: palette.surfaceContainerLowest + "CC" },
            ]}
          >
            <Type size={18} color={palette.onSurface} />
          </Pressable>
          <Pressable
            onPress={toggleBookmark}
            accessibilityRole="button"
            accessibilityLabel={isSaved ? "Remove bookmark" : "Bookmark article"}
            style={[
              styles.headerButton,
              { backgroundColor: palette.surfaceContainerLowest + "CC" },
            ]}
          >
            <Bookmark
              size={18}
              color={isSaved ? palette.primary : palette.onSurface}
              fill={isSaved ? palette.primary : "none"}
            />
          </Pressable>
          <Pressable
            onPress={() => setCollectionModalVisible(true)}
            accessibilityRole="button"
            accessibilityLabel="Add to collection"
            style={[
              styles.headerButton,
              { backgroundColor: palette.surfaceContainerLowest + "CC" },
            ]}
          >
            <FolderPlus size={18} color={palette.onSurface} />
          </Pressable>
          <Pressable
            onPress={shareArticle}
            accessibilityRole="button"
            accessibilityLabel="Share article"
            style={[
              styles.headerButton,
              { backgroundColor: palette.surfaceContainerLowest + "CC" },
            ]}
          >
            <Share2 size={18} color={palette.onSurface} />
          </Pressable>
        </View>
      </View>

      {/* Scrollable Content */}
      <ScrollView
        ref={scrollRef}
        scrollEventThrottle={16}
        onScroll={handleScroll}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingTop: insets.top + 64,
          paddingBottom: insets.bottom + 120,
          maxWidth: maxContentWidth,
          width: "100%",
          alignSelf: "center",
        }}
      >
        {/* Category Badge */}
        <View style={styles.categoryContainer}>
          <View
            style={[
              styles.categoryBadge,
              { backgroundColor: palette.secondaryContainer },
            ]}
          >
            <Text
              style={[
                styles.categoryText,
                { color: palette.onSecondaryContainer },
              ]}
            >
              {article.category}
            </Text>
          </View>
        </View>

        {/* Headline */}
        <Text
          accessibilityRole="header"
          style={[
            styles.headline,
            { color: palette.onSurface },
          ]}
        >
          {article.title}
        </Text>

        {/* Metadata Row */}
        <View style={styles.metaRow}>
          <Text style={[styles.metaText, { color: palette.outline }]}>
            {article.author}
          </Text>
          <Text style={[styles.metaDot, { color: palette.outline }]}>
            {"\u00B7"}
          </Text>
          <Text style={[styles.metaText, { color: palette.outline }]}>
            {article.publishedDate}
          </Text>
          <Text style={[styles.metaDot, { color: palette.outline }]}>
            {"\u00B7"}
          </Text>
          <Text style={[styles.metaText, { color: palette.outline }]}>
            {article.readTime}
          </Text>
        </View>

        {/* Hero Image */}
        <View
          style={[
            styles.heroImageContainer,
            {
              borderTopLeftRadius: 60,
              borderTopRightRadius: 30,
              borderBottomRightRadius: 80,
              borderBottomLeftRadius: 40,
            },
          ]}
        >
          <Image
            source={{ uri: imageUrl }}
            style={StyleSheet.absoluteFill}
            contentFit="cover"
            transition={200}
            accessibilityLabel={`Image for ${article.title}`}
          />
          <LinearGradient
            colors={["transparent", palette.background + "80"]}
            style={styles.heroGradient}
          />
        </View>

        {/* Sources */}
        <View style={styles.sourcesContainer}>
          <Text
            style={[
              styles.sourcesLabel,
              { color: palette.outline },
            ]}
          >
            SOURCES
          </Text>
          <View style={styles.sourcesRow}>
            {article.sources.map((source, index) => (
              <View
                key={`${source}-${index}`}
                style={[
                  styles.sourcePill,
                  {
                    backgroundColor: palette.surfaceContainerLow,
                    borderColor: palette.outlineVariant + "26",
                  },
                ]}
              >
                <Text
                  style={[
                    styles.sourceText,
                    { color: palette.onSurfaceVariant },
                  ]}
                >
                  {source}
                </Text>
              </View>
            ))}
          </View>
        </View>

        {/* Audio Player (subscriber-gated) */}
        <ArticleAudioPlayer
          articleId={article.id}
          audioUrl={article.audioUrl}
          durationSec={article.audioDurationSec}
          title={article.title}
        />

        {/* Article Body */}
        <View style={styles.bodyContainer}>
          {paragraphs.map((paragraph, index) => (
            <Text
              key={index}
              style={index === 0 ? {
                ...type.bodyLead,
                color: palette.onSurface,
                marginBottom: fontSizeValue * 1.6,
              } : {
                fontFamily: "Newsreader_400Regular",
                fontSize: fontSizeValue,
                lineHeight: fontSizeValue * lineHeightValue,
                color: palette.onSurface,
                marginBottom: fontSizeValue * 1.5,
              }}
            >
              {paragraph}
            </Text>
          ))}
        </View>

        {/* Similar Narratives */}
        {relatedArticles.length > 0 && (
          <View style={styles.relatedContainer}>
            <Text
              style={[
                styles.relatedTitle,
                { color: palette.onSurface },
              ]}
            >
              Similar Narratives
            </Text>
            {relatedArticles.map((relArticle) => (
              <View key={relArticle.id} style={styles.relatedCard}>
                <ArticleCard article={relArticle} variant="compact" />
              </View>
            ))}
          </View>
        )}
      </ScrollView>

      {/* Add to Collection Modal */}
      <AddToCollectionModal
        visible={collectionModalVisible}
        onClose={() => setCollectionModalVisible(false)}
        articleId={article.id}
      />

      {/* Typography Settings Modal */}
      <TypographySettings
        visible={typographyVisible}
        onClose={() => setTypographyVisible(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  notFound: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  notFoundButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 999,
  },

  // Header
  header: {
    position: "absolute",
    left: 16,
    right: 16,
    zIndex: 50,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  headerButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 4,
  },
  headerRight: {
    flexDirection: "row",
    gap: 8,
  },

  // Category
  categoryContainer: {
    paddingHorizontal: 16,
    marginBottom: 16,
    alignSelf: "flex-start",
  },
  categoryBadge: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 999,
  },
  categoryText: {
    ...type.overline,
  },

  // Headline
  headline: {
    ...type.headline,
    marginBottom: 16,
    paddingHorizontal: 16,
  },

  // Meta
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 16,
    marginBottom: 24,
    flexWrap: "wrap",
  },
  metaText: {
    ...type.overline,
    letterSpacing: 2,
  },
  metaDot: {
    ...type.caption,
  },

  // Hero Image
  heroImageContainer: {
    marginHorizontal: 16,
    height: 256,
    overflow: "hidden",
    marginBottom: 32,
  },
  heroGradient: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: "33%",
  },

  // Sources
  sourcesContainer: {
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  sourcesLabel: {
    ...type.overline,
    marginBottom: 8,
  },
  sourcesRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  sourcePill: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 999,
    borderWidth: 1,
  },
  sourceText: {
    fontFamily: "Manrope_500Medium",
    fontSize: 11,
  },

  // Body
  bodyContainer: {
    paddingHorizontal: 16,
  },

  // Related
  relatedContainer: {
    paddingHorizontal: 16,
    marginBottom: 32,
  },
  relatedTitle: {
    ...type.headlineMd,
    marginBottom: 16,
  },
  relatedCard: {
    marginBottom: 16,
  },
});
