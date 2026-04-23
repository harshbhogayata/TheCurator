import React, { memo, useCallback, useEffect, useRef } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import {
  BottomSheetModal,
  BottomSheetView,
  BottomSheetBackdrop,
  type BottomSheetBackdropProps,
} from "@gorhom/bottom-sheet";
import { Lock, X } from "lucide-react-native";

import { useTheme } from "../providers/theme-provider";
import type { SubscriptionTier } from "../providers/subscription-provider";

interface PaywallModalProps {
  visible: boolean;
  onClose: () => void;
  featureName: string;
  requiredTier: SubscriptionTier;
  onUpgrade?: () => void;
}

function tierLabel(tier: SubscriptionTier): string {
  switch (tier) {
    case "basic":    return "Basic";
    case "premium":  return "Premium";
    case "lifetime": return "Lifetime";
    default:         return tier;
  }
}

function PaywallModalInner({
  visible,
  onClose,
  featureName,
  requiredTier,
  onUpgrade,
}: PaywallModalProps) {
  const { palette } = useTheme();
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
        {/* Close button */}
        <Pressable onPress={onClose} style={styles.closeButton}>
          <X size={18} color={palette.onSurfaceVariant} />
        </Pressable>

        {/* Icon */}
        <View style={[styles.iconContainer, { backgroundColor: palette.primaryContainer }]}>
          <Lock size={32} color={palette.onPrimaryContainer} />
        </View>

        <Text style={[styles.title, { color: palette.onSurface }]}>
          Unlock {featureName}
        </Text>
        <Text style={[styles.description, { color: palette.onSurfaceVariant }]}>
          Upgrade to {tierLabel(requiredTier)} to access this feature and more.
        </Text>

        <Pressable
          onPress={onUpgrade ?? onClose}
          style={[
            styles.primaryButton,
            { backgroundColor: palette.onSurface, shadowColor: "#000" },
          ]}
        >
          <Text style={[styles.primaryButtonText, { color: palette.background }]}>
            Upgrade Now
          </Text>
        </Pressable>

        <Pressable
          onPress={onClose}
          style={[styles.secondaryButton, { backgroundColor: palette.surfaceContainer }]}
        >
          <Text style={[styles.secondaryButtonText, { color: palette.onSurface }]}>
            Not Now
          </Text>
        </Pressable>
      </BottomSheetView>
    </BottomSheetModal>
  );
}

export const PaywallModal = memo(PaywallModalInner);

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: 24,
    paddingBottom: 40,
    paddingTop: 8,
    alignItems: "center",
  },
  closeButton: {
    alignSelf: "flex-end",
    width: 32,
    height: 32,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  title: {
    fontFamily: "Newsreader_500Medium",
    fontSize: 30,
    textAlign: "center",
    marginBottom: 8,
  },
  description: {
    fontFamily: "Manrope_400Regular",
    fontSize: 16,
    lineHeight: 24,
    textAlign: "center",
    marginBottom: 24,
  },
  primaryButton: {
    width: "100%",
    borderRadius: 999,
    paddingVertical: 16,
    paddingHorizontal: 24,
    marginBottom: 12,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 8,
  },
  primaryButtonText: {
    fontFamily: "Manrope_600SemiBold",
    fontSize: 16,
    textAlign: "center",
  },
  secondaryButton: {
    width: "100%",
    borderRadius: 999,
    paddingVertical: 16,
    paddingHorizontal: 24,
  },
  secondaryButtonText: {
    fontFamily: "Manrope_500Medium",
    fontSize: 16,
    textAlign: "center",
  },
});
