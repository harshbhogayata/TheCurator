import React, { memo, useCallback, useEffect, useRef } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import {
  BottomSheetModal,
  BottomSheetView,
  BottomSheetBackdrop,
  type BottomSheetBackdropProps,
} from "@gorhom/bottom-sheet";

import { useTextSizePreference } from "../hooks/use-text-size-preference";
import type { ArticleTypographyPreferences } from "../lib/article-typography";
import type { LineHeight, TextSize } from "../lib/types";
import { useTheme } from "../providers/theme-provider";
import {
  useReadingPreferences,
  type FontSize,
} from "../providers/reading-preferences-provider";

interface TypographySettingsProps {
  visible: boolean;
  onClose: () => void;
  /** Article typography only affects the current article; global updates account defaults. */
  scope?: "global" | "article";
  articleTypography?: ArticleTypographyPreferences | null;
  onArticleFontSizeChange?: (size: TextSize) => void;
  onArticleLineHeightChange?: (height: LineHeight) => void;
}

const FONT_SIZE_OPTIONS: { key: FontSize; label: string; value: number }[] = [
  { key: "compact",     label: "Compact",     value: 14 },
  { key: "comfortable", label: "Comfortable", value: 16 },
  { key: "large",       label: "Large",       value: 18 },
];

const LINE_HEIGHT_OPTIONS: { key: LineHeight; label: string }[] = [
  { key: "compact",     label: "Compact"     },
  { key: "comfortable", label: "Comfortable" },
  { key: "spacious",    label: "Spacious"    },
];

function TypographySettingsInner({
  visible,
  onClose,
  scope = "global",
  articleTypography,
  onArticleFontSizeChange,
  onArticleLineHeightChange,
}: TypographySettingsProps) {
  const { palette } = useTheme();
  const { fontSize, selectTextSize } = useTextSizePreference();
  const { preferences, setLineHeight } = useReadingPreferences();
  const modalRef = useRef<BottomSheetModal>(null);
  const isArticleScope = scope === "article";

  const activeFontSize = isArticleScope
    ? (articleTypography?.fontSize ?? preferences.fontSize)
    : fontSize;
  const activeLineHeight = isArticleScope
    ? (articleTypography?.lineHeight ?? preferences.lineHeight)
    : preferences.lineHeight;

  useEffect(() => {
    if (visible) {
      modalRef.current?.present();
    } else {
      modalRef.current?.dismiss();
    }
  }, [visible]);

  const renderBackdrop = useCallback(
    (props: BottomSheetBackdropProps) => (
      <BottomSheetBackdrop
        {...props}
        disappearsOnIndex={-1}
        appearsOnIndex={0}
        opacity={0.4}
        onPress={onClose}
      />
    ),
    [onClose],
  );

  const handleFontSizePress = (size: TextSize) => {
    if (isArticleScope) {
      onArticleFontSizeChange?.(size);
      return;
    }
    selectTextSize(size);
  };

  const handleLineHeightPress = (height: LineHeight) => {
    if (isArticleScope) {
      onArticleLineHeightChange?.(height);
      return;
    }
    setLineHeight(height);
  };

  return (
    <BottomSheetModal
      ref={modalRef}
      enableDynamicSizing
      onDismiss={onClose}
      backdropComponent={renderBackdrop}
      backgroundStyle={{ backgroundColor: palette.surfaceContainerLowest }}
      handleIndicatorStyle={{ backgroundColor: palette.outlineVariant }}
    >
      <BottomSheetView style={styles.content}>
        <Text style={[styles.sheetTitle, { color: palette.onSurface }]}>
          Typography
        </Text>
        {isArticleScope ? (
          <Text style={[styles.scopeHint, { color: palette.onSurfaceVariant }]}>
            Changes apply to this article only.
          </Text>
        ) : null}

        <Text style={[styles.sectionLabel, { color: palette.onSurfaceVariant }]}>
          FONT SIZE
        </Text>
        <View style={styles.optionsRow}>
          {FONT_SIZE_OPTIONS.map((option) => {
            const isSelected = activeFontSize === option.key;
            return (
              <Pressable
                key={option.key}
                onPress={() => handleFontSizePress(option.key)}
                style={[
                  styles.optionButton,
                  {
                    backgroundColor: isSelected ? palette.primary : palette.surfaceContainer,
                    borderColor: isSelected ? palette.primary : palette.outlineVariant + "33",
                    borderWidth: 2,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.optionLabel,
                    { color: isSelected ? palette.primaryForeground : palette.onSurface },
                  ]}
                >
                  {option.label}
                </Text>
                <Text
                  style={[
                    styles.optionValue,
                    { color: isSelected ? palette.primaryForeground : palette.onSurfaceVariant },
                  ]}
                >
                  {option.value}px
                </Text>
              </Pressable>
            );
          })}
        </View>

        <Text style={[styles.sectionLabel, { color: palette.onSurfaceVariant, marginTop: 24 }]}>
          LINE SPACING
        </Text>
        <View style={styles.optionsRow}>
          {LINE_HEIGHT_OPTIONS.map((option) => {
            const isSelected = activeLineHeight === option.key;
            return (
              <Pressable
                key={option.key}
                onPress={() => handleLineHeightPress(option.key)}
                style={[
                  styles.optionButton,
                  {
                    backgroundColor: isSelected ? palette.primary : palette.surfaceContainer,
                    borderColor: isSelected ? palette.primary : palette.outlineVariant + "33",
                    borderWidth: 2,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.optionLabel,
                    { color: isSelected ? palette.primaryForeground : palette.onSurface },
                  ]}
                >
                  {option.label}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </BottomSheetView>
    </BottomSheetModal>
  );
}

export const TypographySettings = memo(TypographySettingsInner);

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: 24,
    paddingBottom: 40,
    paddingTop: 8,
  },
  sheetTitle: {
    fontFamily: "Newsreader_500Medium",
    fontSize: 30,
    textAlign: "center",
    marginBottom: 24,
  },
  scopeHint: {
    fontFamily: "Manrope_400Regular",
    fontSize: 14,
    lineHeight: 20,
    textAlign: "center",
    marginTop: -12,
    marginBottom: 20,
  },
  sectionLabel: {
    fontFamily: "Manrope_600SemiBold",
    fontSize: 12,
    letterSpacing: 2,
    textTransform: "uppercase",
    marginBottom: 12,
  },
  optionsRow: {
    flexDirection: "row",
    gap: 12,
  },
  optionButton: {
    flex: 1,
    padding: 16,
    borderRadius: 16,
    alignItems: "center",
    gap: 4,
  },
  optionLabel: {
    fontFamily: "Manrope_600SemiBold",
    fontSize: 14,
    textAlign: "center",
  },
  optionValue: {
    fontFamily: "Manrope_400Regular",
    fontSize: 12,
    textAlign: "center",
  },
});
