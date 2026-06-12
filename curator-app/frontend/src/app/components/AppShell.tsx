import type { ReactNode } from "react";
import { useNavigate } from "react-router";
import { Menu as MenuIcon } from "lucide-react";

import { useAuth } from "../context/AuthContext";
import { ImageWithFallback } from "./figma/ImageWithFallback";
import { SubscriptionBadge } from "./SubscriptionBadge";
import { BottomNav } from "./BottomNav";
import { DevModeBanner } from "./DevModeBanner";
import { IMAGES } from "../constants/images";
import { useLayout } from "../../providers/layout-provider";
import { DesktopSidebar } from "../../ui/desktop-sidebar";
import { Masthead } from "../../ui/masthead";
import { FeedLayout } from "../../ui/layouts/feed-layout";
import { FormLayout } from "../../ui/layouts/form-layout";
import { ReadLayout } from "../../ui/layouts/read-layout";
import { DEV_BANNER_HEIGHT } from "../../lib/layout";

interface AppShellProps {
  children: ReactNode;
  title?: string;
  showHeader?: boolean;
  showMasthead?: boolean;
  archetype?: "feed" | "read" | "form";
}

export function AppShell({
  children,
  title = "The Curator",
  showHeader = true,
  showMasthead = true,
  archetype = "form",
}: AppShellProps) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { isWebDesktop, sidebarWidth, devBannerActive } = useLayout();
  const avatar = user?.profileImage || IMAGES.profile.main;
  const reserveTopChrome = isWebDesktop ? showMasthead : showHeader;

  const content =
    archetype === "feed" ? (
      <FeedLayout reserveTopChrome={reserveTopChrome}>{children}</FeedLayout>
    ) : archetype === "read" ? (
      <ReadLayout reserveTopChrome={reserveTopChrome}>{children}</ReadLayout>
    ) : (
      <FormLayout reserveTopChrome={reserveTopChrome}>{children}</FormLayout>
    );

  return (
    <div className="min-h-screen bg-surface-container-low">
      <DevModeBanner />

      {isWebDesktop && <DesktopSidebar />}
      {isWebDesktop && showMasthead && <Masthead title={title} />}

      <div
        className="flex w-full justify-center"
        style={{ marginLeft: isWebDesktop ? sidebarWidth : 0 }}
      >
        {showHeader && !isWebDesktop && (
          <header
            className="fixed z-50 w-full px-4"
            style={{ top: devBannerActive ? DEV_BANNER_HEIGHT + 16 : 16 }}
          >
            <div
              className="mx-auto flex items-center gap-2"
              style={{ maxWidth: 680 }}
            >
              <button
                type="button"
                onClick={() => navigate("/menu")}
                className="rounded-full border border-outline-variant/25 bg-background/90 p-2 shadow-sm backdrop-blur-md"
                aria-label="Open menu"
              >
                <MenuIcon className="h-5 w-5 text-on-surface" />
              </button>
              <div className="min-w-0 flex-1 rounded-full border border-outline-variant/25 bg-background/90 px-4 py-2 shadow-sm backdrop-blur-md">
                <h1 className="truncate text-center font-[family-name:var(--font-headline)] text-base italic text-on-surface">
                  {title}
                </h1>
              </div>
              <button
                type="button"
                onClick={() => navigate("/settings")}
                className="flex items-center gap-1 rounded-full border border-outline-variant/25 bg-background/90 py-1 pl-1 pr-2 shadow-sm backdrop-blur-md"
              >
                <SubscriptionBadge size="sm" />
                <div className="h-7 w-7 overflow-hidden rounded-full">
                  <ImageWithFallback src={avatar} alt="" className="h-full w-full object-cover" />
                </div>
              </button>
            </div>
          </header>
        )}

        {content}
      </div>

      {!isWebDesktop && <BottomNav />}
    </div>
  );
}
