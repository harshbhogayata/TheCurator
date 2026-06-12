import type { ReactNode } from "react";

import { useLayout } from "../../providers/layout-provider";
import { buildLayoutStyle } from "./layout-utils";

interface ReadLayoutProps {
  children: ReactNode;
  reserveTopChrome?: boolean;
}

export function ReadLayout({ children, reserveTopChrome = true }: ReadLayoutProps) {
  const layout = useLayout();
  const maxWidth = layout.isWebDesktop ? layout.readCanvasWidth : layout.maxContentWidth;

  return (
    <main
      style={buildLayoutStyle(maxWidth, { ...layout, reserveTopChrome })}
      data-layout="read"
      data-read-measure={layout.readMeasure}
    >
      {children}
    </main>
  );
}
