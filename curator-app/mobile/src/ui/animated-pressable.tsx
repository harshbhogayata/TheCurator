import { type PropsWithChildren } from "react";
import { Pressable, type PressableProps, type StyleProp, type ViewStyle } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";

import { useReduceMotion } from "../hooks/use-motion";
import { spring } from "./tokens/motion";

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

interface AnimatedPressProps extends Omit<PressableProps, "style"> {
  scaleValue?: number;
  style?: StyleProp<ViewStyle>;
}

export function PressableScale({
  children,
  scaleValue = 0.98,
  style,
  onPressIn,
  onPressOut,
  ...props
}: PropsWithChildren<AnimatedPressProps>) {
  const scale = useSharedValue(1);
  const reduceMotion = useReduceMotion();

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <AnimatedPressable
      onPressIn={(e) => {
        if (!reduceMotion) scale.value = withSpring(scaleValue, spring.press);
        onPressIn?.(e);
      }}
      onPressOut={(e) => {
        if (!reduceMotion) scale.value = withSpring(1, spring.settle);
        onPressOut?.(e);
      }}
      style={[animatedStyle, style] as any}
      {...props}
    >
      {children}
    </AnimatedPressable>
  );
}
