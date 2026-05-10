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
import { useHeaderOffset, useLayout } from "../../../src/lib/layout";
import { type } from "../../../src/ui/tokens/typography";

import { useTheme } from "../../../src/providers/theme-provider";
import { useSubscription } from "../../../src/providers/subscription-provider";
import { Header } from "../../../src/ui/header";
import { ArticleCard } from "../../../src/ui/article-card";
import { AdBanner } from "../../../src/ui/ad-banner";
import { ArticleCardSkeleton } from "../../../src/ui/skeleton-loader";
import { categories as staticCategories } from "../../../src/data/articles";
import type { Article } from "../../../src/data/articles";
import { useArticles } from "../../../src/hooks/use-articles";
import { useCategories } from "../../../src/hooks/use-categories";

export default function ExploreScreen() {
  const { palette } = useTheme();
  const { hasAdFree } = useSubscription();

  const headerOffset = useHeaderOffset();
  const { contentPadding } = useLayout();
  const { data: articles = [], refetch } = useArticles();
  const { data: apiCategories } = useCategories();
  const categoryNames = useMemo(() => {
    if (apiCategories && apiCategories.length > 0) {
      return ["All", ...apiCategories.map((c) => c.name)];
    }
    return staticCategories;
  }, [apiCategories]);
  const [viewMode, setViewMode] = useState<"today" | "global">("today");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [refreshing, setRefreshing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const t = setTimeout(() => setIsLoading(false), 600);
    return () => clearTimeout(t);
  }, []);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    void refetch().finally(() => setRefreshing(false));
  }, [refetch]);

  const topNarratives =
    viewMode === "today" ? articles.slice(0, 2) : articles.slice(6, 8);

  const filteredExploreArticles = useMemo(() => {
    let list = articles.slice(2);
    if (selectedCategory !== "All") {
      list = list.filter(
        (a) => a.category.toLowerCase() === selectedCategory.toLowerCase()
      );
    }
    return list;
  }, [articles, selectedCategory]);

  const listHeader = useMemo(() => {
    if (isLoading) {
      return (
        <View style={{ gap: 32, paddingTop: 8 }}>
          {!hasAdFree && <AdBanner position="top" />}
          <ArticleCardSkeleton />
          <ArticleCardSkeleton />
        </View>
      );
    }

    return (
      <>
        {!hasAdFree && (
          <View style={{ marginBottom: 16 }}>
            <AdBanner position="top" />
          </View>
        )}

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
              onPress={() => { setViewMode("today"); setSelectedCategory("All"); }}
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
              onPress={() => { setViewMode("global"); setSelectedCategory("All"); }}
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
            {i === 0 && !hasAdFree && (
              <View style={{ marginTop: 32 }}>
                <AdBanner position="inline" />
              </View>
            )}
          </View>
        ))}

        {/* Category filter — controls the list below */}
        <View style={{ marginBottom: 24 }}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ gap: 8 }}
          >
            {categoryNames.map((cat) => {
              const isSelected = selectedCategory === cat;
              return (
                <Pressable
                  key={cat}
                  accessibilityRole="button"
                  accessibilityLabel={`Filter by ${cat}`}
                  accessibilityState={{ selected: isSelected }}
                  onPress={() => {
                    hapticSelect();
                    setSelectedCategory(cat);
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
                    {cat}
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
  }, [isLoading, hasAdFree, viewMode, selectedCategory, topNarratives, filteredExploreArticles.length, categoryNames, palette]);

  const renderItem = useCallback(({ item }: { item: Article }) => (
    <View style={{ marginBottom: 32 }}>
      <ArticleCard article={item} variant="default" />
    </View>
  ), []);

  const listEmpty = useMemo(() => (
    isLoading ? null : (
      <View style={styles.emptyState}>
        <SearchIcon size={48} color={palette.outlineVariant} />
        <Text style={[styles.emptyTitle, { color: palette.onSurface }]}>
          No narratives found
        </Text>
        <Text style={[styles.emptySubtitle, { color: palette.onSurfaceVariant }]}>
          Try adjusting your filters or explore different categories.
        </Text>
      </View>
    )
  ), [isLoading, palette]);

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
          paddingTop: headerOffset,
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
    marginBottom: 32,
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
