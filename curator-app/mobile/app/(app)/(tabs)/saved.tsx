import { useState, useMemo, useCallback, useEffect } from "react";
import { View, Text, ScrollView, Pressable, TextInput } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import {
  Search as SearchIcon,
  Bookmark,
  Trash2,
  Folder,
  CheckSquare,
  Square,
} from "lucide-react-native";
import { medium as hapticMedium } from "../../../src/lib/haptics";
import { useHeaderOffset, useLayout } from "../../../src/lib/layout";

import { useTheme } from "../../../src/providers/theme-provider";
import { useSavedArticles } from "../../../src/providers/saved-articles-provider";
import { useSubscription } from "../../../src/providers/subscription-provider";
import { Header } from "../../../src/ui/header";
import { ArticleCard } from "../../../src/ui/article-card";
import { SwipeableArticleCard } from "../../../src/ui/swipeable-article-card";
import { ConfirmDialog } from "../../../src/ui/confirm-dialog";
import { CompactCardSkeleton } from "../../../src/ui/skeleton-loader";
import { useArticles } from "../../../src/hooks/use-articles";
import { type } from "../../../src/ui/tokens/typography";

export default function SavedScreen() {
  const { palette } = useTheme();
  const router = useRouter();
  const { savedArticleIds, isArticleSaved, unsaveArticle, savedCount } =
    useSavedArticles();
  const { hasUnlimitedSaves, maxSaves } = useSubscription();
  const headerOffset = useHeaderOffset();
  const { contentPadding } = useLayout();
  const { data: articles = [] } = useArticles();

  const [isLoading, setIsLoading] = useState(true);
  const [filterQuery, setFilterQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);

  useEffect(() => {
    const t = setTimeout(() => setIsLoading(false), 600);
    return () => clearTimeout(t);
  }, []);

  // Get saved articles from data
  const savedArticles = useMemo(() => {
    return articles.filter((article) => isArticleSaved(article.id));
  }, [savedArticleIds, isArticleSaved]);

  const categoryChips = useMemo(() => {
    const cats = [...new Set(savedArticles.map((a) => a.category))];
    return ["All", ...cats];
  }, [savedArticles]);

  // Filter by category + text query
  const filteredSavedArticles = useMemo(() => {
    let list = selectedCategory === "All"
      ? savedArticles
      : savedArticles.filter((a) => a.category === selectedCategory);
    if (!filterQuery) return list;
    const query = filterQuery.toLowerCase();
    return list.filter((article) => article.title.toLowerCase().includes(query));
  }, [savedArticles, filterQuery, selectedCategory]);

  // Storage percentage
  const percentage = hasUnlimitedSaves
    ? 0
    : Math.min(Math.round((savedCount / maxSaves) * 100), 100);

  const toggleSelection = useCallback(
    (id: string) => {
      setSelectedIds((prev) =>
        prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id],
      );
    },
    [],
  );

  const confirmDelete = useCallback((id: string) => {
    setDeleteTarget(id);
  }, []);

  const handleDeleteConfirm = useCallback(() => {
    if (deleteTarget) {
      hapticMedium();
      unsaveArticle(deleteTarget);
      setDeleteTarget(null);
    }
  }, [deleteTarget, unsaveArticle]);

  const handleDeleteCancel = useCallback(() => {
    setDeleteTarget(null);
  }, []);

  const bulkDelete = useCallback(() => {
    hapticMedium();
    selectedIds.forEach((id) => unsaveArticle(id));
    setSelectedIds([]);
    setSelectionMode(false);
  }, [selectedIds, unsaveArticle]);

  const toggleSelectionMode = useCallback(() => {
    if (selectionMode) {
      setSelectedIds([]);
    }
    setSelectionMode((prev) => !prev);
  }, [selectionMode]);

  return (
    <View style={{ flex: 1, backgroundColor: palette.background }}>
      {/* Header */}
      <Header title="Saved" />

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingTop: headerOffset, paddingBottom: 128 }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Storage limit banner (free users only) */}
        {!hasUnlimitedSaves && (
          <View
            style={{
              marginHorizontal: contentPadding,
              padding: 20,
              borderRadius: 24,
              backgroundColor: palette.surfaceContainerLow,
              borderWidth: 1,
              borderColor: palette.outlineVariant + "26",
            }}
          >
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: 10,
              }}
            >
              <Text style={[type.labelSm, { color: palette.onSurface }]}>
                Storage
              </Text>
              <Text style={[type.labelSm, { fontFamily: "Manrope_500Medium", color: palette.onSurfaceVariant }]}>
                {savedCount}/{maxSaves}
              </Text>
            </View>
            <View
              style={{
                height: 8,
                borderRadius: 999,
                backgroundColor: palette.surfaceContainerHigh,
                overflow: "hidden",
              }}
            >
              <View
                style={{
                  height: "100%",
                  borderRadius: 999,
                  backgroundColor:
                    percentage < 50
                      ? palette.primary
                      : percentage < 80
                        ? palette.secondary
                        : palette.error,
                  width: `${percentage}%`,
                }}
              />
            </View>
          </View>
        )}

        {/* Collections CTA */}
        <Pressable
          onPress={() => router.push("/(app)/collections" as any)}
          style={{
            marginHorizontal: contentPadding,
            marginTop: 16,
            padding: 18,
            borderRadius: 24,
            backgroundColor: palette.surfaceContainerLowest,
            borderWidth: 1,
            borderColor: palette.outlineVariant + "26",
            flexDirection: "row",
            alignItems: "center",
            gap: 14,
          }}
        >
          <Folder size={20} color={palette.primary} />
          <View style={{ flex: 1 }}>
            <Text style={[type.label, { color: palette.onSurface }]}>
              Collections
            </Text>
            <Text style={[type.labelSm, { fontFamily: "Manrope_400Regular", color: palette.onSurfaceVariant }]}>
              Organize your saved narratives
            </Text>
          </View>
        </Pressable>

        {/* Bulk actions bar */}
        {selectionMode && selectedIds.length > 0 && (
          <View
            style={{
              marginHorizontal: contentPadding,
              marginTop: 16,
              padding: 12,
              borderRadius: 16,
              backgroundColor: palette.surfaceContainer,
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <Text style={[type.label, { fontFamily: "Manrope_500Medium", color: palette.onSurface }]}>
              {selectedIds.length} selected
            </Text>
            <View style={{ flexDirection: "row", gap: 8 }}>
              <Pressable
                onPress={bulkDelete}
                style={{
                  paddingHorizontal: 12,
                  paddingVertical: 8,
                  borderRadius: 999,
                  backgroundColor: palette.errorContainer,
                }}
              >
                <Trash2 size={16} color={palette.error} />
              </Pressable>
            </View>
          </View>
        )}

        {/* Filter/search input */}
        <View
          style={{
            marginHorizontal: contentPadding,
            marginTop: 16,
            flexDirection: "row",
            alignItems: "center",
            gap: 12,
            paddingHorizontal: 16,
            paddingVertical: 10,
            borderRadius: 999,
            backgroundColor: palette.inputBackground,
          }}
        >
          <SearchIcon size={16} color={palette.outline} />
          <TextInput
            style={{
              flex: 1,
              fontSize: 14,
              fontFamily: "Manrope_400Regular",
              color: palette.onSurface,
              padding: 0,
            }}
            placeholder="Filter saved..."
            placeholderTextColor={palette.onSurfaceVariant}
            value={filterQuery}
            onChangeText={setFilterQuery}
          />
        </View>

        {/* Category chips */}
        {categoryChips.length > 1 && (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: contentPadding, gap: 8, paddingVertical: 4 }}
            style={{ marginTop: 12 }}
          >
            {categoryChips.map((cat) => {
              const active = cat === selectedCategory;
              return (
                <Pressable
                  key={cat}
                  accessibilityRole="button"
                  accessibilityLabel={cat}
                  accessibilityState={{ selected: active }}
                  onPress={() => setSelectedCategory(cat)}
                  style={{
                    paddingHorizontal: 14,
                    paddingVertical: 7,
                    borderRadius: 999,
                    backgroundColor: active ? palette.inverseSurface : palette.surfaceContainerLowest,
                    borderWidth: 1,
                    borderColor: active ? "transparent" : palette.outlineVariant + "33",
                  }}
                >
                  <Text style={[type.labelSm, { color: active ? palette.inverseOnSurface : palette.onSurfaceVariant }]}>
                    {cat}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>
        )}

        {/* Toggle selection mode button */}
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={selectionMode ? "Cancel selection" : "Select articles"}
          onPress={toggleSelectionMode}
          style={{
            marginHorizontal: contentPadding,
            marginTop: 12,
            flexDirection: "row",
            alignItems: "center",
            gap: 8,
            alignSelf: "flex-end",
          }}
        >
          {selectionMode ? (
            <CheckSquare size={16} color={palette.primary} />
          ) : (
            <Square size={16} color={palette.onSurfaceVariant} />
          )}
          <Text style={[type.labelSm, { fontFamily: "Manrope_500Medium", color: palette.onSurfaceVariant }]}>
            {selectionMode ? "Cancel" : "Select"}
          </Text>
        </Pressable>

        {/* Saved articles list */}
        {isLoading ? (
          <View style={{ paddingHorizontal: contentPadding, marginTop: 16, gap: 16 }}>
            <CompactCardSkeleton />
            <CompactCardSkeleton />
            <CompactCardSkeleton />
          </View>
        ) : filteredSavedArticles.length > 0 ? (
          <View style={{ paddingHorizontal: contentPadding, marginTop: 16, gap: 16 }}>
            {filteredSavedArticles.map((article) => {
              const isSelected = selectedIds.includes(article.id);
              return (
                <View
                  key={article.id}
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 12,
                  }}
                >
                  {selectionMode && (
                    <Pressable onPress={() => toggleSelection(article.id)}>
                      {isSelected ? (
                        <CheckSquare size={20} color={palette.primary} />
                      ) : (
                        <Square size={20} color={palette.outline} />
                      )}
                    </Pressable>
                  )}
                  <View style={{ flex: 1, minWidth: 0 }}>
                    {selectionMode ? (
                      <ArticleCard
                        article={article}
                        variant="compact"
                        showSaveButton={false}
                      />
                    ) : (
                      <SwipeableArticleCard
                        article={article}
                        onRemove={() => confirmDelete(article.id)}
                        enableSaveSwipe={false}
                        removeSwipeDirection="right"
                      />
                    )}
                  </View>
                </View>
              );
            })}
          </View>
        ) : (
          /* Empty state */
          <View
            style={{
              alignItems: "center",
              justifyContent: "center",
              paddingVertical: 80,
            }}
          >
            <Bookmark size={48} color={palette.outlineVariant} />
            <Text style={[type.title, { color: palette.onSurface, marginTop: 16 }]}>
              No saved articles
            </Text>
            <Text style={[type.label, { fontFamily: "Manrope_400Regular", color: palette.onSurfaceVariant, marginTop: 8, textAlign: "center", paddingHorizontal: 48 }]}>
              Bookmark articles to read later.
            </Text>
          </View>
        )}
      </ScrollView>

      {/* Confirm dialog for delete */}
      <ConfirmDialog
        visible={deleteTarget !== null}
        title="Remove article"
        message="Are you sure you want to remove this article from your saved list?"
        confirmLabel="Remove"
        cancelLabel="Cancel"
        onConfirm={handleDeleteConfirm}
        onCancel={handleDeleteCancel}
        destructive
      />
    </View>
  );
}
