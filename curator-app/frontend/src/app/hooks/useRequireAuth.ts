import { useEffect } from "react";
import { useNavigate } from "react-router";

import { useAuth } from "../context/AuthContext";
import { isDevBypassAuth } from "../../lib/dev-mode";

interface RequireAuthOptions {
  /** When true (default), incomplete onboarding redirects to /onboarding. */
  requireOnboarding?: boolean;
}

/** Redirect unauthenticated users to welcome; incomplete onboarding to /onboarding. */
export function useRequireAuth(options: RequireAuthOptions = {}) {
  const { requireOnboarding = true } = options;
  const navigate = useNavigate();
  const { isAuthenticated, isLoading, onboarding, authStatus } = useAuth();
  const onboardingComplete = onboarding?.completed ?? false;

  useEffect(() => {
    if (isDevBypassAuth || authStatus === "loading" || isLoading) {
      return;
    }
    if (!isAuthenticated) {
      navigate("/welcome", { replace: true });
      return;
    }
    if (requireOnboarding && !onboardingComplete) {
      navigate("/onboarding", { replace: true });
    }
  }, [
    authStatus,
    isAuthenticated,
    isLoading,
    navigate,
    onboardingComplete,
    requireOnboarding,
  ]);

  const ready =
    isDevBypassAuth ||
    (authStatus === "authenticated" &&
      isAuthenticated &&
      (!requireOnboarding || onboarding?.completed));

  return {
    isAuthenticated: isDevBypassAuth || isAuthenticated,
    isLoading: authStatus === "loading" || isLoading,
    isReady: ready,
  };
}
