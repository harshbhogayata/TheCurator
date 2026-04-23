import React, { memo, useCallback, useEffect, useRef } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import {
  BottomSheetModal,
  BottomSheetView,
  BottomSheetBackdrop,
  type BottomSheetBackdropProps,
} from "@gorhom/bottom-sheet";

import { useTheme } from "../providers/theme-provider";

interface ConfirmDialogProps {
  visible: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
  destructive?: boolean;
}

function ConfirmDialogInner({
  visible,
  title,
  message,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  onConfirm,
  onCancel,
  destructive = false,
}: ConfirmDialogProps) {
  const { palette, resolvedTheme } = useTheme();
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
        opacity={0.5}
        onPress={onCancel}
      />
    ),
    [onCancel],
  );

  return (
    <BottomSheetModal
      ref={modalRef}
      enableDynamicSizing
      onDismiss={onCancel}
      backdropComponent={renderBackdrop}
      backgroundStyle={{ backgroundColor: palette.surfaceContainerLowest }}
      handleIndicatorStyle={{ backgroundColor: palette.outlineVariant }}
    >
      <BottomSheetView style={styles.content}>
        <Text style={[styles.title, { color: palette.onSurface }]}>{title}</Text>
        <Text style={[styles.message, { color: palette.onSurfaceVariant }]}>{message}</Text>
        <View style={styles.buttons}>
          <Pressable
            onPress={onConfirm}
            style={[
              styles.button,
              { backgroundColor: destructive ? palette.error : palette.inverseSurface },
            ]}
          >
            <Text
              style={[
                styles.confirmText,
                { color: destructive ? palette.onError : palette.inverseOnSurface },
              ]}
            >
              {confirmLabel}
            </Text>
          </Pressable>
          <Pressable
            onPress={onCancel}
            style={[styles.button, { backgroundColor: palette.surfaceContainer }]}
          >
            <Text style={[styles.cancelText, { color: palette.onSurface }]}>
              {cancelLabel}
            </Text>
          </Pressable>
        </View>
      </BottomSheetView>
    </BottomSheetModal>
  );
}

export const ConfirmDialog = memo(ConfirmDialogInner);

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: 24,
    paddingBottom: 40,
    paddingTop: 8,
  },
  title: {
    fontFamily: "Newsreader_500Medium",
    fontSize: 20,
    marginBottom: 8,
    textAlign: "center",
  },
  message: {
    fontFamily: "Manrope_400Regular",
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 24,
    textAlign: "center",
  },
  buttons: {
    gap: 12,
  },
  button: {
    borderRadius: 999,
    paddingVertical: 16,
    paddingHorizontal: 24,
  },
  confirmText: {
    fontFamily: "Manrope_600SemiBold",
    fontSize: 16,
    textAlign: "center",
  },
  cancelText: {
    fontFamily: "Manrope_500Medium",
    fontSize: 16,
    textAlign: "center",
  },
});
