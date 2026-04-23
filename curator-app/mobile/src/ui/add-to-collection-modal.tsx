import React, { memo, useCallback, useEffect, useRef, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import {
  BottomSheetModal,
  BottomSheetScrollView,
  BottomSheetBackdrop,
  BottomSheetFooter,
  type BottomSheetBackdropProps,
  type BottomSheetFooterProps,
} from "@gorhom/bottom-sheet";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useTheme } from "../providers/theme-provider";
import { useCollections } from "../providers/collections-provider";

interface AddToCollectionModalProps {
  visible: boolean;
  onClose: () => void;
  articleId: string;
}

function AddToCollectionModalInner({
  visible,
  onClose,
  articleId,
}: AddToCollectionModalProps) {
  const { palette } = useTheme();
  const { collections, addArticleToCollection } = useCollections();
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const modalRef = useRef<BottomSheetModal>(null);
  const insets = useSafeAreaInsets();

  useEffect(() => {
    if (visible) {
      modalRef.current?.present();
    } else {
      modalRef.current?.dismiss();
    }
  }, [visible]);

  const handleDismiss = useCallback(() => {
    setSelectedIds(new Set());
    onClose();
  }, [onClose]);

  const toggleSelection = useCallback((collectionId: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(collectionId)) {
        next.delete(collectionId);
      } else {
        next.add(collectionId);
      }
      return next;
    });
  }, []);

  const handleAdd = useCallback(() => {
    selectedIds.forEach((collectionId) => {
      addArticleToCollection(collectionId, articleId);
    });
    setSelectedIds(new Set());
    onClose();
  }, [selectedIds, addArticleToCollection, articleId, onClose]);

  const renderBackdrop = useCallback(
    (props: BottomSheetBackdropProps) => (
      <BottomSheetBackdrop
        {...props}
        disappearsOnIndex={-1}
        appearsOnIndex={0}
        opacity={0.5}
        onPress={handleDismiss}
      />
    ),
    [handleDismiss],
  );

  const renderFooter = useCallback(
    (props: BottomSheetFooterProps) => (
      <BottomSheetFooter {...props} bottomInset={insets.bottom}>
        <View
          style={[styles.footer, { borderTopColor: palette.border, backgroundColor: palette.surfaceContainerLowest }]}
        >
          <Pressable
            onPress={handleAdd}
            disabled={selectedIds.size === 0}
            style={[
              styles.addButton,
              { backgroundColor: palette.inverseSurface, opacity: selectedIds.size === 0 ? 0.5 : 1 },
            ]}
          >
            <Text style={[styles.addButtonText, { color: palette.inverseOnSurface }]}>
              Add
            </Text>
          </Pressable>
          <Pressable onPress={handleDismiss} style={styles.cancelButton}>
            <Text style={[styles.cancelButtonText, { color: palette.onSurfaceVariant }]}>
              Cancel
            </Text>
          </Pressable>
        </View>
      </BottomSheetFooter>
    ),
    [handleAdd, handleDismiss, selectedIds.size, palette, insets.bottom],
  );

  return (
    <BottomSheetModal
      ref={modalRef}
      snapPoints={["60%"]}
      onDismiss={handleDismiss}
      backdropComponent={renderBackdrop}
      footerComponent={renderFooter}
      backgroundStyle={{ backgroundColor: palette.surfaceContainerLowest }}
      handleIndicatorStyle={{ backgroundColor: palette.outlineVariant }}
    >
      <View style={[styles.header, { borderBottomColor: palette.border }]}>
        <Text style={[styles.headerTitle, { color: palette.onSurface }]}>
          Add to Collection
        </Text>
      </View>

      <BottomSheetScrollView contentContainerStyle={styles.scrollContent}>
        {collections.length === 0 && (
          <View style={styles.emptyState}>
            <Text style={[styles.emptyText, { color: palette.onSurfaceVariant }]}>
              No collections yet. Create one to get started.
            </Text>
          </View>
        )}
        {collections.map((collection) => {
          const isSelected = selectedIds.has(collection.id);
          return (
            <Pressable
              key={collection.id}
              onPress={() => toggleSelection(collection.id)}
              style={[
                styles.collectionItem,
                {
                  backgroundColor: palette.surfaceContainerLow + "80",
                  borderColor: isSelected ? palette.primary : palette.outlineVariant + "26",
                  borderWidth: isSelected ? 2 : 1,
                },
              ]}
            >
              <Text style={[styles.collectionName, { color: palette.onSurface }]}>
                {collection.name}
              </Text>
              <Text style={[styles.collectionCount, { color: palette.onSurfaceVariant }]}>
                {collection.articleIds.length} articles
              </Text>
            </Pressable>
          );
        })}
        {/* Space for footer */}
        <View style={{ height: 140 }} />
      </BottomSheetScrollView>
    </BottomSheetModal>
  );
}

export const AddToCollectionModal = memo(AddToCollectionModalInner);

const styles = StyleSheet.create({
  header: {
    padding: 16,
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontFamily: "Newsreader_500Medium",
    fontSize: 24,
    textAlign: "center",
  },
  scrollContent: {
    padding: 16,
    gap: 12,
  },
  emptyState: {
    padding: 24,
    alignItems: "center",
  },
  emptyText: {
    fontFamily: "Manrope_400Regular",
    fontSize: 14,
    textAlign: "center",
  },
  collectionItem: {
    borderRadius: 30,
    padding: 16,
  },
  collectionName: {
    fontFamily: "Manrope_600SemiBold",
    fontSize: 16,
  },
  collectionCount: {
    fontFamily: "Manrope_400Regular",
    fontSize: 12,
    marginTop: 2,
  },
  footer: {
    padding: 24,
    borderTopWidth: 1,
    gap: 12,
  },
  addButton: {
    borderRadius: 999,
    paddingVertical: 16,
  },
  addButtonText: {
    fontFamily: "Manrope_600SemiBold",
    fontSize: 16,
    textAlign: "center",
  },
  cancelButton: {
    paddingVertical: 8,
  },
  cancelButtonText: {
    fontFamily: "Manrope_500Medium",
    fontSize: 14,
    textAlign: "center",
  },
});
