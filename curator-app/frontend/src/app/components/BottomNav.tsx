import { Link, useLocation } from "react-router";
import { Sparkles, Compass, Bookmark, Search } from "lucide-react";

import { TAB_BAR_MAX_WIDTH } from "../../lib/layout";

export function BottomNav() {
  const location = useLocation();

  const tabs = [
    { path: "/brief", label: "Brief", Icon: Sparkles, fillable: true },
    { path: "/explore", label: "Explore", Icon: Compass, fillable: false },
    { path: "/search", label: "Search", Icon: Search, fillable: false },
    { path: "/saved", label: "Saved", Icon: Bookmark, fillable: true },
  ] as const;

  return (
    <nav className="fixed bottom-4 left-0 right-0 z-50 flex justify-center px-4">
      <div
        className="w-full rounded-[40px] border-2 border-outline-variant/20 bg-surface-container-lowest/80 px-3 shadow-[0_8px_32px_rgba(0,0,0,0.12)] backdrop-blur-2xl"
        style={{ maxWidth: TAB_BAR_MAX_WIDTH }}
      >
        <div className="flex h-16 items-center justify-between">
          {tabs.map(({ path, label, Icon, fillable }) => {
            const isActive =
              location.pathname === path ||
              (path === "/explore" && location.pathname === "/home");

            return (
              <Link
                key={path}
                to={path}
                className={`flex flex-1 flex-col items-center justify-center gap-0.5 rounded-full px-2 py-2 transition-all ${
                  isActive
                    ? "bg-primary text-primary-foreground"
                    : "text-on-surface-variant hover:text-on-surface"
                }`}
              >
                <Icon
                  className="h-5 w-5"
                  strokeWidth={isActive ? 2 : 1.5}
                  fill={isActive && fillable ? "currentColor" : "none"}
                />
                <span className="text-[11px] font-medium tracking-wide">{label}</span>
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
