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
import { openExternalUrl } from "../../../src/lib/open-url";
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

import {
  ARTICLE_FONT_SIZE_MAP,
  ARTICLE_LINE_HEIGHT_MAP,
  loadArticleTypography,
  saveArticleTypography,
  type ArticleTypographyPreferences,
} from "../../../src/lib/article-typography";
import type { LineHeight, TextSize } from "../../../src/lib/types";
import { useLayout } from "../../../src/lib/layout";
import { useTheme } from "../../../src/providers/theme-provider";
import { useAuth } from "../../../src/providers/auth-provider";
import { useSavedArticles } from "../../../src/providers/saved-articles-provider";
import { useReadingPreferences } from "../../../src/providers/reading-preferences-provider";
import { useReadingStats } from "../../../src/providers/reading-stats-provider";
import { useSubscription } from "../../../src/providers/subscription-provider";
import { ReadingProgressBar } from "../../../src/ui/reading-progress-bar";
import { TypographySettings } from "../../../src/ui/typography-settings";
import { ArticleCard, getImageUrl } from "../../../src/ui/article-card";
import { ArticleAudioPlayer } from "../../../src/ui/article-audio-player";
import { AddToCollectionModal } from "../../../src/ui/add-to-collection-modal";
import { ArticleLoadingView } from "../../../src/ui/article-loading-view";
import { useUpgradeGate } from "../../../src/providers/upgrade-gate-provider";
import { useArticle, useArticles } from "../../../src/hooks/use-articles";
import { useEmailVerificationGate } from "../../../src/providers/email-verification-gate-provider";
import { UNVERIFIED_ARTICLE_READ_LIMIT } from "../../../src/lib/email-verification";

const MIN_READ_TIME_MS = 3_000;
const SCROLL_PERSIST_MIN_Y = 50;

