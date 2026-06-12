import type { CSSProperties, ReactNode } from "react";

import { COMPACT_FEED_GAP, FEED_ITEM_GAP } from "./tokens/spacing";

type FeedStackVariant = "default" | "compact" | "grid";

interface FeedStackProps {
  children: ReactNode;
  variant?: FeedStackVariant;
}

/**
 * Controlled layouts for lists of ArticleCards.
 * Mobile/default stays a vertical app feed; desktop grids must use ArticleCard variant="grid".
 */
export function FeedStack({ children, variant = "default" }: FeedStackProps) {
  const style: CSSProperties = {
    display: variant === "grid" ? "grid" : "flex",
    flexDirection: variant === "grid" ? undefined : "column",
    gridTemplateColumns:
      variant === "grid" ? "repeat(auto-fill, minmax(280px, 1fr))" : undefined,
    gap:
      variant === "compact"
        ? COMPACT_FEED_GAP
        : variant === "grid"
          ? 24
          : FEED_ITEM_GAP,
  };

  return (
    <div style={style} data-layout="feed-stack" data-variant={variant}>
      {children}
    </div>
  );
}
