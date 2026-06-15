import type { CSSProperties } from "react";

interface LayoutPaddingOptions {
  contentPadding: number;
  contentTopOffset: number;
  contentBottomOffset: number;
  isWebDesktop: boolean;
  reserveTopChrome: boolean;
}

export function buildLayoutStyle(
  maxWidth: number,
  {
    contentPadding,
    contentTopOffset,
    contentBottomOffset,
    isWebDesktop,
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
      : (isWebDesktop ? 32 : 24),
    paddingBottom: contentBottomOffset,
    boxSizing: "border-box",
  };
}
