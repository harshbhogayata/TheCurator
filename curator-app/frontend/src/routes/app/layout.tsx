import { useEffect, useState } from "react";
import { Outlet } from "react-router";
import { AppProviders } from "../../app/AppProviders";

/**
 * Client-only gate for the authenticated app surface. The app's providers
 * (Firebase auth, audio, localStorage-backed contexts) are browser-dependent,
 * and these screens are private, so they intentionally skip server rendering.
 */
export default function AppLayout() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  if (!mounted) {
    return (
      <div className="curator-shell min-h-screen bg-surface-container-low mesh-gradient" aria-busy="true">
        <div
          className="mx-auto flex min-h-screen max-w-[680px] items-center justify-center px-6"
          data-layout="main-column"
        >
          <p className="font-[family-name:var(--font-headline)] text-lg italic text-on-surface-variant">Loading…</p>
        </div>
      </div>
    );
  }

  return (
    <AppProviders>
      <Outlet />
    </AppProviders>
  );
}
