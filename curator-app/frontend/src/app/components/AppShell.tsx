import type { CSSProperties, ReactNode } from "react";

import { AppHeader } from "../../ui/app-header";
import { BottomNav } from "./BottomNav";
import { DevModeBanner } from "./DevModeBanner";
import { useLayout } from "../../providers/layout-provider";
import { DesktopSidebar } from "../../ui/desktop-sidebar";
import { Masthead } from "../../ui/masthead";
import { FeedLayout } from "../../ui/layouts/feed-layout";
import { FormLayout } from "../../ui/layouts/form-layout";
import { ReadLayout } from "../../ui/layouts/read-layout";

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
  const { isWebDesktop, sidebarWidth } = useLayout();
  const reserveTopChrome = isWebDesktop ? showMasthead : showHeader;

  const shellVars = isWebDesktop
    ? ({
        "--curator-sidebar-width": `${sidebarWidth}px`,
        "--curator-masthead-height": "64px",
      } as CSSProperties)
    : undefined;

  const content =
    archetype === "feed" ? (
      <FeedLayout reserveTopChrome={reserveTopChrome}>{children}</FeedLayout>
    ) : archetype === "read" ? (
      <ReadLayout reserveTopChrome={reserveTopChrome}>{children}</ReadLayout>
    ) : (
      <FormLayout reserveTopChrome={reserveTopChrome}>{children}</FormLayout>
    );

  return (
    <div
      className="curator-shell min-h-screen bg-background"
      data-desktop={isWebDesktop ? "true" : undefined}
      style={shellVars}
    >
      <DevModeBanner />

      {isWebDesktop && <DesktopSidebar />}

      <div
        className="curator-shell-main min-w-0"
        data-layout="main-column"
        style={{
          ...(isWebDesktop
            ? {
                marginLeft: sidebarWidth,
                width: `calc(100% - ${sidebarWidth}px)`,
                maxWidth: `calc(100% - ${sidebarWidth}px)`,
              }
            : {}),
        }}
      >
        {isWebDesktop && showMasthead ? <Masthead title={title} /> : null}
        {!isWebDesktop && showHeader ? <AppHeader title={title} /> : null}
        {content}
      </div>

      {!isWebDesktop && <BottomNav />}
    </div>
  );
}
