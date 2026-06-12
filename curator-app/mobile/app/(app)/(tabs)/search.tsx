import { useState, useMemo, useEffect, useCallback } from "react";
import { View, Text, TextInput, ScrollView, Pressable } from "react-native";
import { useLocalSearchParams } from "expo-router";
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
import { Header } from "../../../src/ui/header";
import { ArticleCard } from "../../../src/ui/article-card";
import type { Article } from "../../../src/data/articles";
import { useArticles } from "../../../src/hooks/use-articles";
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
  const { isArticleSaved } = useSavedArticles();
  const { recentArticleIds } = useReadingStats();
  const { q } = useLocalSearchParams<{ q?: string }>();
  const { data: articles = [] } = useArticles();
  const { data: apiCategories = [] } = useCategories();

  const recentArticles = useMemo(
    () =>
      recentArticleIds
        .map((rid) => articles.find((a) => a.id === rid))
        .filter((a): a is Article => Boolean(a)),
    [recentArticleIds, articles],
  );

  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    setSearchQuery(q ?? "");
  }, [q]);
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

    return Array.from(new Set(articles.map((article) => normalizeCategory(article.category)).filter(Boolean)))
      .map((category) => ({
        key: category,
        label: formatCategoryLabel(category),
      }));
  }, [apiCategories, articles]);

  const toggleCategory = (cat: string) => {
    setSelectedCategories((prev) =>
      prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat],
    );
  };

  const filteredArticles = useMemo(() => {
    return articles.filter((article) => {
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matchesTitle = article.title.toLowerCase().includes(query);
        const matchesExcerpt = article.excerpt.toLowerCase().includes(query);
        if (!matchesTitle && !matchesExcerpt) return false;
      }
      if (selectedCategories.length > 0) {
        if (!selectedCategories.includes(normalizeCategory(article.category))) return false;
      }
      if (readingStatus === "saved") {
        if (!isArticleSaved(article.id)) return false;
      } else if (readingStatus === "unsaved") {
        if (isArticleSaved(article.id)) return false;
      }
      return true;
    });
  }, [articles, searchQuery, selectedCategories, readingStatus, isArticleSaved]);

  const renderItem = useCallback(({ item }: { item: Article }) => (
    <View style={{ marginBottom: 16 }}>
      <ArticleCard article={item} variant="compact" />
    </View>
  ), []);

  const listHeader = useMemo(() => {
    return (
      <View style={{ paddingBottom: 8 }}>
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
          <View style={{ marginHorizontal: 4, marginTop: 14, gap: 16 }}>
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
            {filteredArticles.length} {filteredArticles.length === 1 ? "narrative" : "narratives"}
          </Text>
        )}
      </View>
    );
  }, [
    palette,
    searchQuery,
    filtersExpanded,
    selectedCategories,
    readingStatus,
    recentArticles,
    filteredArticles.length,
    contentPadding,
    categoryOptions,
  ]);

  const listEmpty = useMemo(() => {
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
  }, [palette, searchQuery]);

  return (
    <View style={{ flex: 1, backgroundColor: palette.background }}>
      <Header title="Search" />

      <FlashList
        data={filteredArticles}
        keyExtractor={(article) => article.id}
        renderItem={renderItem}
        ListHeaderComponent={listHeader}
        ListEmptyComponent={listEmpty}
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
