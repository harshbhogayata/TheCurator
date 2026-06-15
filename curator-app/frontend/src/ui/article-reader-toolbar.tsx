import type { ReactNode } from "react";
import { ArrowLeft, Bookmark, FolderPlus, Share2, Type } from "lucide-react";

interface ArticleReaderToolbarProps {
  topOffset: number;
  isSaved: boolean;
  onBack: () => void;
  onTypography: () => void;
  onSave: () => void;
  onCollection: () => void;
  onShare: () => void;
}

function ToolbarButton({
  label,
  onClick,
  children,
}: {
  label: string;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className="glass-pill flex h-10 w-10 items-center justify-center border-2 border-outline-variant/30 text-on-surface transition-transform active:scale-[0.98] lg:h-11 lg:w-11"
    >
      {children}
    </button>
  );
}

export function ArticleReaderToolbar({
  topOffset,
  isSaved,
  onBack,
  onTypography,
  onSave,
  onCollection,
  onShare,
}: ArticleReaderToolbarProps) {
  return (
    <div
      className="sticky z-40 mb-8 flex items-center justify-between gap-3 lg:mb-10"
      style={{ top: topOffset }}
      data-layout="reader-toolbar"
    >
      <ToolbarButton label="Go back" onClick={onBack}>
        <ArrowLeft className="h-5 w-5" strokeWidth={2.5} />
      </ToolbarButton>

      <div className="flex items-center gap-2">
        <ToolbarButton label="Typography settings" onClick={onTypography}>
          <Type className="h-5 w-5" />
        </ToolbarButton>
        <ToolbarButton label={isSaved ? "Remove bookmark" : "Bookmark article"} onClick={onSave}>
          <Bookmark className="h-5 w-5" fill={isSaved ? "currentColor" : "none"} />
        </ToolbarButton>
        <ToolbarButton label="Add to collection" onClick={onCollection}>
          <FolderPlus className="h-5 w-5" />
        </ToolbarButton>
        <ToolbarButton label="Share article" onClick={onShare}>
          <Share2 className="h-5 w-5" />
        </ToolbarButton>
      </div>
    </div>
  );
}
