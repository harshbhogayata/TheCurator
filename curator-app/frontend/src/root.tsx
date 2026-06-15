import type { ReactNode } from "react";
import {
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  isRouteErrorResponse,
  useRouteError,
} from "react-router";

import "./styles/index.css";

const THEME_BOOTSTRAP = `
(function () {
  try {
    var theme = localStorage.getItem("curator_theme") || localStorage.getItem("curator_theme_preference") || localStorage.getItem("curator-theme") || "system";
    var dark = theme === "dark" || (theme === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches);
    document.documentElement.classList.toggle("dark", dark);
  } catch (e) {}
})();
`;

const SERVICE_WORKER_CLEANUP = `
(function () {
  var host = location.hostname;
  if (host !== "localhost" && host !== "127.0.0.1") return;
  if (!("serviceWorker" in navigator)) return;
  navigator.serviceWorker.getRegistrations().then(function (regs) {
    regs.forEach(function (r) { r.unregister(); });
  }).catch(function () {});
})();
`;

export function Layout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
        <link rel="manifest" href="/manifest.webmanifest" />
        <meta name="theme-color" content="#fbf9f3" />
        <Meta />
        <Links />
        <script dangerouslySetInnerHTML={{ __html: THEME_BOOTSTRAP }} />
        <script dangerouslySetInnerHTML={{ __html: SERVICE_WORKER_CLEANUP }} />
      </head>
      <body>
        {children}
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}

export function meta() {
  return [
    { title: "The Curator - A calmer way to read the news" },
    {
      name: "description",
      content:
        "Daily news briefings and source-backed articles you can read or hear. Synthesized from trusted reporting, in one calm place.",
    },
    { property: "og:title", content: "The Curator" },
    {
      property: "og:description",
      content:
        "A calmer way to read the news. Briefings and source-backed articles, read or heard.",
    },
    { property: "og:type", content: "website" },
  ];
}

export default function Root() {
  return <Outlet />;
}

export function ErrorBoundary() {
  const error = useRouteError();
  const is404 = isRouteErrorResponse(error) && error.status === 404;

  return (
    <main className="min-h-screen bg-background text-foreground flex flex-col items-center justify-center gap-4 px-6 text-center">
      <p
        className="text-6xl"
        style={{ fontFamily: "var(--font-headline)" }}
      >
        {is404 ? "404" : "Something went wrong"}
      </p>
      <p className="text-on-surface-variant max-w-md">
        {is404
          ? "The page you are looking for has moved or never existed."
          : "An unexpected error occurred. Please try again."}
      </p>
      <a
        href="/"
        className="mt-2 rounded-full bg-primary px-6 py-2.5 text-primary-foreground text-sm font-medium"
      >
        Back to the front page
      </a>
    </main>
  );
}
