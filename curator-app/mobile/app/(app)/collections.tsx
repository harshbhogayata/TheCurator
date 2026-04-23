import { useCallback, useRef, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Plus, FolderOpen, Trash2, X } from "lucide-react-native";
import {
  BottomSheetModal,
  BottomSheetView,
  BottomSheetBackdrop,
  BottomSheetTextInput,
  type BottomSheetBackdropProps,
} from "@gorhom/bottom-sheet";
import { Image } from "expo-image";

import { useTheme } from "../../src/providers/theme-provider";
import { useCollections } from "../../src/providers/collections-provider";
import { useToast } from "../../src/providers/toast-provider";
import { ConfirmDialog } from "../../src/ui/confirm-dialog";
import { shape } from "../../src/ui/tokens/spacing";
import { type } from "../../src/ui/tokens/typography";
import { PillPageHeader } from "../../src/ui/pill-page-header";
import { useArticles } from "../../src/hooks/use-articles";
import { IMAGES } from "../../src/data/images";

const IMAGE_BY_QUERY: Record<string, string> = {
  "modern architecture shadows geometric": IMAGES.editorial.economy,
  "futuristic circuit board technology dark": IMAGES.editorial.technology,
  "climate environment nature earth": IMAGES.briefs.climate,
  "culture art museum gallery": IMAGES.editorial.brief,
  "health wellness medicine medical": IMAGES.profile.woman,
  "politics government capitol building": IMAGES.editorial.avatar,
  "science research laboratory discovery": IMAGES.hero.welcome,
};

function getArticleImage(imageQuery: string): string {
  return IMAGE_BY_QUERY[imageQuery.toLowerCase()] ?? IMAGES.editorial.brief;
}

const PRESET_COLORS = ["#6366f1", "#ec4899", "#f59e0b", "#10b981", "#3b82f6", "#8b5cf6"];

