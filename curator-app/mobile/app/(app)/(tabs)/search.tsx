import { useState, useMemo, useEffect, useCallback } from "react";
import { View, Text, TextInput, ScrollView, Pressable } from "react-native";
import { useLocalSearchParams, useFocusEffect } from "expo-router";
import { FlashList } from "@shopify/flash-list";
import {
  Search as SearchIcon,
  X,
  SlidersHorizontal,
  ChevronDown,
  ChevronUp,
} from "lucide-react-native";

import { useHeaderOffset, useLayout } from "../../../src/lib/layout";
import { useTheme } from "../../../src/providers/theme-provider";
import { useSavedArticles } from "../../../src/providers/saved-articles-provider";
import { useReadingStats } from "../../../src/providers/reading-stats-provider";
import { ErrorState } from "../../../src/ui/error-state";
import { MembershipSyncBanner } from "../../../src/ui/membership-sync-banner";
import { UnverifiedTrialBanner } from "../../../src/ui/unverified-trial-banner";
import { Header } from "../../../src/ui/header";
import { ArticleCard } from "../../../src/ui/article-card";
import type { Article } from "../../../src/data/articles";
import { useArticlesByIds } from "../../../src/hooks/use-articles";
import { flattenArticlePages, useInfiniteArticles } from "../../../src/hooks/use-infinite-articles";
import { useCategories } from "../../../src/hooks/use-categories";
import { type } from "../../../src/ui/tokens/typography";

function normalizeCategory(value: string): string {
  return value.trim().toLowerCase().replace(/[\s_]+/g, "-");
}

