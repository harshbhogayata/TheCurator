import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  RefreshControl,
  StyleSheet,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { FlashList } from "@shopify/flash-list";
import { Search as SearchIcon } from "lucide-react-native";
import { select as hapticSelect } from "../../../src/lib/haptics";
import { useLayout, useTabScrollPaddingTop, TAB_HERO_GAP } from "../../../src/lib/layout";
import { type } from "../../../src/ui/tokens/typography";

import { useTheme } from "../../../src/providers/theme-provider";
import { useSubscription } from "../../../src/providers/subscription-provider";
import { ErrorState } from "../../../src/ui/error-state";
import { MembershipSyncBanner } from "../../../src/ui/membership-sync-banner";
import { UnverifiedTrialBanner } from "../../../src/ui/unverified-trial-banner";
import { Header } from "../../../src/ui/header";
import { ArticleCard } from "../../../src/ui/article-card";
import { AdBanner } from "../../../src/ui/ad-banner";
import { ArticleCardSkeleton } from "../../../src/ui/skeleton-loader";
import type { Article } from "../../../src/data/articles";
import { useArticles } from "../../../src/hooks/use-articles";
import { useCategories } from "../../../src/hooks/use-categories";

function normalizeCategory(value: string): string {
  return value.trim().toLowerCase().replace(/[\s_]+/g, "-");
}

