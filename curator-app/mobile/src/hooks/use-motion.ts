import { useAuth } from "../providers/auth-provider";

export function useReduceMotion(): boolean {
  const { session } = useAuth();
  return session?.preferences.reduceMotionEnabled ?? false;
}
