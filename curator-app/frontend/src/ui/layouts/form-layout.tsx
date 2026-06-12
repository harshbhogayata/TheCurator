import type { ReactNode } from "react";

import { useLayout } from "../../providers/layout-provider";
import { buildLayoutStyle } from "./layout-utils";

interface FormLayoutProps {
  children: ReactNode;
  reserveTopChrome?: boolean;
}

export function FormLayout({ children, reserveTopChrome = true }: FormLayoutProps) {
  const layout = useLayout();
  const maxWidth = layout.isWebDesktop ? layout.formMaxWidth : layout.maxContentWidth;

  return (
    <main
      style={buildLayoutStyle(maxWidth, { ...layout, reserveTopChrome })}
      data-layout="form"
    >
      {children}
    </main>
  );
}
