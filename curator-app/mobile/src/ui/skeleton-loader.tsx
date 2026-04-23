import React, { memo, useEffect } from "react";
import { StyleSheet, View, type ViewStyle } from "react-native";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from "react-native-reanimated";
import { LinearGradient } from "expo-linear-gradient";

import { useTheme } from "../providers/theme-provider";

interface SkeletonBoxProps {
  width: number | string;
  height: number;
  borderRadius?: number;
  style?: ViewStyle;
}

function SkeletonBoxInner({
  width,
  height,
  borderRadius = 8,
  style,
}: SkeletonBoxProps) {
  const { palette } = useTheme();
  const translateX = useSharedValue(-200);

  useEffect(() => {
    translateX.value = -200;
    translateX.value = withRepeat(
      withTiming(400, { duration: 1500, easing: Easing.linear }),
      -1
    );
  }, [translateX]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  const resolvedWidth = typeof width === "string" ? width : width;

  return (
    <View
      style={[
        {
          width: resolvedWidth as any,
          height,
          borderRadius,
          backgroundColor: palette.surfaceContainerHigh,
          overflow: "hidden",
        },
        style,
      ]}
    >
      <Animated.View style={[StyleSheet.absoluteFill, animatedStyle]}>
        <LinearGradient
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          colors={[
            "transparent",
            palette.surfaceContainerHighest + "66",
            "transparent",
          ]}
          style={{ width: 200, height: "100%" }}
        />
      </Animated.View>
    </View>
  );
}

export const SkeletonBox = memo(SkeletonBoxInner);

// Preset: Article Card Skeleton (default variant)
function ArticleCardSkeletonInner() {
  return (
    <View style={styles.articleCard}>
      <SkeletonBox
        width="100%"
        height={300}
        borderRadius={0}
        style={{
          borderTopLeftRadius: 80,
          borderTopRightRadius: 40,
          borderBottomRightRadius: 100,
          borderBottomLeftRadius: 60,
        }}
      />
      <View style={styles.articleCardContent}>
        <SkeletonBox width="90%" height={24} borderRadius={6} />
        <SkeletonBox width="70%" height={24} borderRadius={6} />
        <SkeletonBox width="100%" height={14} borderRadius={4} />
        <SkeletonBox width="60%" height={14} borderRadius={4} />
        <View style={styles.metaRow}>
          <SkeletonBox width={60} height={10} borderRadius={4} />
          <SkeletonBox width={60} height={10} borderRadius={4} />
        </View>
      </View>
    </View>
  );
}

export const ArticleCardSkeleton = memo(ArticleCardSkeletonInner);

// Preset: Compact Card Skeleton
function CompactCardSkeletonInner() {
  return (
    <View style={styles.compactCard}>
      <SkeletonBox
        width={80}
        height={80}
        borderRadius={0}
        style={{
          borderTopLeftRadius: 40,
          borderTopRightRadius: 20,
          borderBottomRightRadius: 50,
          borderBottomLeftRadius: 30,
        }}
      />
      <View style={styles.compactContent}>
        <SkeletonBox width={50} height={10} borderRadius={4} />
        <SkeletonBox width="100%" height={16} borderRadius={4} />
        <SkeletonBox width="70%" height={16} borderRadius={4} />
        <SkeletonBox width={60} height={10} borderRadius={4} />
      </View>
    </View>
  );
}

export const CompactCardSkeleton = memo(CompactCardSkeletonInner);

// Preset: Brief Card Skeleton
function BriefCardSkeletonInner() {
  return (
    <View style={styles.briefCard}>
      <View style={styles.briefContent}>
        <SkeletonBox width={80} height={10} borderRadius={4} />
        <SkeletonBox width="80%" height={20} borderRadius={6} />
        <SkeletonBox width="60%" height={14} borderRadius={4} />
      </View>
      <SkeletonBox width={80} height={80} borderRadius={40} />
    </View>
  );
}

export const BriefCardSkeleton = memo(BriefCardSkeletonInner);

const styles = StyleSheet.create({
  articleCard: {
    gap: 0,
  },
  articleCardContent: {
    gap: 8,
    paddingTop: 16,
  },
  metaRow: {
    flexDirection: "row",
    gap: 16,
    marginTop: 4,
  },
  compactCard: {
    flexDirection: "row",
    gap: 16,
    alignItems: "center",
  },
  compactContent: {
    flex: 1,
    gap: 6,
  },
  briefCard: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 60,
    padding: 24,
    gap: 16,
  },
  briefContent: {
    flex: 1,
    gap: 8,
  },
});
