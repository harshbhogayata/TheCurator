import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import {
  computeLayoutMetrics,
  MASTHEAD_HEIGHT,
  MOBILE_HEADER_CONTENT_OFFSET,
  type LayoutMetrics,
} from "../lib/layout";
import { isDevModeActive } from "../lib/dev-mode";
import { TAB_BAR_HEIGHT } from "../ui/tokens/spacing";

interface LayoutContextValue extends LayoutMetrics {
  contentTopOffset: number;
  contentBottomOffset: number;
  devBannerActive: boolean;
}

const LayoutContext = createContext<LayoutContextValue | null>(null);

function readViewport() {
  return {
    width: window.innerWidth,
    height: window.innerHeight,
  };
}

export function LayoutProvider({ children }: { children: ReactNode }) {
  const [viewport, setViewport] = useState({ width: 0, height: 0 });

  useEffect(() => {
    const sync = () => setViewport(readViewport());
    sync();
    window.addEventListener("resize", sync);
    return () => window.removeEventListener("resize", sync);
  }, []);

  const value = useMemo((): LayoutContextValue => {
    const metrics = computeLayoutMetrics(viewport.width, viewport.height);
    const devBannerActive = isDevModeActive();

    const contentTopOffset = metrics.isWebDesktop
      ? MASTHEAD_HEIGHT + 32
      : MOBILE_HEADER_CONTENT_OFFSET;

    const contentBottomOffset = metrics.isWebDesktop ? 64 : TAB_BAR_HEIGHT + 32;

    return {
      ...metrics,
      contentTopOffset,
      contentBottomOffset,
      devBannerActive,
    };
  }, [viewport.width, viewport.height]);

  return <LayoutContext.Provider value={value}>{children}</LayoutContext.Provider>;
}

export function useLayout(): LayoutContextValue {
  const ctx = useContext(LayoutContext);
  if (!ctx) {
    throw new Error("useLayout must be used within LayoutProvider");
  }
  return ctx;
}
