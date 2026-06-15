import type { ReactNode } from "react";
import { AuthBrandPanel } from "./auth-brand-panel";

interface AuthScreenLayoutProps {
  children: ReactNode;
  hero?: ReactNode;
}

/**
 * Auth shell — CSS breakpoints (lg = 1024px), no JS layout dependency.
 * Mobile: hero on top, actions pinned toward the bottom (scrollable).
 * Desktop: split column with brand/hero left, form right.
 */
export function AuthScreenLayout({ children, hero }: AuthScreenLayoutProps) {
  const panel = hero ?? <AuthBrandPanel />;

  return (
    <div className="min-h-[100dvh] bg-background">
      <div className="mx-auto flex min-h-[100dvh] w-full max-w-[1400px] flex-col lg:grid lg:grid-cols-[minmax(320px,44%)_1fr]">
        <aside className="flex shrink-0 flex-col items-center justify-center px-6 py-8 lg:min-h-[100dvh] lg:border-r lg:border-outline-variant/10 lg:px-10 lg:py-12">
          {panel}
        </aside>

        <main className="flex min-h-0 flex-1 flex-col justify-end px-6 pb-8 pt-2 lg:justify-center lg:px-12 lg:py-12">
          <div className="relative z-20 mx-auto w-full max-w-md">{children}</div>
        </main>
      </div>
    </div>
  );
}
