import { createBrowserRouter } from "react-router";
import { Welcome } from "./pages/Welcome";
import { SignIn } from "./pages/SignIn";
import { Onboarding } from "./pages/Onboarding";
import { ForgotPassword } from "./pages/ForgotPassword";
import { ResetPassword } from "./pages/ResetPassword";
import { AuthCallback } from "./pages/AuthCallback";
import { Home } from "./pages/Home";
import { Profile } from "./pages/Profile";
import { Brief } from "./pages/Brief";
import { Explore } from "./pages/Explore";
import { Saved } from "./pages/Saved";
import { Settings } from "./pages/Settings";
import { Account } from "./pages/Account";
import { Menu } from "./pages/Menu";
import { Article } from "./pages/Article";
import { Donate } from "./pages/Donate";
import { About } from "./pages/About";
import { Privacy } from "./pages/Privacy";
import { Help } from "./pages/Help";
import { Collections } from "./pages/Collections";
import { CollectionDetail } from "./pages/CollectionDetail";
import { LanguageRegion } from "./pages/LanguageRegion";
import { ConnectedAccounts } from "./pages/ConnectedAccounts";
import { SearchPage } from "./pages/SearchPage";
import { ReadingStats } from "./pages/ReadingStats";
import { NotFound } from "./pages/NotFound";

export const router = createBrowserRouter([
  {
    path: "/",
    Component: Welcome,
  },
  {
    path: "/sign-in",
    Component: SignIn,
  },
  {
    path: "/sign-up",
    Component: Onboarding,
  },
  {
    path: "/onboarding",
    Component: Onboarding,
  },
  {
    path: "/forgot-password",
    Component: ForgotPassword,
  },
  {
    path: "/reset-password",
    Component: ResetPassword,
  },
  {
    path: "/auth/callback",
    Component: AuthCallback,
  },
  {
    path: "/home",
    Component: Home,
  },
  {
    path: "/brief",
    Component: Brief,
  },
  {
    path: "/explore",
    Component: Explore,
  },
  {
    path: "/saved",
    Component: Saved,
  },
  {
    path: "/search",
    Component: SearchPage,
  },
  {
    path: "/reading-stats",
    Component: ReadingStats,
  },
  {
    path: "/settings",
    Component: Settings,
  },
  {
    path: "/account",
    Component: Account,
  },
  {
    path: "/menu",
    Component: Menu,
  },
  {
    path: "/profile",
    Component: Profile,
  },
  {
    path: "/article/:id",
    Component: Article,
  },
  {
    path: "/donate",
    Component: Donate,
  },
  {
    path: "/about",
    Component: About,
  },
  {
    path: "/privacy",
    Component: Privacy,
  },
  {
    path: "/help",
    Component: Help,
  },
  {
    path: "/collections",
    Component: Collections,
  },
  {
    path: "/collection/:id",
    Component: CollectionDetail,
  },
  {
    path: "/language-region",
    Component: LanguageRegion,
  },
  {
    path: "/connected-accounts",
    Component: ConnectedAccounts,
  },
  {
    path: "*",
    Component: NotFound,
  },
]);
