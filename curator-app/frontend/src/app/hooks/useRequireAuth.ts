import { useEffect } from "react";
import { useNavigate } from "react-router";

import { useAuth } from "../context/AuthContext";
import { isDevBypassAuth } from "../../lib/dev-mode";

/** Redirect unauthenticated users to welcome — skipped in dev bypass mode. */
export function useRequireAuth() {
  const navigate = useNavigate();
  const { isAuthenticated, isLoading } = useAuth();

  useEffect(() => {
    if (isDevBypassAuth || isLoading) {
      return;
    }
    if (!isAuthenticated) {
      navigate("/welcome", { replace: true });
    }
  }, [isAuthenticated, isLoading, navigate]);

  return { isAuthenticated: isDevBypassAuth || isAuthenticated, isLoading };
}