function formatCategoryLabel(value: string): string {
  return value
    .replace(/[-_]+/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

export default function SearchScreen() {
  const { palette } = useTheme();
  const headerOffset = useHeaderOffset();
  const { contentPadding } = useLayout();
  const { isArticleSaved, isHydrated } = useSavedArticles();
  const { recentArticleIds, refreshReadingStats } = useReadingStats();
  const { q } = useLocalSearchParams<{ q?: string }>();
  const { data: apiCategories = [] } = useCategories();
  const { data: recentArticlesRaw = [] } = useArticlesByIds(recentArticleIds);
  const recentArticles = useMemo(() => {
    const byId = new Map(recentArticlesRaw.map((article) => [article.id, article]));
    return recentArticleIds
      .map((id) => byId.get(id))
      .filter((article): article is Article => Boolean(article));
  }, [recentArticleIds, recentArticlesRaw]);

  useFocusEffect(
    useCallback(() => {
      refreshReadingStats();
    }, [refreshReadingStats]),
  );

  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");

  useEffect(() => {
    setSearchQuery(q ?? "");
  }, [q]);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(searchQuery.trim()), 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const isServerSearch = debouncedQuery.length >= 2;
  const catalogInfinite = useInfiniteArticles(undefined, { enabled: !isServerSearch });
  const searchInfinite = useInfiniteArticles(
    { q: debouncedQuery },
    { enabled: isServerSearch },
  );
  const activeInfinite = isServerSearch ? searchInfinite : catalogInfinite;
  const activeArticles = useMemo(
    () => flattenArticlePages(activeInfinite.data),
    [activeInfinite.data],
  );
  const isSearching = isServerSearch && searchInfinite.isFetching && !searchInfinite.isFetchingNextPage;
  const isCatalogError = catalogInfinite.isError;
  const isSearchError = searchInfinite.isError;
  const refetchCatalog = catalogInfinite.refetch;
  const refetchSearch = searchInfinite.refetch;
  const catalogArticles = useMemo(
    () => flattenArticlePages(catalogInfinite.data),
    [catalogInfinite.data],
  );
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [readingStatus, setReadingStatus] = useState<"all" | "saved" | "unsaved">("all");
  const [filtersExpanded, setFiltersExpanded] = useState(false);

  const categoryOptions = useMemo(() => {
    if (apiCategories.length > 0) {
      return apiCategories.map((category) => ({
        key: normalizeCategory(category.slug),
        label: category.name,
      }));
    }

    return Array.from(new Set(catalogArticles.map((article) => normalizeCategory(article.category)).filter(Boolean)))
      .map((category) => ({
        key: category,
        label: formatCategoryLabel(category),
      }));
  }, [apiCategories, catalogArticles]);

  const toggleCategory = (cat: string) => {
    setSelectedCategories((prev) =>
      prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat],
    );
  };

  const filteredArticles = useMemo(() => {
    return activeArticles.filter((article) => {
      if (!isServerSearch && searchQuery) {
        const query = searchQuery.toLowerCase();
        const matchesTitle = article.title.toLowerCase().includes(query);
        const matchesExcerpt = article.excerpt.toLowerCase().includes(query);
        if (!matchesTitle && !matchesExcerpt) return false;
      }
      if (selectedCategories.length > 0) {
        if (!selectedCategories.includes(normalizeCategory(article.category))) return false;
      }
      if (readingStatus === "saved" || readingStatus === "unsaved") {
        if (!isHydrated) {
          return false;
        }
      }
      if (readingStatus === "saved") {
        if (isArticleSaved(article.id) !== true) return false;
      } else if (readingStatus === "unsaved") {
        if (isArticleSaved(article.id) === true) return false;
      }
      return true;
    });
  }, [activeArticles, isServerSearch, searchQuery, selectedCategories, readingStatus, isArticleSaved, isHydrated]);

  const renderItem = useCallback(({ item }: { item: Article }) => (
    <View style={{ marginBottom: 16 }}>
      <ArticleCard article={item} variant="compact" showSaveButton={!filtersExpanded} />
    </View>
  ), [filtersExpanded]);

  const hasLoadError = isCatalogError || (isServerSearch && isSearchError);

  const listHeader = useMemo(() => {
    return (
      <View style={{ paddingBottom: 8 }}>
        <MembershipSyncBanner embedded />
        <UnverifiedTrialBanner embedded />
        {!isHydrated && (readingStatus === "saved" || readingStatus === "unsaved") ? (
          <View
            style={{
              marginHorizontal: 4,
              marginBottom: 12,
              padding: 14,
              borderRadius: 16,
              backgroundColor: palette.surfaceContainerLow,
              borderWidth: 1,
              borderColor: palette.outlineVariant + "33",
            }}
          >
            <Text style={[type.labelSm, { color: palette.onSurfaceVariant }]}>
              Syncing saved articles…
            </Text>
          </View>
        ) : null}
        {/* Search input */}
        <View
          style={{
            marginHorizontal: 4,
            flexDirection: "row",
            alignItems: "center",
            gap: 12,
            paddingHorizontal: 20,
            paddingVertical: 14,
            borderRadius: 999,
            backgroundColor: palette.surfaceContainerLow,
            borderWidth: 1,
            borderColor: palette.outlineVariant + "40",
          }}
        >
          <SearchIcon size={18} color={palette.outline} />
          <TextInput
            style={{
              flex: 1,
              minWidth: 0,
              fontSize: 16,
              fontFamily: "Manrope_400Regular",
              color: palette.onSurface,
              padding: 0,
            }}
            placeholder="Search narratives..."
            placeholderTextColor={palette.outline + "80"}
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoCapitalize="none"
            accessibilityLabel="Search narratives"
          />
          {searchQuery.length > 0 && (
            <Pressable onPress={() => setSearchQuery("")} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <X size={16} color={palette.outline} />
            </Pressable>
          )}
        </View>

        {/* Filters toggle */}
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={filtersExpanded ? "Hide filters" : "Show filters"}
          accessibilityState={{ expanded: filtersExpanded }}
          onPress={() => setFiltersExpanded((prev) => !prev)}
          style={{
            marginHorizontal: 4,
            marginTop: 14,
            flexDirection: "row",
            alignItems: "center",
            gap: 6,
            alignSelf: "flex-start",
          }}
        >
          <SlidersHorizontal size={14} color={palette.onSurfaceVariant} />
          <Text style={[type.overline, { fontSize: 11, letterSpacing: 2, color: palette.onSurfaceVariant }]}>
            Filters
          </Text>
          {filtersExpanded ? (
            <ChevronUp size={12} color={palette.onSurfaceVariant} />
          ) : (
            <ChevronDown size={12} color={palette.onSurfaceVariant} />
          )}
        </Pressable>

        {/* Filters panel */}
        {filtersExpanded && (
          <View
            style={{ marginHorizontal: 4, marginTop: 14, gap: 16 }}
            onStartShouldSetResponder={() => true}
          >
            {/* Categories */}
            <View>
              <Text style={[type.overline, { letterSpacing: 2, color: palette.onSurfaceVariant, marginBottom: 10, paddingHorizontal: 4 }]}>
                Categories
              </Text>
              <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
                {categoryOptions.map((cat) => {
                    const selected = selectedCategories.includes(cat.key);
                    return (
                      <Pressable
                        key={cat.key}
                        accessibilityRole="button"
                        accessibilityLabel={`Filter by ${cat.label}`}
                        accessibilityState={{ selected }}
                        onPress={() => toggleCategory(cat.key)}
                        style={{
                          paddingHorizontal: 14,
                          paddingVertical: 7,
                          borderRadius: 999,
                          backgroundColor: selected
                            ? palette.secondaryContainer
                            : "transparent",
                          borderWidth: 1,
                          borderColor: selected
                            ? palette.secondaryContainer
                            : palette.outlineVariant + "40",
                        }}
                      >
                        <Text style={[type.labelSm, { fontFamily: "Manrope_500Medium", fontSize: 11, color: selected ? palette.onSecondaryContainer : palette.outline }]}>
                          {cat.label}
                        </Text>
                      </Pressable>
                    );
                  })}
              </View>
            </View>

            {/* Status */}
            <View>
              <Text style={[type.overline, { letterSpacing: 2, color: palette.onSurfaceVariant, marginBottom: 10, paddingHorizontal: 4 }]}>
                Status
              </Text>
              <View style={{ flexDirection: "row", gap: 8 }}>
                {(["all", "saved", "unsaved"] as const).map((status) => {
                  const selected = readingStatus === status;
                  return (
                    <Pressable
                      key={status}
                      accessibilityRole="button"
                      accessibilityLabel={`Filter: ${status}`}
                      accessibilityState={{ selected }}
                      onPress={() => setReadingStatus(status)}
                      style={{
                        paddingHorizontal: 14,
                        paddingVertical: 7,
                        borderRadius: 999,
                        backgroundColor: selected
                          ? palette.secondaryContainer
                          : "transparent",
                        borderWidth: 1,
                        borderColor: selected
                          ? palette.secondaryContainer
                          : palette.outlineVariant + "40",
                      }}
                    >
                      <Text style={[type.labelSm, { fontFamily: "Manrope_500Medium", fontSize: 11, textTransform: "capitalize", color: selected ? palette.onSecondaryContainer : palette.outline }]}>
                        {status}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>
          </View>
        )}

        {/* Continue Reading — shown when not actively searching */}
        {!searchQuery && recentArticles.length > 0 && (
          <View style={{ marginTop: 24, marginHorizontal: -contentPadding }}>
            <Text
              style={[
                type.title,
                {
                  color: palette.onSurface,
                  paddingHorizontal: contentPadding + 4,
                  marginBottom: 12,
                },
              ]}
            >
              Continue Reading
            </Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ gap: 16, paddingHorizontal: contentPadding }}
            >
              {recentArticles.map((a) => (
                <View key={a.id} style={{ width: 260 }}>
                  <ArticleCard article={a} variant="compact" />
                </View>
              ))}
            </ScrollView>
          </View>
        )}

        {/* Results title */}
        {filteredArticles.length > 0 && (
          <Text style={[type.labelSm, { fontFamily: "Manrope_500Medium", fontSize: 11, color: palette.outline, paddingHorizontal: 4, marginTop: 24, marginBottom: 8 }]}>
            {isSearching ? "Searching…" : `${filteredArticles.length} ${filteredArticles.length === 1 ? "narrative" : "narratives"}`}
          </Text>
        )}
        {isServerSearch && !isSearching && filteredArticles.length === 0 && (
          <Text style={[type.label, { fontFamily: "Manrope_400Regular", color: palette.onSurfaceVariant, paddingHorizontal: 4, marginTop: 24 }]}>
            No narratives match “{debouncedQuery}”.
          </Text>
        )}
      </View>
    );
  }, [
    palette,
    isHydrated,
    readingStatus,
    searchQuery,
    filtersExpanded,
    selectedCategories,
    recentArticles,
    filteredArticles.length,
    contentPadding,
    categoryOptions,
    isSearching,
    isServerSearch,
    debouncedQuery,
  ]);

  const listEmpty = useMemo(() => {
    if (hasLoadError) {
      return (
        <ErrorState
          title="Search could not load"
          message="Check your connection and try again."
          onRetry={() => void (isServerSearch ? refetchSearch() : refetchCatalog())}
        />
      );
    }

    return (
      <View
        style={{
          alignItems: "center",
          justifyContent: "center",
          paddingVertical: 80,
        }}
      >
        <SearchIcon size={40} color={palette.outlineVariant} />
        <Text style={[type.title, { color: palette.onSurface, marginTop: 16 }]}>
          {searchQuery ? "No results" : "Start searching"}
        </Text>
        <Text style={[type.label, { fontFamily: "Manrope_400Regular", color: palette.onSurfaceVariant, marginTop: 8, textAlign: "center", paddingHorizontal: 48, lineHeight: 20 }]}>
          {searchQuery
            ? "Try different keywords or adjust your filters."
            : "Search across all narratives, topics, and sources."}
        </Text>
      </View>
    );
  }, [debouncedQuery, hasLoadError, isServerSearch, palette, refetchCatalog, refetchSearch, searchQuery]);

  const loadMore = useCallback(() => {
    if (activeInfinite.hasNextPage && !activeInfinite.isFetchingNextPage) {
      void activeInfinite.fetchNextPage();
    }
  }, [activeInfinite]);

  const listFooter = useMemo(() => {
    if (!activeInfinite.isFetchingNextPage) return null;
    return (
      <View style={{ paddingVertical: 24, alignItems: "center" }}>
        <Text style={[type.caption, { color: palette.onSurfaceVariant }]}>Loading more…</Text>
      </View>
    );
  }, [activeInfinite.isFetchingNextPage, palette]);

  return (
    <View style={{ flex: 1, backgroundColor: palette.background }}>
      <Header title="Search" />

      <FlashList
        data={filteredArticles}
        keyExtractor={(article) => article.id}
        renderItem={renderItem}
        ListHeaderComponent={listHeader}
        ListEmptyComponent={listEmpty}
        ListFooterComponent={listFooter}
        onEndReached={loadMore}
        onEndReachedThreshold={0.4}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{
          paddingTop: headerOffset,
          paddingBottom: 128,
          paddingHorizontal: contentPadding,
        }}
      />
    </View>
  );
}
