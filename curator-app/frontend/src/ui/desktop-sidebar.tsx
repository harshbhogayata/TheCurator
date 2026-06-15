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

import { useLayout } from "../providers/layout-provider";

import { ProfileAvatar } from "./profile-avatar";



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



const navLinkBase =

  "flex items-center gap-3 rounded-full px-4 py-2.5 text-[13px] font-medium no-underline transition-all duration-200";



export function DesktopSidebar() {

  const location = useLocation();

  const navigate = useNavigate();

  const { user } = useAuth();

  const { sidebarWidth } = useLayout();



  return (

    <aside

      className="fixed inset-y-0 left-0 z-40 flex flex-col border-r border-outline-variant/10 bg-surface/95 backdrop-blur-xl"

      style={{ width: sidebarWidth }}

      data-layout="desktop-sidebar"

    >

      <div className="px-5 pb-2 pt-7">

        <Link

          to="/brief"

          className="font-[family-name:var(--font-headline)] text-[1.5rem] italic leading-none tracking-tight text-on-surface no-underline"

        >

          The Curator

        </Link>

        <p className="mt-1.5 text-[10px] uppercase tracking-[0.24em] text-outline">Daily narratives</p>

      </div>



      <nav className="flex-1 space-y-0.5 overflow-y-auto px-3 pb-3 pt-2">

        {PRIMARY_NAV.map(({ path, label, Icon, fillable }) => {

          const active = isNavActive(location.pathname, path);

          return (

            <Link

              key={path}

              to={path}

              className={`${navLinkBase} ${

                active

                  ? "bg-secondary-container text-on-secondary-container shadow-sm"

                  : "text-on-surface-variant hover:bg-surface-container-low hover:text-on-surface"

              }`}

            >

              <Icon className="h-4 w-4 shrink-0" fill={active && fillable ? "currentColor" : "none"} strokeWidth={active ? 2.25 : 2} />

              {label}

            </Link>

          );

        })}



        <div className="my-4 border-t border-outline-variant/10" />



        {SECONDARY_NAV.map(({ path, label, Icon }) => {

          const active = isNavActive(location.pathname, path);

          return (

            <Link

              key={path}

              to={path}

              className={`${navLinkBase} ${

                active

                  ? "bg-surface-container text-on-surface"

                  : "text-on-surface-variant hover:bg-surface-container-low hover:text-on-surface"

              }`}

            >

              <Icon className="h-4 w-4 shrink-0" strokeWidth={active ? 2.25 : 2} />

              {label}

            </Link>

          );

        })}

      </nav>



      <div className="mt-auto shrink-0 border-t border-outline-variant/10 p-3">

        <Link

          to="/settings"

          className={`${navLinkBase} mb-1 text-on-surface-variant hover:bg-surface-container-low hover:text-on-surface`}

        >

          <Settings className="h-4 w-4" />

          Settings

        </Link>

        <button

          type="button"

          onClick={() => navigate("/account")}

          className="flex w-full items-center gap-3 rounded-full px-3 py-2.5 text-left transition-colors hover:bg-surface-container-low"

        >

          <ProfileAvatar

            avatarUrl={user?.profileImage}

            name={user?.name}

            email={user?.email}

            size={36}

          />

          <div className="min-w-0 flex-1">

            <p className="truncate text-[13px] font-medium text-on-surface">{user?.name ?? "Account"}</p>

            <p className="truncate text-[11px] text-outline">View profile</p>

          </div>

        </button>

      </div>

    </aside>

  );

}


