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
  DEV_BANNER_HEIGHT,
  MASTHEAD_HEIGHT,
  MOBILE_HEADER_CONTENT_OFFSET,
  type LayoutMetrics,
} from "../lib/layout";
import { isDevModeActive } from "../lib/dev-mode";
import { TAB_BAR_HEIGHT } from "../ui/tokens/spacing";

interface LayoutContextValue extends LayoutMetrics {
  /** Top padding before page content (accounts for header + dev banner) */
  contentTopOffset: number;
  /** Bottom padding (tab bar on mobile) */
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
  const [viewport, setViewport] = useState(readViewport);

  useEffect(() => {
    const onResize = () => setViewport(readViewport());
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  const value = useMemo((): LayoutContextValue => {
    const metrics = computeLayoutMetrics(viewport.width, viewport.height);
    const devBannerActive = isDevModeActive();
    const bannerOffset = devBannerActive ? DEV_BANNER_HEIGHT : 0;

    const contentTopOffset = metrics.isWebDesktop
      ? MASTHEAD_HEIGHT + 32 + bannerOffset
      : MOBILE_HEADER_CONTENT_OFFSET + bannerOffset;

    const contentBottomOffset = metrics.isWebDesktop
      ? 64
      : TAB_BAR_HEIGHT + 32;

    return {
      ...metrics,
      contentTopOffset,
      contentBottomOffset,
      devBannerActive,
    };
  }, [viewport.width, viewport.height]);

  return <LayoutContext.Provider value={value}>{children}</LayoutContext.Provider>;
}

/** Same role as mobile useLayout() — all screens must use this for spacing */
export function useLayout(): LayoutContextValue {
  const ctx = useContext(LayoutContext);
  if (!ctx) {
    throw new Error("useLayout must be used within LayoutProvider");
  }
  return ctx;
}