export default function ArticleScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { palette } = useTheme();
  const { maxContentWidth } = useLayout();
  const { session } = useAuth();
  const { isArticleSaved, saveArticle, unsaveArticle, isHydrated } = useSavedArticles();
  const { preferences: globalReadingPrefs, fontSizeValue: globalFontSizeValue, lineHeightValue: globalLineHeightValue } = useReadingPreferences();
  const { recordArticleRead } = useReadingStats();
  const { hasCollections } = useSubscription();
  const { requestUpgrade } = useUpgradeGate();
  const { data: article, isLoading: isArticleLoading, isError: isArticleError, refetch } = useArticle(id ?? "");
  const { data: allArticles = [] } = useArticles();
  const { registerArticleOpen, isGateHydrated, needsVerify } = useEmailVerificationGate();
  const [articleGateAllowed, setArticleGateAllowed] = useState(false);
  const [gateResolved, setGateResolved] = useState(false);

  const [typographyVisible, setTypographyVisible] = useState(false);
  const [articleTypography, setArticleTypography] = useState<ArticleTypographyPreferences | null>(null);
  const [collectionModalVisible, setCollectionModalVisible] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);

  const startTime = useRef(Date.now());
  const scrollRef = useRef<ScrollView>(null);
  const savedScrollY = useRef(0);
  const isArticleSavedRef = useRef(isArticleSaved);
  const pendingScrollY = useRef<number | null>(null);
  const scrollPersistTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const scrollKey = `curator.scroll.${id}`;

  useEffect(() => {
    isArticleSavedRef.current = isArticleSaved;
  }, [isArticleSaved]);

  useEffect(() => {
    if (!article?.id) return;
    if (needsVerify && !isGateHydrated) {
      setGateResolved(false);
      return;
    }
    setArticleGateAllowed(registerArticleOpen(article.id));
    setGateResolved(true);
  }, [article?.id, isGateHydrated, needsVerify, registerArticleOpen]);

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    void loadArticleTypography(id).then((prefs) => {
      if (!cancelled) setArticleTypography(prefs);
    });
    return () => {
      cancelled = true;
    };
  }, [id]);

  const fontSizeValue = articleTypography
    ? ARTICLE_FONT_SIZE_MAP[articleTypography.fontSize]
    : globalFontSizeValue;
  const lineHeightValue = articleTypography
    ? ARTICLE_LINE_HEIGHT_MAP[articleTypography.lineHeight]
    : globalLineHeightValue;

  const handleArticleFontSizeChange = useCallback(
    (size: TextSize) => {
      if (!id) return;
      const next: ArticleTypographyPreferences = {
        fontSize: size,
        lineHeight: articleTypography?.lineHeight ?? globalReadingPrefs.lineHeight,
      };
      setArticleTypography(next);
      void saveArticleTypography(id, next);
    },
    [articleTypography, globalReadingPrefs.lineHeight, id],
  );

  const handleArticleLineHeightChange = useCallback(
    (height: LineHeight) => {
      if (!id) return;
      const next: ArticleTypographyPreferences = {
        fontSize: articleTypography?.fontSize ?? globalReadingPrefs.fontSize,
        lineHeight: height,
      };
      setArticleTypography(next);
      void saveArticleTypography(id, next);
    },
    [articleTypography, globalReadingPrefs.fontSize, id],
  );

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
    return article.content?.trim() ?? "";
  }, [article]);

  const paragraphs = useMemo(
    () => articleContent.split("\n\n").filter((p) => p.trim().length > 0),
    [articleContent],
  );

  const sourceItems = useMemo(() => {
    if (!article) return [];
    if (article.sourceLinks?.length) {
      return article.sourceLinks
        .map((link) => ({
          label: link.name?.trim() || "Source",
          url: link.url?.trim() || "",
        }))
        .filter((item) => item.label);
    }
    return article.sources.map((name) => ({ label: name, url: "" }));
  }, [article]);

  // Reading session tracking + optional auto-save after meaningful read time
  useEffect(() => {
    startTime.current = Date.now();
    return () => {
      const readTimeMs = Date.now() - startTime.current;
      const articleId = article?.id;
      if (readTimeMs >= MIN_READ_TIME_MS && articleId) {
        recordArticleRead(readTimeMs, articleId);
        if (
          isHydrated &&
          session?.preferences.autoSaveEnabled &&
          isArticleSavedRef.current(articleId) === false
        ) {
          saveArticle(articleId);
        }
      }
    };
  }, [article?.id, isHydrated, recordArticleRead, saveArticle, session?.preferences.autoSaveEnabled]);

  const restoreScrollPosition = useCallback((y: number) => {
    if (y <= SCROLL_PERSIST_MIN_Y) {
      return;
    }
    pendingScrollY.current = y;
    scrollRef.current?.scrollTo({ y, animated: false });
  }, []);

  const persistScrollPosition = useCallback(
    (y: number) => {
      if (y > SCROLL_PERSIST_MIN_Y) {
        void AsyncStorage.setItem(scrollKey, String(Math.floor(y)));
      } else {
        void AsyncStorage.removeItem(scrollKey);
      }
    },
    [scrollKey],
  );

  // Restore reading position after content layout
  useEffect(() => {
    pendingScrollY.current = null;
    void AsyncStorage.getItem(scrollKey).then((val) => {
      if (!val) return;
      const y = parseInt(val, 10);
      if (!Number.isFinite(y)) return;
      restoreScrollPosition(y);
    });
  }, [restoreScrollPosition, scrollKey]);

  useEffect(() => {
    return () => {
      if (scrollPersistTimer.current) {
        clearTimeout(scrollPersistTimer.current);
      }
      persistScrollPosition(savedScrollY.current);
    };
  }, [persistScrollPosition, scrollKey]);

  const savedState = article ? isArticleSaved(article.id) : null;
  const isSaved = savedState === true;

  const toggleBookmark = useCallback(() => {
    if (!article || savedState === null) return;
    hapticMedium();
    if (isSaved) {
      unsaveArticle(article.id);
    } else {
      saveArticle(article.id);
    }
  }, [article, savedState, isSaved, saveArticle, unsaveArticle]);

  const openCollectionModal = useCallback(() => {
    if (!hasCollections) {
      requestUpgrade({
        featureName: "collections",
        requiredTier: "basic",
      });
      return;
    }
    setCollectionModalVisible(true);
  }, [hasCollections, requestUpgrade]);

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

      if (scrollPersistTimer.current) {
        clearTimeout(scrollPersistTimer.current);
      }
      scrollPersistTimer.current = setTimeout(() => {
        persistScrollPosition(y);
      }, 400);
    },
    [persistScrollPosition],
  );

  const handleContentSizeChange = useCallback(() => {
    if (pendingScrollY.current === null) {
      return;
    }
    scrollRef.current?.scrollTo({ y: pendingScrollY.current, animated: false });
    pendingScrollY.current = null;
  }, []);

  // Loading
  if (isArticleLoading || (needsVerify && article && !gateResolved)) {
    return <ArticleLoadingView />;
  }

  if (isArticleError) {
    return (
      <View style={[styles.notFound, { backgroundColor: palette.background }]}>
        <Text
          style={{
            fontFamily: "Newsreader_500Medium",
            fontSize: 24,
            color: palette.onSurface,
            marginBottom: 16,
            textAlign: "center",
          }}
        >
          We couldn't load this article
        </Text>
        <Pressable
          onPress={() => void refetch()}
          style={[styles.notFoundButton, { backgroundColor: palette.inverseSurface }]}
        >
          <Text
            style={{
              fontFamily: "Manrope_600SemiBold",
              fontSize: 14,
              color: palette.inverseOnSurface,
            }}
          >
            Try Again
          </Text>
        </Pressable>
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

  if (!articleGateAllowed && gateResolved) {
    return (
      <View style={[styles.notFound, { backgroundColor: palette.background }]}>
        <Pressable
          onPress={() => router.back()}
          style={[styles.notFoundButton, { alignSelf: "flex-start", marginBottom: 24, backgroundColor: palette.surfaceContainer }]}
        >
          <Text style={{ fontFamily: "Manrope_600SemiBold", fontSize: 14, color: palette.onSurface }}>
            Back
          </Text>
        </Pressable>
        <Text
          style={{
            fontFamily: "Newsreader_500Medium",
            fontSize: 24,
            color: palette.onSurface,
            marginBottom: 12,
            textAlign: "center",
          }}
        >
          Verify your email to keep reading
        </Text>
        <Text
          style={{
            fontFamily: "Manrope_400Regular",
            fontSize: 15,
            color: palette.onSurfaceVariant,
            textAlign: "center",
            lineHeight: 22,
            paddingHorizontal: 24,
          }}
        >
          You've used your {UNVERIFIED_ARTICLE_READ_LIMIT} free stories. Confirm your inbox to unlock unlimited reading.
        </Text>
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
            disabled={savedState === null}
            accessibilityRole="button"
            accessibilityLabel={isSaved ? "Remove bookmark" : "Bookmark article"}
            accessibilityState={{ disabled: savedState === null }}
            style={[
              styles.headerButton,
              { backgroundColor: palette.surfaceContainerLowest + "CC" },
              savedState === null && { opacity: 0.4 },
            ]}
          >
            <Bookmark
              size={18}
              color={isSaved ? palette.primary : palette.onSurface}
              fill={isSaved ? palette.primary : "none"}
            />
          </Pressable>
          <Pressable
            onPress={openCollectionModal}
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
        onContentSizeChange={handleContentSizeChange}
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
            {sourceItems.map((source, index) => {
              const canOpen = Boolean(source.url);
              const pill = (
                <View
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
                      { color: canOpen ? palette.primary : palette.onSurfaceVariant },
                    ]}
                  >
                    {source.label}
                  </Text>
                </View>
              );

              if (!canOpen) {
                return (
                  <View key={`${source.label}-${index}`}>
                    {pill}
                  </View>
                );
              }

              return (
                <Pressable
                  key={`${source.label}-${index}`}
                  accessibilityRole="link"
                  accessibilityLabel={`Open source ${source.label}`}
                  onPress={() => {
                    void openExternalUrl(source.url, "source");
                  }}
                >
                  {pill}
                </Pressable>
              );
            })}
          </View>
        </View>

        {/* Audio Player (subscriber-gated) */}
        <ArticleAudioPlayer
          articleId={article.id}
          audioUrl={article.audioUrl}
          durationSec={article.audioDurationSec}
          hasAudioAvailable={article.hasAudioAvailable}
          readTimeMinutes={article.readTimeMinutes}
          title={article.title}
        />

        {/* Article Body */}
        <View style={styles.bodyContainer}>
          {paragraphs.length > 0 ? paragraphs.map((paragraph, index) => (
            <Text
              key={index}
              style={index === 0 ? {
                fontFamily: "Newsreader_400Regular",
                fontSize: fontSizeValue + 2,
                lineHeight: (fontSizeValue + 2) * lineHeightValue,
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
          )) : (
            <Text style={[styles.unavailableCopy, { color: palette.onSurfaceVariant }]}>
              The full narrative is not available right now.
            </Text>
          )}
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
        scope="article"
        articleTypography={articleTypography}
        onArticleFontSizeChange={handleArticleFontSizeChange}
        onArticleLineHeightChange={handleArticleLineHeightChange}
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
  unavailableCopy: {
    fontFamily: "Manrope_400Regular",
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 32,
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
