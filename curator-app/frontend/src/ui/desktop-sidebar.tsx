import { Link, useLocation, useNavigate } from "react-router";
import {
  Sparkles,
  Compass,
  Bookmark,
  Search,
  Settings,
  FolderOpen,
  BarChart3,
  Heart,
} from "lucide-react";

import { useAuth } from "../app/context/AuthContext";
import { ImageWithFallback } from "../app/components/figma/ImageWithFallback";
import { IMAGES } from "../app/constants/images";
import { useLayout } from "../providers/layout-provider";
import { DEV_BANNER_HEIGHT } from "../lib/layout";

const PRIMARY_NAV = [
  { path: "/brief", label: "Briefs", Icon: Sparkles, fillable: true },
  { path: "/explore", label: "Explore", Icon: Compass, fillable: false },
  { path: "/search", label: "Search", Icon: Search, fillable: false },
  { path: "/saved", label: "Saved", Icon: Bookmark, fillable: true },
] as const;

const SECONDARY_NAV = [
  { path: "/collections", label: "Collections", Icon: FolderOpen },
  { path: "/reading-stats", label: "Reading Stats", Icon: BarChart3 },
  { path: "/donate", label: "Support", Icon: Heart },
] as const;

function isNavActive(pathname: string, path: string): boolean {
  if (path === "/explore") {
    return pathname === "/explore" || pathname === "/home";
  }
  return pathname === path || pathname.startsWith(`${path}/`);
}

export function DesktopSidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { sidebarWidth, devBannerActive } = useLayout();
  const avatar = user?.profileImage || IMAGES.profile.main;

  return (
    <aside
      className="fixed inset-y-0 left-0 z-40 flex flex-col border-r border-outline-variant/10 bg-surface-container-low"
      style={{
        width: sidebarWidth,
        paddingTop: devBannerActive ? DEV_BANNER_HEIGHT : 0,
      }}
      data-layout="desktop-sidebar"
    >
      <div className="px-5 py-6">
        <Link
          to="/brief"
          className="font-[family-name:var(--font-headline)] text-[1.65rem] italic leading-none text-on-surface"
        >
          The Curator
        </Link>
      </div>

      <nav className="flex-1 space-y-1 px-3">
        {PRIMARY_NAV.map(({ path, label, Icon, fillable }) => {
          const active = isNavActive(location.pathname, path);
          return (
            <Link
              key={path}
              to={path}
              className={`flex items-center gap-2.5 rounded-full px-4 py-2.5 text-[13px] transition-colors ${
                active
                  ? "bg-primary/10 font-medium text-primary"
                  : "text-on-surface-variant hover:bg-surface-container hover:text-on-surface"
              }`}
            >
              <Icon className="h-4 w-4 shrink-0" fill={active && fillable ? "currentColor" : "none"} />
              {label}
            </Link>
          );
        })}

        <div className="my-3 border-t border-outline-variant/10" />

        {SECONDARY_NAV.map(({ path, label, Icon }) => {
          const active = isNavActive(location.pathname, path);
          return (
            <Link
              key={path}
              to={path}
              className={`flex items-center gap-2.5 rounded-full px-4 py-2.5 text-[13px] transition-colors ${
                active
                  ? "bg-surface-container font-medium text-on-surface"
                  : "text-on-surface-variant hover:bg-surface-container hover:text-on-surface"
              }`}
            >
              <Icon className="h-4 w-4 shrink-0" />
              {label}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-outline-variant/10 p-2.5">
        <Link
          to="/settings"
          className="mb-0.5 flex items-center gap-2.5 rounded-full px-4 py-2.5 text-[13px] text-on-surface-variant transition-colors hover:bg-surface-container hover:text-on-surface"
        >
          <Settings className="h-4 w-4" />
          Settings
        </Link>
        <button
          type="button"
          onClick={() => navigate("/account")}
          className="flex w-full items-center gap-2.5 rounded-full px-3 py-2 text-left transition-colors hover:bg-surface-container"
        >
          <div className="h-8 w-8 shrink-0 overflow-hidden rounded-full">
            <ImageWithFallback src={avatar} alt="" className="h-full w-full object-cover" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-[13px] font-medium text-on-surface">{user?.name ?? "Account"}</p>
          </div>
        </button>
      </div>
    </aside>
  );
}
