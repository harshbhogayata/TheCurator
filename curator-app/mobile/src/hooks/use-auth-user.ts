import { useAuth } from "../providers/auth-provider";

/** User-scoped data should key off this, not raw auth status (loading wipes state). */
export function useAuthUserId(): string | null {
  const { session } = useAuth();
  return session?.user?.id ?? null;
}

export function useCanSyncUserData(): boolean {
  const { session, status } = useAuth();
  return Boolean(session?.user?.id) && status !== "signed-out";
}
