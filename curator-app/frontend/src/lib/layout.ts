/**
 * Web layout contract.
 *
 * Mobile (<1024px) mirrors mobile/src/lib/layout.ts.
 * Desktop (>=1024px) intentionally diverges into website-native archetypes.
 *
 * @see curator-app/mobile/src/lib/layout.ts
 */

/** Keep in sync with mobile BREAKPOINTS */
export const BREAKPOINTS = {
  sm: 375,
  lg: 768,
} as const;

/** Keep in sync with mobile MAX_CONTENT_WIDTH */
export const MAX_CONTENT_WIDTH = 680;

/** Desktop feed canvas for editorial grids */
export const FEED_MAX_WIDTH = 1200;

/** Desktop reading canvas; body copy uses READ_MEASURE inside it */
export const READ_CANVAS_WIDTH = 1120;
export const READ_MEASURE = 720;

/** Desktop settings/forms column */
export const FORM_MAX_WIDTH = 760;

/** Keep in sync with mobile tab bar (tabs/_layout.tsx maxWidth: 420) */
export const TAB_BAR_MAX_WIDTH = 420;

/** Web-only: sidebar appears at this width (mobile app keeps bottom tabs on tablet) */
export const WEB_DESKTOP_BREAKPOINT = 1024;

export const WEB_SIDEBAR_WIDTH = 220;

export const DEV_BANNER_HEIGHT = 28;
export const MASTHEAD_HEIGHT = 64;

/** Mobile: insets.top + 76 — web approximates without safe-area */
export const MOBILE_HEADER_CONTENT_OFFSET = 88;

export type OrganicShape = {
  borderTopLeftRadius: number;
  borderTopRightRadius: number;
  borderBottomRightRadius: number;
  borderBottomLeftRadius: number;
};

export function organicBorderRadius(shape: OrganicShape): string {
  return `${shape.borderTopLeftRadius}px ${shape.borderTopRightRadius}px ${shape.borderBottomRightRadius}px ${shape.borderBottomLeftRadius}px`;
}

export function organicShapeStyle(shape: OrganicShape): { borderRadius: string } {
  return { borderRadius: organicBorderRadius(shape) };
}

export function contentPaddingForWidth(width: number): number {
  if (width < BREAKPOINTS.sm) return 14;
  if (width >= BREAKPOINTS.lg) return 32;
  return 20;
}

export function isWebDesktop(width: number): boolean {
  return width >= WEB_DESKTOP_BREAKPOINT;
}

export function isSmallPhone(width: number): boolean {
  return width < BREAKPOINTS.sm;
}

export interface LayoutMetrics {
  width: number;
  height: number;
  isWebDesktop: boolean;
  isSmallPhone: boolean;
  contentPadding: number;
  /** Mobile-compatible max column width */
  maxContentWidth: number;
  feedMaxWidth: number;
  readCanvasWidth: number;
  readMeasure: number;
  formMaxWidth: number;
  mastheadHeight: number;
  sidebarWidth: number;
  tabBarMaxWidth: number;
}

export function computeLayoutMetrics(width: number, height: number): LayoutMetrics {
  return {
    width,
    height,
    isWebDesktop: isWebDesktop(width),
    isSmallPhone: isSmallPhone(width),
    contentPadding: contentPaddingForWidth(width),
    maxContentWidth: MAX_CONTENT_WIDTH,
    feedMaxWidth: FEED_MAX_WIDTH,
    readCanvasWidth: READ_CANVAS_WIDTH,
    readMeasure: READ_MEASURE,
    formMaxWidth: FORM_MAX_WIDTH,
    mastheadHeight: MASTHEAD_HEIGHT,
    sidebarWidth: WEB_SIDEBAR_WIDTH,
    tabBarMaxWidth: TAB_BAR_MAX_WIDTH,
  };
}
