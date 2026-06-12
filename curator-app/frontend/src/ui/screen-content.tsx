import type { CSSProperties, ReactNode } from "react";

import { useLayout } from "../providers/layout-provider";
import { MAX_CONTENT_WIDTH } from "../lib/layout";

interface ScreenContentProps {
  children: ReactNode;
  showHeader?: boolean;
}

/**
 * The only component allowed to set page content width and horizontal padding.
 * Mirrors mobile screens wrapping content with useLayout().contentPadding + maxContentWidth.
 */
export function ScreenContent({ children, showHeader = true }: ScreenContentProps) {
  const {
    maxContentWidth,
    contentPadding,
    contentTopOffset,
    contentBottomOffset,
    isWebDesktop,
  } = useLayout();

  const style: CSSProperties = {
    width: "100%",
    maxWidth: maxContentWidth,
    marginLeft: "auto",
    marginRight: "auto",
    paddingLeft: contentPadding,
    paddingRight: contentPadding,
    paddingTop: showHeader ? contentTopOffset : isWebDesktop ? 32 : 24,
    paddingBottom: contentBottomOffset,
    boxSizing: "border-box",
  };

  return (
    <main style={style} data-layout="screen-content" data-max-width={MAX_CONTENT_WIDTH}>
      {children}
    </main>
  );
}
