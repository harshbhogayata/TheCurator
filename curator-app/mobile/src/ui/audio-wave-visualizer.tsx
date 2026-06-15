import { useEffect } from "react";
import { StyleSheet, View, type StyleProp, type ViewStyle } from "react-native";
import Animated, {
  Easing,
  cancelAnimation,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
} from "react-native-reanimated";
import { LinearGradient } from "expo-linear-gradient";

import { useReduceMotion } from "../hooks/use-motion";

const MIN_SCALE_VALUE = 0.22;
const MAX_SCALE_VALUE = 1;

// Middle bars taller — Samsung Music-style silhouette.
const PEAKS = [0.45, 0.62, 0.82, 0.95, 1, 0.95, 0.82, 0.62, 0.45];

interface AudioWaveVisualizerProps {
  active: boolean;
  color: string;
  secondaryColor?: string;
  height?: number;
  barWidth?: number;
  gap?: number;
  style?: StyleProp<ViewStyle>;
}

function WaveBar({
  index,
  active,
  peak,
  barHeight,
  barWidth,
  color,
  secondaryColor,
  reduceMotion,
}: {
  index: number;
  active: boolean;
  peak: number;
  barHeight: number;
  barWidth: number;
  color: string;
  secondaryColor: string;
  reduceMotion: boolean;
}) {
  const scale = useSharedValue(MIN_SCALE_VALUE);

  useEffect(() => {
    cancelAnimation(scale);

    if (!active || reduceMotion) {
      scale.value = withTiming(MIN_SCALE_VALUE + peak * 0.12, {
        duration: 280,
        easing: Easing.out(Easing.cubic),
      });
      return;
    }

    const upMs = 340 + index * 28;
    const downMs = 360 + index * 24;
    const peakScale = MIN_SCALE_VALUE + peak * (MAX_SCALE_VALUE - MIN_SCALE_VALUE);

    scale.value = withDelay(
      index * 55,
      withRepeat(
        withSequence(
          withTiming(peakScale, {
            duration: upMs,
            easing: Easing.inOut(Easing.sin),
          }),
          withTiming(MIN_SCALE_VALUE + peak * 0.28, {
            duration: downMs,
            easing: Easing.inOut(Easing.sin),
          }),
        ),
        -1,
        false,
      ),
    );
  }, [active, index, peak, reduceMotion, scale]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scaleY: scale.value }],
  }));

  return (
    <Animated.View
      style={[
        styles.bar,
        {
          width: barWidth,
          height: barHeight,
          borderRadius: barWidth / 2,
          transformOrigin: "bottom",
        },
        animatedStyle,
      ]}
    >
      <LinearGradient
        colors={[secondaryColor, color]}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
    </Animated.View>
  );
}

export function AudioWaveVisualizer({
  active,
  color,
  secondaryColor,
  height = 44,
  barWidth = 4,
  gap = 5,
  style,
}: AudioWaveVisualizerProps) {
  const reduceMotion = useReduceMotion();
  const accent = secondaryColor ?? color;

  return (
    <View style={[styles.row, { height, gap }, style]}>
      {PEAKS.map((peak, index) => (
        <WaveBar
          key={index}
          index={index}
          active={active}
          peak={peak}
          barHeight={height}
          barWidth={barWidth}
          color={color}
          secondaryColor={accent}
          reduceMotion={reduceMotion}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  bar: {
    overflow: "hidden",
  },
});
