export const space = {
  xs:   4,
  sm:   8,
  md:   12,
  lg:   16,
  xl:   24,
  "2xl": 32,
  "3xl": 48,
} as const;

export const radius = {
  sm:   8,
  md:   14,
  lg:   20,
  xl:   28,
  pill: 999,
} as const;

// Organic asymmetric corner shapes — the two editorial shapes used across the app.
// All other image/card components must use one of these; do not invent new corner sets.
export const shape = {
  // Full-width hero images and featured cards
  imageHero: {
    borderTopLeftRadius: 80,
    borderTopRightRadius: 40,
    borderBottomRightRadius: 100,
    borderBottomLeftRadius: 60,
  },
  // Compact/thumbnail images and secondary cards
  imageCard: {
    borderTopLeftRadius: 40,
    borderTopRightRadius: 20,
    borderBottomRightRadius: 40,
    borderBottomLeftRadius: 20,
  },
} as const;

export const TAB_BAR_HEIGHT = 64;
