/**
 * Surgical store-site color enhancements.
 * Set to `false` and save to revert all accent styling in one place.
 */
export const STORE_COLOR_ENHANCEMENTS = true;

export const ACCENT = {
  gold: '#c8bfa6',
  goldMuted: '#9c9477',
  goldSurface: 'rgba(200, 191, 166, 0.24)',
  goldBorder: 'rgba(200, 191, 166, 0.48)',
  goldGlow: '0 0 18px rgba(200, 191, 166, 0.22)',
  goldHoverShadow: '0 22px 44px -22px rgba(200, 191, 166, 0.35)',
  onGold: '#4a4638',
  headlineMuted: '#8a8368',
  heroWash:
    'radial-gradient(ellipse 90% 80% at 8% 42%, rgba(196, 188, 160, 0.32) 0%, rgba(225, 218, 198, 0.14) 42%, transparent 72%)',
} as const;

export type FeatureTintKey = 'briefs' | 'depth' | 'audio' | 'saves';

const STORE_PILL_LIGHT = {
  bg: 'rgba(255, 255, 255, 0.4)',
  border: 'rgba(49, 51, 43, 0.1)',
  text: 'rgba(49, 51, 43, 0.7)',
  icon: '#31332b',
} as const;

const STORE_PILL_DARK = {
  bg: 'rgba(26, 26, 22, 1)',
  border: 'rgba(233, 232, 227, 0.15)',
  text: 'rgba(245, 244, 236, 0.8)',
  icon: 'rgba(245, 244, 236, 0.8)',
} as const;

/** Unified paper tone — no per-category tints. */
export function featureTint(_key?: FeatureTintKey) {
  return { bg: '#e7e2d7', icon: '#545249' };
}

/** Neutral store badges — no Apple grey or Play green. */
export function storePill(_platform: 'apple' | 'google', tone: 'light' | 'dark' = 'light') {
  return tone === 'dark' ? STORE_PILL_DARK : STORE_PILL_LIGHT;
}

export function navActiveStyle(isActive: boolean, fallbackBg: string) {
  if (!isActive) return { backgroundColor: 'transparent', color: undefined };
  if (!STORE_COLOR_ENHANCEMENTS) return { backgroundColor: fallbackBg, color: undefined };
  return {
    backgroundColor: ACCENT.goldSurface,
    color: ACCENT.onGold,
    border: `1px solid ${ACCENT.goldBorder}`,
  };
}

export function launchAlertChipStyle(fallback: { bg: string; color: string }) {
  if (!STORE_COLOR_ENHANCEMENTS) return fallback;
  return { bg: ACCENT.goldSurface, color: ACCENT.onGold, border: ACCENT.goldBorder };
}
