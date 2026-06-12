/**
 * Keep in sync with mobile/src/ui/tokens/spacing.ts
 * @see curator-app/mobile/src/ui/tokens/spacing.ts
 */

export const space = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  "2xl": 32,
  "3xl": 48,
} as const;

export const radius = {
  sm: 8,
  md: 14,
  lg: 20,
  xl: 28,
  pill: 999,
} as const;

/** Organic asymmetric corners — only these two shapes exist in the product */
export const shape = {
  imageHero: {
    borderTopLeftRadius: 80,
    borderTopRightRadius: 40,
    borderBottomRightRadius: 100,
    borderBottomLeftRadius: 60,
  },
  imageCard: {
    borderTopLeftRadius: 40,
    borderTopRightRadius: 20,
    borderBottomRightRadius: 40,
    borderBottomLeftRadius: 20,
  },
} as const;

export const TAB_BAR_HEIGHT = 64;

/** Vertical gap between feed items — matches Explore marginBottom: 48 on mobile */
export const FEED_ITEM_GAP = space["3xl"];

/** Compact list gap (search results) */
export const COMPACT_FEED_GAP = space.lg;
