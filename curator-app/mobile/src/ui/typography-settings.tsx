import React, { memo, useCallback, useEffect, useRef } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import {
  BottomSheetModal,
  BottomSheetView,
  BottomSheetBackdrop,
  type BottomSheetBackdropProps,
} from "@gorhom/bottom-sheet";

import { useTheme } from "../providers/theme-provider";
import {
  useReadingPreferences,
  type FontSize,
  type LineHeight,
} from "../providers/reading-preferences-provider";

interface TypographySettingsProps {
  visible: boolean;
  onClose: () => void;
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

function TypographySettingsInner({ visible, onClose }: TypographySettingsProps) {
  const { palette } = useTheme();
  const { preferences, setFontSize, setLineHeight } = useReadingPreferences();
  const modalRef = useRef<BottomSheetModal>(null);

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

        <Text style={[styles.sectionLabel, { color: palette.onSurfaceVariant }]}>
          FONT SIZE
        </Text>
        <View style={styles.optionsRow}>
          {FONT_SIZE_OPTIONS.map((option) => {
            const isSelected = preferences.fontSize === option.key;
            return (
              <Pressable
                key={option.key}
                onPress={() => setFontSize(option.key)}
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
            const isSelected = preferences.lineHeight === option.key;
            return (
              <Pressable
                key={option.key}
                onPress={() => setLineHeight(option.key)}
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