function formatCategoryLabel(value: string): string {
  return value
    .replace(/[-_]+/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function articleLocalDay(article: Article): Date | null {
  const raw = article.publishedAt ?? article.publishedDate;
  if (!raw) return null;
  const parsed = new Date(raw);
  if (Number.isNaN(parsed.getTime())) return null;
  const day = new Date(parsed);
  day.setHours(0, 0, 0, 0);
  return day;
}

function rotatePool<T>(pool: T[], offset: number, count: number): T[] {
  if (pool.length === 0) return [];
  const normalized = ((offset % pool.length) + pool.length) % pool.length;
  return [...pool.slice(normalized), ...pool.slice(0, normalized)].slice(0, count);
}

export default function ExploreScreen() {
  const { palette } = useTheme();
  const { hasAdFree } = useSubscription();

  const scrollPaddingTop = useTabScrollPaddingTop();
  const { contentPadding } = useLayout();
  const { data: articles = [], isLoading: isArticlesLoading, isError: isArticlesError, refetch: refetchArticles } = useArticles();
  const { data: forYouArticles = [], refetch: refetchForYou } = useArticles({ feed: "for_you" });
  const { data: apiCategories, isLoading: isCategoriesLoading, isError: isCategoriesError, refetch: refetchCategories } = useCategories();
  const categoryOptions = useMemo(() => {
    if (apiCategories && apiCategories.length > 0) {
      return [
        { key: "all", label: "All" },
        ...apiCategories.map((category) => ({
          key: normalizeCategory(category.slug),
          label: category.name,
        })),
      ];
    }

    const articleCategories = Array.from(
      new Set(articles.map((article) => normalizeCategory(article.category)).filter(Boolean)),
    );
    return [
      { key: "all", label: "All" },
      ...articleCategories.map((category) => ({
        key: category,
        label: formatCategoryLabel(category),
      })),
    ];
  }, [apiCategories, articles]);
  const [viewMode, setViewMode] = useState<"today" | "global">("today");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [refreshing, setRefreshing] = useState(false);
  const [heroRotation, setHeroRotation] = useState(0);
  const isLoading = isArticlesLoading || isCategoriesLoading;
  const isError = isArticlesError || isCategoriesError;

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setHeroRotation((current) => current + 1);
    void Promise.all([refetchArticles(), refetchCategories(), refetchForYou()]).finally(() =>
      setRefreshing(false),
    );
  }, [refetchArticles, refetchCategories, refetchForYou]);

  const parsePublishedDate = useCallback((article: Article) => {
    const raw = article.publishedAt ?? article.publishedDate;
    if (!raw) return null;
    const parsed = new Date(raw);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }, []);

  const topNarratives = useMemo(() => {
    if (viewMode === "global") {
      const pool = forYouArticles.length > 0 ? forYouArticles : articles;
      return rotatePool(pool, heroRotation, 2);
    }

    const cutoff = new Date();
    cutoff.setHours(0, 0, 0, 0);
    cutoff.setDate(cutoff.getDate() - 2);
    const pool = articles.filter((article) => {
      const publishedDay = articleLocalDay(article);
      return publishedDay !== null && publishedDay >= cutoff;
    });
    return rotatePool(pool, heroRotation, 2);
  }, [articles, forYouArticles, heroRotation, viewMode]);

  const filteredExploreArticles = useMemo(() => {
    const heroIds = new Set(topNarratives.map((article) => article.id));
    let list = articles.filter((article) => !heroIds.has(article.id));
    if (selectedCategory !== "all") {
      list = list.filter(
        (a) => normalizeCategory(a.category) === selectedCategory
      );
    }
    return list;
  }, [articles, selectedCategory, topNarratives]);

  const listHeader = useMemo(() => {
    if (isLoading) {
      return (
        <View style={{ gap: 32, paddingTop: 8 }}>
          <MembershipSyncBanner embedded />
          <UnverifiedTrialBanner embedded />
          <ArticleCardSkeleton />
          <ArticleCardSkeleton />
        </View>
      );
    }

    return (
      <>
        <MembershipSyncBanner embedded />
        <UnverifiedTrialBanner embedded />
        {/* Top Narratives Header */}
        <View style={styles.narrativesHeader}>
          <Text
            accessibilityRole="header"
            style={[styles.narrativesTitle, { color: palette.onSurface }]}
          >
            Top Narratives
          </Text>
          <View style={styles.toggleRow}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Today's narratives"
              accessibilityState={{ selected: viewMode === "today" }}
              onPress={() => { setViewMode("today"); setSelectedCategory("all"); }}
              style={[
                styles.toggleButton,
                {
                  borderColor: palette.outlineVariant + "26",
                  backgroundColor:
                    viewMode === "today" ? palette.secondaryContainer : "transparent",
                },
              ]}
            >
              <Text
                style={[
                  styles.toggleText,
                  { color: viewMode === "today" ? palette.onSecondaryContainer : palette.outline },
                ]}
              >
                Today
              </Text>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Global narratives"
              accessibilityState={{ selected: viewMode === "global" }}
              onPress={() => { setViewMode("global"); setSelectedCategory("all"); }}
              style={[
                styles.toggleButton,
                {
                  borderColor: palette.outlineVariant + "26",
                  backgroundColor:
                    viewMode === "global" ? palette.secondaryContainer : "transparent",
                },
              ]}
            >
              <Text
                style={[
                  styles.toggleText,
                  { color: viewMode === "global" ? palette.onSecondaryContainer : palette.outline },
                ]}
              >
                Global
              </Text>
            </Pressable>
          </View>
        </View>

        {/* Top Narratives List */}
        {topNarratives.map((article, i) => (
          <View key={`top-${article.id}`} style={{ marginBottom: 48 }}>
            <ArticleCard article={article} variant={i === 0 ? "featured" : "default"} />
          </View>
        ))}

        {/* Category filter — controls the list below */}
        <View style={{ marginBottom: 24 }}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ gap: 8 }}
          >
            {categoryOptions.map((cat) => {
              const isSelected = selectedCategory === cat.key;
              return (
                <Pressable
                  key={cat.key}
                  accessibilityRole="button"
                  accessibilityLabel={`Filter by ${cat.label}`}
                  accessibilityState={{ selected: isSelected }}
                  onPress={() => {
                    hapticSelect();
                    setSelectedCategory(cat.key);
                  }}
                  style={[
                    styles.categoryChip,
                    {
                      borderColor: palette.outlineVariant + "26",
                      backgroundColor: isSelected ? palette.secondaryContainer : "transparent",
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.categoryChipText,
                      { color: isSelected ? palette.onSecondaryContainer : palette.outline },
                    ]}
                  >
                    {cat.label}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>
        </View>

        <Text style={[styles.resultsCount, { color: palette.onSurfaceVariant }]}>
          {filteredExploreArticles.length} narratives
        </Text>
      </>
    );
  }, [isLoading, hasAdFree, viewMode, selectedCategory, topNarratives, filteredExploreArticles.length, categoryOptions, palette]);

  const renderItem = useCallback(({ item, index }: { item: Article; index: number }) => (
    <View style={{ marginBottom: 32 }}>
      <ArticleCard article={item} variant="default" />
      {!hasAdFree && index % 2 === 1 ? (
        <View style={{ marginTop: 24 }}>
          <AdBanner position="feed" />
        </View>
      ) : null}
    </View>
  ), [hasAdFree]);

  const listEmpty = useMemo(() => {
    if (isLoading) {
      return null;
    }

    if (isError) {
      return (
        <ErrorState
          title="Explore could not load"
          message="Pull to refresh or try again when your connection is stable."
          onRetry={() => void Promise.all([refetchArticles(), refetchCategories(), refetchForYou()])}
        />
      );
    }

    return (
      <View style={styles.emptyState}>
        <SearchIcon size={48} color={palette.outlineVariant} />
        <Text style={[styles.emptyTitle, { color: palette.onSurface }]}>
          No narratives found
        </Text>
        <Text style={[styles.emptySubtitle, { color: palette.onSurfaceVariant }]}>
          Try adjusting your filters or explore different categories.
        </Text>
      </View>
    );
  }, [isError, isLoading, palette, refetchArticles, refetchCategories, refetchForYou]);

  return (
    <SafeAreaView edges={[]} style={{ flex: 1, backgroundColor: palette.background }}>
      <Header title="Explore" />

      <FlashList
        data={isLoading ? [] : filteredExploreArticles}
        keyExtractor={(article) => article.id}
        renderItem={renderItem}
        ListHeaderComponent={listHeader}
        ListEmptyComponent={listEmpty}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingTop: scrollPaddingTop,
          paddingBottom: 128,
          paddingHorizontal: contentPadding,
        }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={palette.primary}
          />
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  narrativesHeader: {
    marginBottom: TAB_HERO_GAP,
    paddingHorizontal: 4,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    flexWrap: "wrap",
    rowGap: 12,
  },
  narrativesTitle: {
    ...type.headlineMd,
    flexShrink: 1,
    marginRight: 12,
  },
  toggleRow: {
    flexDirection: "row",
    gap: 8,
  },
  toggleButton: {
    minWidth: 76,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
    alignItems: "center",
  },
  toggleText: {
    ...type.overline,
    letterSpacing: 1.2,
  },
  categoryChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
  },
  categoryChipText: {
    ...type.overline,
    letterSpacing: 2,
  },
  resultsCount: {
    ...type.labelSm,
    marginBottom: 24,
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 80,
  },
  emptyTitle: {
    ...type.title,
    marginTop: 16,
  },
  emptySubtitle: {
    ...type.label,
    fontFamily: "Manrope_400Regular",
    marginTop: 8,
    textAlign: "center",
  },
});
