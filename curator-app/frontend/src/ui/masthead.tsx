import { type FormEvent, useState } from "react";
import { ChevronDown, LogOut, Moon, Search, Settings, Sun, User } from "lucide-react";
import { useNavigate } from "react-router";

import { useAuth } from "../app/context/AuthContext";
import { useTheme } from "../app/context/ThemeContext";
import { ImageWithFallback } from "../app/components/figma/ImageWithFallback";
import { SubscriptionBadge } from "../app/components/SubscriptionBadge";
import { IMAGES } from "../app/constants/images";
import { useLayout } from "../providers/layout-provider";
import { DEV_BANNER_HEIGHT } from "../lib/layout";

interface MastheadProps {
  title: string;
}

export function Masthead({ title }: MastheadProps) {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { effectiveTheme, setTheme } = useTheme();
  const { sidebarWidth, devBannerActive, mastheadHeight } = useLayout();
  const [searchQuery, setSearchQuery] = useState("");
  const [accountOpen, setAccountOpen] = useState(false);

  const avatar = user?.profileImage || IMAGES.profile.main;
  const firstName = user?.name?.split(" ")[0] ?? "Account";

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const query = searchQuery.trim();
    navigate(query ? `/search?q=${encodeURIComponent(query)}` : "/search");
  };

  const handleSignOut = () => {
    signOut();
    setAccountOpen(false);
    navigate("/");
  };

  return (
    <header
      className="fixed right-0 z-50 hidden border-b border-outline-variant/10 bg-background/85 backdrop-blur-xl lg:block"
      style={{
        left: sidebarWidth,
        top: devBannerActive ? DEV_BANNER_HEIGHT : 0,
        height: mastheadHeight,
      }}
      data-layout="masthead"
    >
      <div className="mx-auto flex h-full max-w-[1200px] items-center gap-5 px-8">
        <h1 className="min-w-0 flex-1 truncate font-[family-name:var(--font-headline)] text-2xl italic text-on-surface">
          {title}
        </h1>

        <form onSubmit={handleSubmit} className="w-[min(36vw,420px)]">
          <label className="relative block">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-outline" />
            <input
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Search narratives..."
              className="h-10 w-full rounded-full border border-outline-variant/20 bg-surface-container-lowest/80 pl-10 pr-4 text-sm text-on-surface shadow-sm outline-none transition-colors placeholder:text-outline focus:border-primary/50"
            />
          </label>
        </form>

        <button
          type="button"
          onClick={() => setTheme(effectiveTheme === "dark" ? "light" : "dark")}
          className="flex h-10 w-10 items-center justify-center rounded-full border border-outline-variant/20 bg-surface-container-lowest/70 text-on-surface-variant transition-colors hover:bg-surface-container hover:text-on-surface"
          aria-label="Toggle theme"
        >
          {effectiveTheme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        </button>

        <div className="relative">
          <button
            type="button"
            onClick={() => setAccountOpen((open) => !open)}
            className="flex items-center gap-2 rounded-full border border-outline-variant/20 bg-surface-container-lowest/70 py-1 pl-1 pr-3 transition-colors hover:bg-surface-container"
            aria-expanded={accountOpen}
          >
            <div className="h-8 w-8 overflow-hidden rounded-full">
              <ImageWithFallback src={avatar} alt="" className="h-full w-full object-cover" />
            </div>
            <span className="max-w-24 truncate text-sm text-on-surface">{firstName}</span>
            <SubscriptionBadge size="sm" />
            <ChevronDown className="h-4 w-4 text-outline" />
          </button>

          {accountOpen && (
            <div className="absolute right-0 top-12 w-56 rounded-[24px] border border-outline-variant/15 bg-surface-container-lowest p-2 shadow-2xl">
              <button
                type="button"
                onClick={() => {
                  setAccountOpen(false);
                  navigate("/account");
                }}
                className="flex w-full items-center gap-3 rounded-2xl px-3 py-2 text-left text-sm text-on-surface hover:bg-surface-container"
              >
                <User className="h-4 w-4 text-outline" />
                Account
              </button>
              <button
                type="button"
                onClick={() => {
                  setAccountOpen(false);
                  navigate("/settings");
                }}
                className="flex w-full items-center gap-3 rounded-2xl px-3 py-2 text-left text-sm text-on-surface hover:bg-surface-container"
              >
                <Settings className="h-4 w-4 text-outline" />
                Settings
              </button>
              <button
                type="button"
                onClick={handleSignOut}
                className="flex w-full items-center gap-3 rounded-2xl px-3 py-2 text-left text-sm text-error hover:bg-error/10"
              >
                <LogOut className="h-4 w-4" />
                Sign out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
