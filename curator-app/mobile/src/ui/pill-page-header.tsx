import React, { memo } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { BlurView } from "expo-blur";
import { ArrowLeft } from "lucide-react-native";
import { useRouter } from "expo-router";

import { useTheme } from "../providers/theme-provider";

interface PillPageHeaderProps {
  title: string;
  onBackPress?: () => void;
}

const BACK_SLOT_WIDTH = 52;

function PillPageHeaderInner({ title, onBackPress }: PillPageHeaderProps) {
  const { palette, resolvedTheme } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const tint = resolvedTheme === "dark" ? "dark" : "light";
  const handleBackPress = onBackPress ?? (() => router.back());

  return (
    <View
      style={[
        styles.container,
        {
          paddingTop: insets.top + 8,
        },
      ]}
    >
      <View style={styles.sideSlot}>
        <View style={styles.shadow}>
          <Pressable
            onPress={handleBackPress}
            style={[
              styles.iconPill,
              {
                borderColor: palette.outlineVariant + "4D",
              },
            ]}
          >
          <BlurView
            pointerEvents="none"
            intensity={72}
              tint={tint}
              style={[
                styles.blurFill,
                { backgroundColor: palette.surfaceContainerLowest + "CC" },
              ]}
            />
            <View style={styles.iconButton}>
              <ArrowLeft size={20} color={palette.onSurface} strokeWidth={2.3} />
            </View>
          </Pressable>
        </View>
      </View>

      <View style={styles.centerOverlay} pointerEvents="box-none">
        <View style={[styles.shadow, styles.titleWrap]}>
          <View
            style={[
              styles.titlePill,
              {
                borderColor: palette.outlineVariant + "4D",
              },
            ]}
          >
          <BlurView
            pointerEvents="none"
            intensity={72}
              tint={tint}
              style={[
                styles.blurFill,
                { backgroundColor: palette.surfaceContainerLowest + "CC" },
              ]}
            />
            <Text
              numberOfLines={2}
              adjustsFontSizeToFit
              minimumFontScale={0.78}
              style={[styles.titleText, { color: palette.onSurface }]}
            >
              {title}
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.sideSlot} />
    </View>
  );
}

export const PillPageHeader = memo(PillPageHeaderInner);

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingBottom: 14,
    minHeight: 52,
  },
  sideSlot: {
    width: BACK_SLOT_WIDTH,
    zIndex: 2,
  },
  centerOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: BACK_SLOT_WIDTH + 24,
    zIndex: 1,
  },
  shadow: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.1,
    shadowRadius: 18,
    elevation: 8,
  },
  blurFill: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 999,
  },
  iconPill: {
    borderRadius: 999,
    borderWidth: 2,
    padding: 4,
    overflow: "hidden",
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  titleWrap: {
    maxWidth: "100%",
    minWidth: 0,
  },
  titlePill: {
    minHeight: 52,
    borderRadius: 999,
    borderWidth: 2,
    paddingHorizontal: 20,
    paddingVertical: 10,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  titleText: {
    fontFamily: "Newsreader_500Medium_Italic",
    fontSize: 26,
    lineHeight: 32,
    textAlign: "center",
    includeFontPadding: false,
  },
});
