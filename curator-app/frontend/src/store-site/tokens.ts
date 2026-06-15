/** Warm-paper palette mirrored from the Expo app theme-provider (light). */
export const LP = {
  bg: '#fbf9f3',
  lowest: '#ffffff',
  low: '#f5f4ec',
  container: '#efeee5',
  high: '#e9e9de',
  onSurface: '#31332b',
  onVariant: '#5e6056',
  primary: '#5f5e5e',
  primaryFg: '#faf7f6',
  secondary: '#625f56',
  secondaryContainer: '#e7e2d7',
  onSecondaryContainer: '#545249',
  inverse: '#0e0e0b',
  inverseOn: '#e9e8e3',
  outline: '#7a7c71',
  outlineVariant: '#b1b3a7',
  error: '#c78b8b',
  errorContainer: '#f5e0e0',
} as const;

/** Organic asymmetric corners — scaled from mobile/src/ui/tokens/spacing `shape`. */
export const SHAPE_HERO = {
  borderTopLeftRadius: 44,
  borderTopRightRadius: 22,
  borderBottomRightRadius: 58,
  borderBottomLeftRadius: 34,
} as const;

export const SHAPE_FEATURED = {
  borderTopLeftRadius: 48,
  borderTopRightRadius: 26,
  borderBottomRightRadius: 64,
  borderBottomLeftRadius: 34,
} as const;

export const SHAPE_ITEM = {
  borderTopLeftRadius: 30,
  borderTopRightRadius: 18,
  borderBottomRightRadius: 40,
  borderBottomLeftRadius: 24,
} as const;

export const SHAPE_THUMB = {
  borderTopLeftRadius: 20,
  borderTopRightRadius: 10,
  borderBottomRightRadius: 20,
  borderBottomLeftRadius: 10,
} as const;

export const SHAPE_MINI = {
  borderTopLeftRadius: 32,
  borderTopRightRadius: 24,
  borderBottomRightRadius: 42,
  borderBottomLeftRadius: 28,
} as const;

export const LAUNCH_DATE = new Date('2026-09-01T10:00:00');
export const LAUNCH_LABEL = 'September 2026';

export const SITE_URL = 'https://thecuratorgroup.org';

export const STORE_CONTACT = {
  support: 'support@thecuratorgroup.org',
  privacy: 'privacy@thecuratorgroup.org',
} as const;

/** Shared store-listing copy — keep marketing + legal pages in sync. */
export const STORE_PLATFORMS = {
  label: 'App Store, Google Play & Galaxy Store',
  amp: 'App Store, Google Play & Galaxy Store',
  short: 'App Store · Google Play · Galaxy Store',
  marquee: 'APP STORE · GOOGLE PLAY · GALAXY STORE',
  meta: 'Launching on the App Store, Google Play, and Samsung Galaxy Store',
  notify: 'when The Curator hits the App Store, Google Play, and Galaxy Store',
  review: 'App Store, Google Play & Samsung Galaxy Store',
} as const;

export type StorePlatform = 'apple' | 'google' | 'samsung';

export const PILL_BORDER = `${LP.outlineVariant}4D`;
export const PILL_SURFACE = 'rgba(255,255,255,0.7)';

export type StoreNavKey = 'home' | 'privacy' | 'terms' | 'support' | 'deletion';
