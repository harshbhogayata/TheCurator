import type { ReactNode } from "react";

import { useLayout } from "../../providers/layout-provider";
import { buildLayoutStyle } from "./layout-utils";

interface FeedLayoutProps {
  children: ReactNode;
  reserveTopChrome?: boolean;
}

export function FeedLayout({ children, reserveTopChrome = true }: FeedLayoutProps) {
  const layout = useLayout();
  const maxWidth = layout.isWebDesktop ? layout.feedMaxWidth : layout.maxContentWidth;

  return (
    <main
      style={buildLayoutStyle(maxWidth, { ...layout, reserveTopChrome })}
      data-layout="feed"
    >
      {children}
    </main>
  );
}
