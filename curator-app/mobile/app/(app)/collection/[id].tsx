import { useCallback, useRef, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Plus, Edit3, Trash2, X } from "lucide-react-native";
import {
  BottomSheetModal,
  BottomSheetView,
  BottomSheetScrollView,
  BottomSheetBackdrop,
  BottomSheetTextInput,
  type BottomSheetBackdropProps,
} from "@gorhom/bottom-sheet";

import { useTheme } from "../../../src/providers/theme-provider";
import { useCollections } from "../../../src/providers/collections-provider";
import { useSavedArticles } from "../../../src/providers/saved-articles-provider";
import { useToast } from "../../../src/providers/toast-provider";
import { ConfirmDialog } from "../../../src/ui/confirm-dialog";
import { SwipeableArticleCard } from "../../../src/ui/swipeable-article-card";
import { useArticles } from "../../../src/hooks/use-articles";
import { PillPageHeader } from "../../../src/ui/pill-page-header";

export default function CollectionDetailScreen() {
  const { palette } = useTheme();
  const { id } = useLocalSearchParams<{ id: string }>();
  const {
    getCollection,
    updateCollection,
    addArticleToCollection,
    removeArticleFromCollection,
    deleteCollection,
  } = useCollections();
  const { savedArticleIds } = useSavedArticles();
  const { data: allArticles = [] } = useArticles();
  const { showToast } = useToast();
  const router = useRouter();

  const addModalRef = useRef<BottomSheetModal>(null);
  const editModalRef = useRef<BottomSheetModal>(null);

  const collection = id ? getCollection(id) : undefined;

  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [editName, setEditName] = useState(collection?.name ?? "");
  const [editDescription, setEditDescription] = useState(collection?.description ?? "");

  const openAdd = useCallback(() => addModalRef.current?.present(), []);
  const closeAdd = useCallback(() => addModalRef.current?.dismiss(), []);
  const openEdit = useCallback(() => {
    setEditName(collection?.name ?? "");
    setEditDescription(collection?.description ?? "");
    editModalRef.current?.present();
  }, [collection]);
  const closeEdit = useCallback(() => editModalRef.current?.dismiss(), []);

  const renderBackdrop = useCallback(
    (props: BottomSheetBackdropProps) => (
      <BottomSheetBackdrop {...props} disappearsOnIndex={-1} appearsOnIndex={0} opacity={0.5} />
    ),
    [],
  );

  if (!collection) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: palette.background, alignItems: "center", justifyContent: "center" }}>
        <Text style={{ fontFamily: "Newsreader_500Medium_Italic", fontSize: 22, color: palette.onSurfaceVariant, marginBottom: 20 }}>
          Collection not found
        </Text>
        <Pressable
          onPress={() => router.back()}
          style={{ paddingVertical: 12, paddingHorizontal: 24, backgroundColor: palette.inverseSurface, borderRadius: 999 }}
        >
          <Text style={{ fontFamily: "Manrope_600SemiBold", fontSize: 14, color: palette.inverseOnSurface }}>Go Back</Text>
        </Pressable>
      </SafeAreaView>
    );
  }

  const collectionArticles = allArticles.filter((a) => collection.articleIds.includes(a.id));
  const availableArticles = allArticles.filter(
    (a) => savedArticleIds.includes(a.id) && !collection.articleIds.includes(a.id),
  );

  const handleDeleteCollection = () => {
    deleteCollection(collection.id);
    showToast("success", "Collection deleted");
    router.back();
  };

  const handleEditSave = () => {
    if (!editName.trim()) {
      showToast("error", "Collection name is required");
      return;
    }
    updateCollection(collection.id, { name: editName.trim(), description: editDescription.trim() });
    showToast("success", "Collection updated");
    closeEdit();
  };

  const handleAddArticle = (articleId: string) => {
    addArticleToCollection(collection.id, articleId);
    showToast("success", "Article added");
  };

  const handleRemoveArticle = (articleId: string) => {
    removeArticleFromCollection(collection.id, articleId);
    showToast("success", "Article removed");
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: palette.background }}>
      <PillPageHeader title={collection.name} />

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 48, paddingTop: 4 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Meta row — matches the narrativesHeader pattern in explore */}
        <View style={styles.metaRow}>
          <View style={{ flex: 1 }}>
            <Text style={[styles.metaCount, { color: palette.outline }]}>
              {collectionArticles.length}{" "}
              {collectionArticles.length === 1 ? "article" : "articles"}
            </Text>
            {collection.description ? (
              <Text style={[styles.metaDesc, { color: palette.onSurfaceVariant }]}>
                {collection.description}
              </Text>
            ) : null}
          </View>

          <View style={styles.actions}>
            <Pressable
              onPress={openAdd}
              style={[styles.actionBtn, { backgroundColor: palette.inverseSurface }]}
            >
              <Plus size={14} color={palette.inverseOnSurface} />
              <Text style={[styles.actionBtnText, { color: palette.inverseOnSurface }]}>Add</Text>
            </Pressable>
            <Pressable
              onPress={openEdit}
              hitSlop={8}
              style={[styles.iconBtn, { backgroundColor: palette.surfaceContainerLow, borderColor: palette.outlineVariant + "33" }]}
            >
              <Edit3 size={15} color={palette.onSurfaceVariant} />
            </Pressable>
            <Pressable
              onPress={() => setShowDeleteDialog(true)}
              hitSlop={8}
              style={[styles.iconBtn, { backgroundColor: palette.error + "14", borderColor: palette.error + "26" }]}
            >
              <Trash2 size={15} color={palette.error} />
            </Pressable>
          </View>
        </View>

        {/* Divider */}
        <View style={[styles.divider, { backgroundColor: palette.outlineVariant + "26" }]} />

        {/* Articles */}
        {collectionArticles.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={[styles.emptyTitle, { color: palette.onSurface }]}>
              Nothing here yet
            </Text>
            <Text style={[styles.emptySub, { color: palette.onSurfaceVariant }]}>
              Tap Add to pull in articles from your saved list.
            </Text>
          </View>
        ) : (
          <View style={{ gap: 16 }}>
            {collectionArticles.map((article) => (
              <SwipeableArticleCard
                key={article.id}
                article={article}
                onRemove={() => handleRemoveArticle(article.id)}
              />
            ))}
          </View>
        )}
      </ScrollView>

      {/* Add Articles Sheet */}
      <BottomSheetModal
        ref={addModalRef}
        snapPoints={["65%"]}
        onDismiss={closeAdd}
        backdropComponent={renderBackdrop}
        backgroundStyle={{ backgroundColor: palette.surfaceContainerLowest }}
        handleIndicatorStyle={{ backgroundColor: palette.outlineVariant }}
      >
        <View style={[styles.sheetHeader, { borderBottomColor: palette.outlineVariant + "26" }]}>
          <View>
            <Text style={[styles.sheetTitle, { color: palette.onSurface }]}>Add Articles</Text>
            <Text style={[styles.sheetSub, { color: palette.onSurfaceVariant }]}>From your saved narratives</Text>
          </View>
          <Pressable onPress={closeAdd} hitSlop={8}>
            <X size={20} color={palette.onSurfaceVariant} />
          </Pressable>
        </View>

        <BottomSheetScrollView contentContainerStyle={{ padding: 16, gap: 10 }}>
          {availableArticles.length === 0 ? (
            <View style={{ paddingVertical: 48, alignItems: "center" }}>
              <Text style={{ fontFamily: "Manrope_400Regular", fontSize: 14, color: palette.onSurfaceVariant, textAlign: "center", lineHeight: 21 }}>
                No saved articles to add.{"\n"}Save some first from Explore.
              </Text>
            </View>
          ) : (
            availableArticles.map((article) => (
              <Pressable
                key={article.id}
                onPress={() => {
                  handleAddArticle(article.id);
                  if (availableArticles.length <= 1) closeAdd();
                }}
                style={({ pressed }) => [
                  styles.addItem,
                  {
                    backgroundColor: pressed ? palette.surfaceContainerLow : palette.surfaceContainerLowest,
                    borderColor: palette.outlineVariant + "26",
                  },
                ]}
              >
                <View style={{ flex: 1 }}>
                  <Text numberOfLines={2} style={[styles.addItemTitle, { color: palette.onSurface }]}>
                    {article.title}
                  </Text>
                  <Text style={[styles.addItemMeta, { color: palette.outline }]}>
                    {article.category} · {article.readTime}
                  </Text>
                </View>
                <View style={[styles.addItemIcon, { backgroundColor: palette.surfaceContainerHigh }]}>
                  <Plus size={15} color={palette.onSurfaceVariant} />
                </View>
              </Pressable>
            ))
          )}
        </BottomSheetScrollView>
      </BottomSheetModal>

      {/* Edit Sheet */}
      <BottomSheetModal
        ref={editModalRef}
        snapPoints={["55%"]}
        keyboardBehavior="interactive"
        keyboardBlurBehavior="restore"
        backdropComponent={renderBackdrop}
        backgroundStyle={{ backgroundColor: palette.surfaceContainerLowest }}
        handleIndicatorStyle={{ backgroundColor: palette.outlineVariant }}
      >
        <BottomSheetView style={{ paddingHorizontal: 24, paddingBottom: 32, paddingTop: 8 }}>
          <Text style={[styles.sheetTitle, { color: palette.onSurface, marginBottom: 24 }]}>
            Edit Collection
          </Text>

          <Text style={[styles.fieldLabel, { color: palette.onSurfaceVariant }]}>Name</Text>
          <BottomSheetTextInput
            value={editName}
            onChangeText={setEditName}
            style={[styles.input, { color: palette.onSurface, backgroundColor: palette.inputBackground, borderColor: palette.outlineVariant + "33" }]}
          />

          <Text style={[styles.fieldLabel, { color: palette.onSurfaceVariant }]}>Description</Text>
          <BottomSheetTextInput
            value={editDescription}
            onChangeText={setEditDescription}
            multiline
            numberOfLines={3}
            style={[styles.inputMulti, { color: palette.onSurface, backgroundColor: palette.inputBackground, borderColor: palette.outlineVariant + "33" }]}
          />

          <View style={{ flexDirection: "row", gap: 12 }}>
            <Pressable
              onPress={closeEdit}
              style={[styles.btnOutline, { borderColor: palette.outlineVariant }]}
            >
              <Text style={{ fontFamily: "Manrope_500Medium", fontSize: 15, color: palette.onSurface }}>Cancel</Text>
            </Pressable>
            <Pressable
              onPress={handleEditSave}
              style={[styles.btnFill, { backgroundColor: palette.inverseSurface }]}
            >
              <Text style={{ fontFamily: "Manrope_600SemiBold", fontSize: 15, color: palette.inverseOnSurface }}>Save</Text>
            </Pressable>
          </View>
        </BottomSheetView>
      </BottomSheetModal>

      <ConfirmDialog
        visible={showDeleteDialog}
        title="Delete Collection?"
        message="This will remove the collection but keep your saved articles."
        confirmLabel="Delete"
        cancelLabel="Cancel"
        onConfirm={handleDeleteCollection}
        onCancel={() => setShowDeleteDialog(false)}
        destructive
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 4,
    marginBottom: 20,
    gap: 12,
  },
  metaCount: {
    fontFamily: "Manrope_500Medium",
    fontSize: 10,
    textTransform: "uppercase",
    letterSpacing: 1.5,
    marginBottom: 4,
  },
  metaDesc: {
    fontFamily: "Manrope_400Regular",
    fontSize: 13,
    lineHeight: 18,
  },
  actions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  actionBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 9,
    paddingHorizontal: 14,
    borderRadius: 999,
  },
  actionBtnText: {
    fontFamily: "Manrope_600SemiBold",
    fontSize: 13,
  },
  iconBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  divider: {
    height: 1,
    marginBottom: 24,
  },
  emptyState: {
    paddingVertical: 56,
    alignItems: "center",
    paddingHorizontal: 32,
  },
  emptyTitle: {
    fontFamily: "Newsreader_500Medium_Italic",
    fontSize: 26,
    marginBottom: 8,
    textAlign: "center",
  },
  emptySub: {
    fontFamily: "Manrope_400Regular",
    fontSize: 14,
    textAlign: "center",
    lineHeight: 21,
  },
  sheetHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    paddingHorizontal: 20,
    paddingTop: 4,
    paddingBottom: 16,
    borderBottomWidth: 1,
  },
  sheetTitle: {
    fontFamily: "Newsreader_500Medium_Italic",
    fontSize: 26,
  },
  sheetSub: {
    fontFamily: "Manrope_400Regular",
    fontSize: 13,
    marginTop: 2,
  },
  addItem: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  addItemTitle: {
    fontFamily: "Newsreader_500Medium",
    fontSize: 15,
    lineHeight: 20,
    marginBottom: 4,
  },
  addItemMeta: {
    fontFamily: "Manrope_500Medium",
    fontSize: 10,
    textTransform: "uppercase",
    letterSpacing: 1.5,
  },
  addItemIcon: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
  },
  fieldLabel: {
    fontFamily: "Manrope_600SemiBold",
    fontSize: 11,
    textTransform: "uppercase",
    letterSpacing: 2,
    marginBottom: 8,
  },
  input: {
    fontFamily: "Manrope_400Regular",
    fontSize: 15,
    borderRadius: 999,
    borderWidth: 1,
    paddingVertical: 13,
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  inputMulti: {
    fontFamily: "Manrope_400Regular",
    fontSize: 15,
    borderRadius: 20,
    borderWidth: 1,
    paddingVertical: 13,
    paddingHorizontal: 20,
    marginBottom: 28,
    textAlignVertical: "top",
    minHeight: 80,
  },
  btnOutline: {
    flex: 1,
    borderRadius: 999,
    borderWidth: 1.5,
    paddingVertical: 15,
    alignItems: "center",
  },
  btnFill: {
    flex: 1,
    borderRadius: 999,
    paddingVertical: 15,
    alignItems: "center",
  },
});
