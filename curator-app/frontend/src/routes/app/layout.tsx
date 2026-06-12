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
    return <div className="min-h-screen bg-background" aria-busy="true" />;
  }

  return (
    <AppProviders>
      <Outlet />
    </AppProviders>
  );
}
