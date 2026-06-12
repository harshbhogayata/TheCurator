import type { CSSProperties } from "react";

import { DEV_BANNER_HEIGHT } from "../../lib/layout";

interface LayoutPaddingOptions {
  contentPadding: number;
  contentTopOffset: number;
  contentBottomOffset: number;
  isWebDesktop: boolean;
  devBannerActive: boolean;
  reserveTopChrome: boolean;
}

export function buildLayoutStyle(
  maxWidth: number,
  {
    contentPadding,
    contentTopOffset,
    contentBottomOffset,
    isWebDesktop,
    devBannerActive,
    reserveTopChrome,
  }: LayoutPaddingOptions,
): CSSProperties {
  return {
    width: "100%",
    maxWidth,
    marginLeft: "auto",
    marginRight: "auto",
    paddingLeft: contentPadding,
    paddingRight: contentPadding,
    paddingTop: reserveTopChrome
      ? contentTopOffset
      : (isWebDesktop ? 32 : 24) + (devBannerActive ? DEV_BANNER_HEIGHT : 0),
    paddingBottom: contentBottomOffset,
    boxSizing: "border-box",
  };
}
