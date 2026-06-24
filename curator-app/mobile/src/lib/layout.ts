import { useWindowDimensions } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { space } from "../ui/tokens/spacing";

export const BREAKPOINTS = {
  sm: 375,  // iPhone SE, small Android
  lg: 768,  // iPad, large tablet
} as const;

export const MAX_CONTENT_WIDTH = 680;

/** Space below the floating header before hero content, and before the next section. */
export const TAB_HERO_GAP = space.xl;

// Header sits at insets.top + 16, pill height is 52, plus 8px buffer before content.
export function useHeaderOffset() {
  const { top } = useSafeAreaInsets();
  return top + 76;
}

/** Scroll paddingTop: clears floating header + standard hero breathing room. */
export function useTabScrollPaddingTop() {
  return useHeaderOffset() + TAB_HERO_GAP;
}

/** Scroll paddingTop for modal screens with floating PillPageHeader. */
export function useModalScrollPadding() {
  return useHeaderOffset() + 12;
}

export function useLayout() {
  const { width, height } = useWindowDimensions();
  const isTablet = width >= BREAKPOINTS.lg;
  const isSmallPhone = width < BREAKPOINTS.sm;

  return {
    width,
    height,
    isTablet,
    isSmallPhone,
    // Horizontal padding that scales with device width
    contentPadding: isSmallPhone ? 14 : isTablet ? 32 : 20,
    // Max readable width — centers content on wide screens
    maxContentWidth: Math.min(width, MAX_CONTENT_WIDTH),
  };
}