export default function CollectionsScreen() {
  const { palette } = useTheme();
  const { collections, createCollection, deleteCollection } = useCollections();
  const { data: allArticles = [] } = useArticles();
  const { showToast } = useToast();
  const router = useRouter();

  const createModalRef = useRef<BottomSheetModal>(null);
  const [newName, setNewName] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [selectedColor, setSelectedColor] = useState(PRESET_COLORS[0]);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const openCreate = useCallback(() => createModalRef.current?.present(), []);
  const closeCreate = useCallback(() => createModalRef.current?.dismiss(), []);

  const handleCreate = useCallback(() => {
    if (!newName.trim()) {
      showToast("error", "Please enter a collection name");
      return;
    }
    createCollection(newName.trim(), newDescription.trim(), selectedColor);
    showToast("success", "Collection created!");
    closeCreate();
    setNewName("");
    setNewDescription("");
    setSelectedColor(PRESET_COLORS[0]);
  }, [newName, newDescription, selectedColor, createCollection, showToast, closeCreate]);

  const handleCreateDismiss = useCallback(() => {
    setNewName("");
    setNewDescription("");
    setSelectedColor(PRESET_COLORS[0]);
  }, []);

  const handleDelete = useCallback(() => {
    if (deleteId) {
      deleteCollection(deleteId);
      showToast("success", "Collection deleted");
      setDeleteId(null);
    }
  }, [deleteId, deleteCollection, showToast]);

  const renderBackdrop = useCallback(
    (props: BottomSheetBackdropProps) => (
      <BottomSheetBackdrop
        {...props}
        disappearsOnIndex={-1}
        appearsOnIndex={0}
        opacity={0.5}
        onPress={closeCreate}
      />
    ),
    [closeCreate],
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: palette.background }}>
      <PillPageHeader title="Collections" />

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 48, paddingTop: 8 }}
        showsVerticalScrollIndicator={false}
      >
        {/* New Collection row */}
        <Pressable
          onPress={openCreate}
          style={({ pressed }) => [
            styles.createRow,
            {
              backgroundColor: pressed ? palette.surfaceContainerLow : palette.surfaceContainerLowest,
              borderColor: palette.outlineVariant + "26",
            },
          ]}
        >
          <View style={[styles.createIcon, { backgroundColor: palette.surfaceContainerHigh }]}>
            <Plus size={20} color={palette.onSurfaceVariant} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.createTitle, { color: palette.onSurface }]}>
              New Collection
            </Text>
            <Text style={[styles.createSub, { color: palette.onSurfaceVariant }]}>
              Organise your saved narratives
            </Text>
          </View>
        </Pressable>

        {/* Collection list */}
        {collections.length === 0 ? (
          <View style={styles.emptyState}>
            <FolderOpen size={40} color={palette.outlineVariant} style={{ marginBottom: 16 }} />
            <Text style={[styles.emptyTitle, { color: palette.onSurface }]}>
              No collections yet
            </Text>
            <Text style={[styles.emptySub, { color: palette.onSurfaceVariant }]}>
              Create one to start organising your reading.
            </Text>
          </View>
        ) : (
          <View style={{ gap: 16 }}>
            {collections.map((collection) => {
              const coverArticles = allArticles
                .filter((a) => collection.articleIds.includes(a.id))
                .slice(0, 4);
              const slots = [
                ...coverArticles,
                ...Array(Math.max(0, 4 - coverArticles.length)).fill(null),
              ];

              return (
                <Pressable
                  key={collection.id}
                  onPress={() => router.push(`/(app)/collection/${collection.id}`)}
                  style={({ pressed }) => [
                    styles.card,
                    {
                      backgroundColor: pressed
                        ? palette.surfaceContainerLow
                        : palette.surfaceContainerLowest + "B3",
                      borderColor: palette.outlineVariant + "26",
                    },
                  ]}
                >
                  <View style={styles.cardRow}>
                    {/* Circular thumbnail */}
                    <View
                      style={[
                        styles.thumbnail,
                        { borderColor: palette.outlineVariant + "33" },
                      ]}
                    >
                      {coverArticles.length > 0 ? (
                        <View style={{ flex: 1, flexDirection: "row", flexWrap: "wrap" }}>
                          {slots.map((a, i) =>
                            a ? (
                              <Image
                                key={i}
                                source={{ uri: getArticleImage(a.imageQuery) }}
                                style={{ width: "50%", height: "50%" }}
                                contentFit="cover"
                                transition={200}
                              />
                            ) : (
                              <View
                                key={i}
                                style={{
                                  width: "50%",
                                  height: "50%",
                                  backgroundColor: collection.color + "30",
                                }}
                              />
                            )
                          )}
                        </View>
                      ) : (
                        <View
                          style={{
                            flex: 1,
                            backgroundColor: collection.color + "22",
                            alignItems: "center",
                            justifyContent: "center",
                          }}
                        >
                          <FolderOpen size={24} color={collection.color} />
                        </View>
                      )}
                    </View>

                    {/* Text */}
                    <View style={{ flex: 1, minWidth: 0 }}>
                      <Text style={[styles.cardTitle, { color: palette.onSurface }]}>
                        {collection.name}
                      </Text>
                      {collection.description ? (
                        <Text
                          numberOfLines={1}
                          style={[styles.cardDesc, { color: palette.onSurfaceVariant }]}
                        >
                          {collection.description}
                        </Text>
                      ) : null}
                      <Text style={[styles.cardMeta, { color: palette.outline }]}>
                        {collection.articleIds.length}{" "}
                        {collection.articleIds.length === 1 ? "article" : "articles"}
                      </Text>
                    </View>

                    <Pressable
                      onPress={(e) => {
                        e.stopPropagation?.();
                        setDeleteId(collection.id);
                      }}
                      hitSlop={12}
                      style={{ paddingLeft: 8 }}
                    >
                      <Trash2 size={14} color={palette.outline} />
                    </Pressable>
                  </View>
                </Pressable>
              );
            })}
          </View>
        )}
      </ScrollView>

      {/* Create Sheet */}
      <BottomSheetModal
        ref={createModalRef}
        snapPoints={["75%"]}
        keyboardBehavior="interactive"
        keyboardBlurBehavior="restore"
        onDismiss={handleCreateDismiss}
        backdropComponent={renderBackdrop}
        backgroundStyle={{ backgroundColor: palette.surfaceContainerLowest }}
        handleIndicatorStyle={{ backgroundColor: palette.outlineVariant }}
      >
        <BottomSheetView style={{ paddingHorizontal: 24, paddingBottom: 32, paddingTop: 8 }}>
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
            <Text style={[styles.sheetTitle, { color: palette.onSurface }]}>
              New Collection
            </Text>
            <Pressable onPress={closeCreate} hitSlop={8}>
              <X size={20} color={palette.onSurfaceVariant} />
            </Pressable>
          </View>

          <Text style={[styles.fieldLabel, { color: palette.onSurfaceVariant }]}>Name</Text>
          <BottomSheetTextInput
            value={newName}
            onChangeText={setNewName}
            placeholder="e.g., Tech News, Travel Ideas…"
            placeholderTextColor={palette.onSurfaceVariant + "80"}
            style={[styles.input, { color: palette.onSurface, backgroundColor: palette.inputBackground, borderColor: palette.outlineVariant + "33" }]}
            autoFocus
          />

          <Text style={[styles.fieldLabel, { color: palette.onSurfaceVariant }]}>
            Description{" "}
            <Text style={[type.caption, { fontFamily: "Manrope_400Regular", textTransform: "none", letterSpacing: 0 }]}>
              (optional)
            </Text>
          </Text>
          <BottomSheetTextInput
            value={newDescription}
            onChangeText={setNewDescription}
            placeholder="What's this collection about?"
            placeholderTextColor={palette.onSurfaceVariant + "80"}
            multiline
            numberOfLines={3}
            style={[styles.inputMulti, { color: palette.onSurface, backgroundColor: palette.inputBackground, borderColor: palette.outlineVariant + "33" }]}
          />

          <Text style={[styles.fieldLabel, { color: palette.onSurfaceVariant }]}>Colour</Text>
          <View style={{ flexDirection: "row", gap: 12, marginBottom: 28 }}>
            {PRESET_COLORS.map((color) => (
              <Pressable
                key={color}
                onPress={() => setSelectedColor(color)}
                style={{
                  width: 34,
                  height: 34,
                  borderRadius: 17,
                  backgroundColor: color,
                  borderWidth: selectedColor === color ? 3 : 0,
                  borderColor: palette.onSurface,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                {selectedColor === color && (
                  <View style={{ width: 9, height: 9, borderRadius: 5, backgroundColor: "#fff" }} />
                )}
              </Pressable>
            ))}
          </View>

          <View style={{ flexDirection: "row", gap: 12 }}>
            <Pressable
              onPress={() => { closeCreate(); setNewName(""); setNewDescription(""); }}
              style={[styles.btnOutline, { borderColor: palette.outlineVariant }]}
            >
              <Text style={[type.label, { fontFamily: "Manrope_500Medium", fontSize: 15, color: palette.onSurface }]}>Cancel</Text>
            </Pressable>
            <Pressable
              onPress={handleCreate}
              style={[styles.btnFill, { backgroundColor: palette.inverseSurface }]}
            >
              <Text style={[type.label, { fontSize: 15, color: palette.inverseOnSurface }]}>Create</Text>
            </Pressable>
          </View>
        </BottomSheetView>
      </BottomSheetModal>

      <ConfirmDialog
        visible={deleteId !== null}
        title="Delete Collection?"
        message="This will remove the collection but keep your saved articles."
        confirmLabel="Delete"
        cancelLabel="Cancel"
        onConfirm={handleDelete}
        onCancel={() => setDeleteId(null)}
        destructive
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  createRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    padding: 18,
    borderRadius: 24,
    borderWidth: 1,
    marginBottom: 24,
  },
  createIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  createTitle: {
    ...type.label,
    marginBottom: 2,
  },
  createSub: {
    ...type.labelSm,
    fontFamily: "Manrope_400Regular",
  },
  card: {
    borderWidth: 1,
    padding: 16,
    ...shape.imageCard,
  },
  cardRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
  thumbnail: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 2,
    overflow: "hidden",
  },
  cardTitle: {
    fontFamily: "Newsreader_500Medium",
    fontSize: 18,
    lineHeight: 22,
    marginBottom: 4,
  },
  cardDesc: {
    ...type.labelSm,
    fontFamily: "Manrope_400Regular",
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 6,
  },
  cardMeta: {
    ...type.overline,
    fontFamily: "Manrope_500Medium",
    letterSpacing: 1.5,
  },
  emptyState: {
    paddingVertical: 64,
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
    ...type.label,
    fontFamily: "Manrope_400Regular",
    textAlign: "center",
    lineHeight: 21,
  },
  sheetTitle: {
    ...type.headlineMd,
  },
  fieldLabel: {
    ...type.overline,
    fontSize: 11,
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
    marginBottom: 20,
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
