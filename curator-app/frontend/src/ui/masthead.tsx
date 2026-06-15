import { type FormEvent, useState } from "react";

import { ChevronDown, LogOut, Moon, Search, Settings, Sun, User } from "lucide-react";

import { useLocation, useNavigate } from "react-router";



import { useAuth } from "../app/context/AuthContext";

import { useTheme } from "../app/context/ThemeContext";

import { SubscriptionBadge } from "../app/components/SubscriptionBadge";

import { useLayout } from "../providers/layout-provider";

import { ProfileAvatar } from "./profile-avatar";



interface MastheadProps {

  title: string;

}



export function Masthead({ title }: MastheadProps) {

  const location = useLocation();

  const navigate = useNavigate();

  const { user, signOut } = useAuth();

  const { effectiveTheme, setTheme } = useTheme();

  const { sidebarWidth, mastheadHeight } = useLayout();

  const [searchQuery, setSearchQuery] = useState("");

  const [accountOpen, setAccountOpen] = useState(false);



  const hideSearch = location.pathname === "/search";

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

      className="fixed right-0 z-50 border-b border-outline-variant/10 bg-surface/90 backdrop-blur-xl"

      style={{

        left: sidebarWidth,

        top: 0,

        height: mastheadHeight,

      }}

      data-layout="masthead"

    >

      <div className="mx-auto flex h-full w-full min-w-0 max-w-[1200px] items-center gap-4 px-6 lg:gap-5 lg:px-8">

        <h1 className="min-w-0 flex-1 truncate font-[family-name:var(--font-headline)] text-xl italic text-on-surface lg:text-2xl">

          {title}

        </h1>



        {!hideSearch && (

          <form onSubmit={handleSubmit} className="hidden min-w-0 shrink md:block md:max-w-[280px] lg:max-w-[340px] lg:flex-1">

            <label className="relative block">

              <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-outline" />

              <input

                value={searchQuery}

                onChange={(event) => setSearchQuery(event.target.value)}

                placeholder="Search narratives..."

                className="h-10 w-full rounded-full border border-outline-variant/15 bg-surface-container-low pl-10 pr-4 text-sm text-on-surface shadow-sm outline-none transition-colors placeholder:text-outline focus:border-primary/40 focus:bg-surface-container-lowest"

              />

            </label>

          </form>

        )}



        <button

          type="button"

          onClick={() => setTheme(effectiveTheme === "dark" ? "light" : "dark")}

          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-outline-variant/15 bg-surface-container-low text-on-surface-variant transition-colors hover:bg-surface-container hover:text-on-surface"

          aria-label="Toggle theme"

        >

          {effectiveTheme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}

        </button>



        <div className="relative shrink-0">

          <button

            type="button"

            onClick={() => setAccountOpen((open) => !open)}

            className="flex items-center gap-2 rounded-full border border-outline-variant/15 bg-surface-container-low py-1 pl-1 pr-3 transition-colors hover:bg-surface-container"

            aria-expanded={accountOpen}

          >

            <ProfileAvatar avatarUrl={user?.profileImage} name={user?.name} email={user?.email} size={32} />

            <span className="hidden max-w-24 truncate text-sm text-on-surface sm:inline">{firstName}</span>

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


