import { index, layout, route, type RouteConfig } from "@react-router/dev/routes";

export default [
  // Root → /welcome (full web app entry; legal pages stay public below).
  index("routes/public/home.tsx"),

  // Public, server-rendered website (SEO surface).
  layout("routes/public/layout.tsx", [
    route("category/:slug", "routes/public/category.tsx"),
    route("briefs", "routes/public/briefs.tsx"),
  ]),
  // Hybrid article route: slugs render the SSR public article;
  // UUIDs render the full in-app reader for signed-in users.
  route("article/:slugOrId", "routes/article.tsx"),

  // Store/legal pages (own chrome, SSR-safe).
  route("privacy", "routes/public/privacy.tsx"),
  route("terms", "routes/public/terms.tsx"),
  route("support", "routes/public/support.tsx"),
  route("account-deletion", "routes/public/account-deletion.tsx"),
  route("verify-email", "routes/public/verify-email.tsx"),
  route("reset-password", "routes/public/reset-password.tsx"),

  // SEO resource routes.
  route("sitemap.xml", "routes/seo/sitemap.ts"),
  route("news-sitemap.xml", "routes/seo/news-sitemap.ts"),
  route("rss.xml", "routes/seo/rss.ts"),
  route("robots.txt", "routes/seo/robots.ts"),

  // Authenticated app (client-rendered behind providers).
  layout("routes/app/layout.tsx", [
    route("welcome", "routes/app/welcome.tsx"),
    route("sign-in", "routes/app/sign-in.tsx"),
    route("sign-up", "routes/app/sign-up.tsx"),
    route("onboarding", "routes/app/onboarding.tsx"),
    route("forgot-password", "routes/app/forgot-password.tsx"),
    route("auth/callback", "routes/app/auth-callback.tsx"),
    route("home", "routes/app/home.tsx"),
    route("brief", "routes/app/brief.tsx"),
    route("explore", "routes/app/explore.tsx"),
    route("saved", "routes/app/saved.tsx"),
    route("search", "routes/app/search.tsx"),
    route("reading-stats", "routes/app/reading-stats.tsx"),
    route("settings", "routes/app/settings.tsx"),
    route("account", "routes/app/account.tsx"),
    route("menu", "routes/app/menu.tsx"),
    route("profile", "routes/app/profile.tsx"),
    route("donate", "routes/app/donate.tsx"),
    route("about", "routes/app/about.tsx"),
    route("help", "routes/app/help.tsx"),
    route("collections", "routes/app/collections.tsx"),
    route("collection/:id", "routes/app/collection-detail.tsx"),
    route("language-region", "routes/app/language-region.tsx"),
    route("connected-accounts", "routes/app/connected-accounts.tsx"),
    route("data-export", "routes/app/data-export.tsx"),
  ]),

  route("*", "routes/not-found.tsx"),
] satisfies RouteConfig;
