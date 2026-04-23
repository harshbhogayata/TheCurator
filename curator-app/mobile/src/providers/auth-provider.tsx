import {
  createContext,
  type PropsWithChildren,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  createUserWithEmailAndPassword,
  onIdTokenChanged,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  updateProfile,
  type User as FirebaseUser,
} from "firebase/auth";

import { defaultPreferences } from "../lib/types";
import type { AuthStatus, SessionPayload, UserPreferences } from "../lib/types";
import { apiRequest } from "../services/api-client";
import { deleteAccountRemote } from "../services/mobile-api";
import { firebaseConfigured, getFirebaseAuth } from "../services/firebase";
import { useTheme } from "./theme-provider";

// Set EXPO_PUBLIC_MOCK_BACKEND=true in .env to short-circuit auth locally.
// Defaults to false so production builds are safe without explicit opt-in.
const MOCK_BACKEND = process.env.EXPO_PUBLIC_MOCK_BACKEND === "true";

function buildMockSession(overrides?: Partial<SessionPayload>): SessionPayload {
  const now = new Date().toISOString();
  return {
    user: {
      id: "mock-user-id",
      email: "demo@curator.app",
      displayName: null,
      avatarUrl: null,
      memberSince: now,
    },
    onboarding: {
      currentStep: "account",
      isCompleted: false,
      completedAt: null,
      selectedCategories: [],
    },
    preferences: { ...defaultPreferences },
    identities: [{ provider: "email", providerEmail: "demo@curator.app", providerUid: null }],
    ...overrides,
  };
}

interface ProfileStepPayload {
  displayName: string;
}

interface CategoryStepPayload {
  categories: string[];
}

interface AuthContextValue {
  status: AuthStatus;
  session: SessionPayload | null;
  errorMessage: string | null;
  isBusy: boolean;
  refreshSession: () => Promise<void>;
  clearError: () => void;
  dismissSessionError: () => void;
  signInWithEmail: (email: string, password: string) => Promise<void>;
  signUpWithEmail: (input: {
    email: string;
    password: string;
    displayName?: string;
  }) => Promise<void>;
  requestPasswordReset: (email: string) => Promise<void>;
  updateProfileDetails: (payload: ProfileStepPayload) => Promise<void>;
  updateOnboardingProfile: (payload: ProfileStepPayload) => Promise<void>;
  updateOnboardingCategories: (payload: CategoryStepPayload) => Promise<void>;
  updateOnboardingPreferences: (payload: UserPreferences) => Promise<void>;
  completeOnboarding: () => Promise<void>;
  deleteAccount: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: PropsWithChildren) {
  const { hydratePreference } = useTheme();
  const [status, setStatus] = useState<AuthStatus>(
    MOCK_BACKEND ? "signed-out" : firebaseConfigured ? "loading" : "signed-out",
  );
  const [session, setSession] = useState<SessionPayload | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isBusy, setIsBusy] = useState(false);

  const clearError = useCallback(() => {
    setErrorMessage(null);
  }, []);

  const dismissSessionError = useCallback(() => {
    setErrorMessage(null);
    setStatus("signed-out");
    setSession(null);
  }, []);

  const applySession = useCallback(
    (payload: SessionPayload) => {
      setSession(payload);
      setStatus("signed-in");
      hydratePreference(payload.preferences.themePreference);
    },
    [hydratePreference],
  );

  const exchangeSession = useCallback(
    async (firebaseUser?: FirebaseUser | null) => {
      if (!firebaseConfigured) {
        setStatus("signed-out");
        setSession(null);
        return;
      }

      const auth = getFirebaseAuth();
      const activeUser = firebaseUser ?? auth.currentUser;

      if (!activeUser) {
        setStatus("signed-out");
        setSession(null);
        return;
      }

      const idToken = await activeUser.getIdToken();
      const payload = await apiRequest<SessionPayload>("/api/mobile/auth/session", {
        method: "POST",
        token: idToken,
      });

      applySession(payload);
    },
    [applySession],
  );

  const runBusy = useCallback(async (fn: () => Promise<void>) => {
    setIsBusy(true);
    setErrorMessage(null);

    try {
      await fn();
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Something went wrong. Please try again.";
      setErrorMessage(message);
      setStatus((current) => (current === "loading" ? "error" : current));
      throw error;
    } finally {
      setIsBusy(false);
    }
  }, []);

  const refreshSession = useCallback(async () => {
    setStatus("loading");
    await exchangeSession();
  }, [exchangeSession]);

  useEffect(() => {
    if (MOCK_BACKEND) {
      // No Firebase listener in mock mode — sign-in/out are driven manually.
      return;
    }

    if (!firebaseConfigured) {
      setStatus("signed-out");
      return;
    }

    const auth = getFirebaseAuth();

    const unsubscribe = onIdTokenChanged(auth, async (firebaseUser) => {
      try {
        if (!firebaseUser) {
          setSession(null);
          setStatus("signed-out");
          return;
        }

        setStatus("loading");
        await exchangeSession(firebaseUser);
      } catch (error) {
        setStatus("error");
        setErrorMessage(
          error instanceof Error
            ? error.message
            : "We couldn't restore your session.",
        );
      }
    });

    return unsubscribe;
  }, [exchangeSession]);

  const withToken = useCallback(
    async (path: string, method: "PATCH" | "POST", body?: unknown) => {
      const auth = getFirebaseAuth();
      const currentUser = auth.currentUser;

      if (!currentUser) {
        throw new Error("You need to be signed in to continue.");
      }

      const idToken = await currentUser.getIdToken();
      const payload = await apiRequest<SessionPayload>(path, {
        method,
        body,
        token: idToken,
      });

      applySession(payload);
    },
    [applySession],
  );

  const signInWithEmail = useCallback(
    async (email: string, password: string) =>
      runBusy(async () => {
        if (MOCK_BACKEND) {
          const mock = buildMockSession({
            user: {
              id: "mock-user-id",
              email,
              displayName: null,
              avatarUrl: null,
              memberSince: new Date().toISOString(),
            },
            onboarding: {
              currentStep: "complete",
              isCompleted: true,
              completedAt: new Date().toISOString(),
              selectedCategories: ["world", "technology", "culture"],
            },
          });
          applySession(mock);
          return;
        }
        const auth = getFirebaseAuth();
        const credential = await signInWithEmailAndPassword(auth, email, password);
        await exchangeSession(credential.user);
      }),
    [applySession, exchangeSession, runBusy],
  );

  const signUpWithEmail = useCallback(
    async ({
      email,
      password,
      displayName,
    }: {
      email: string;
      password: string;
      displayName?: string;
    }) =>
      runBusy(async () => {
        if (MOCK_BACKEND) {
          const mock = buildMockSession({
            user: {
              id: "mock-user-id",
              email,
              displayName: displayName?.trim() || null,
              avatarUrl: null,
              memberSince: new Date().toISOString(),
            },
          });
          applySession(mock);
          return;
        }
        const auth = getFirebaseAuth();
        const credential = await createUserWithEmailAndPassword(auth, email, password);

        if (displayName?.trim()) {
          await updateProfile(credential.user, { displayName: displayName.trim() });
        }

        await exchangeSession(credential.user);
      }),
    [applySession, exchangeSession, runBusy],
  );

  const requestPasswordReset = useCallback(
    async (email: string) =>
      runBusy(async () => {
        if (MOCK_BACKEND) {
          await new Promise((resolve) => setTimeout(resolve, 400));
          return;
        }
        const auth = getFirebaseAuth();
        await sendPasswordResetEmail(auth, email.trim());
      }),
    [runBusy],
  );

  const updateProfileDetails = useCallback(
    async (payload: ProfileStepPayload) =>
      runBusy(async () => {
        if (MOCK_BACKEND) {
          setSession((current) => {
            const base = current ?? buildMockSession();
            return {
              ...base,
              user: {
                ...base.user,
                displayName: payload.displayName.trim() || null,
              },
            };
          });
          return;
        }
        await withToken("/api/mobile/onboarding/profile", "PATCH", payload);
      }),
    [runBusy, withToken],
  );

  const updateOnboardingProfile = useCallback(
    async (payload: ProfileStepPayload) =>
      runBusy(async () => {
        if (MOCK_BACKEND) {
          setSession((current) => {
            const base = current ?? buildMockSession();
            return {
              ...base,
              user: { ...base.user, displayName: payload.displayName.trim() || null },
              onboarding: {
                ...base.onboarding,
                currentStep:
                  base.onboarding.isCompleted || base.onboarding.currentStep === "complete"
                    ? "complete"
                    : "categories",
              },
            };
          });
          return;
        }
        await withToken("/api/mobile/onboarding/profile", "PATCH", payload);
      }),
    [runBusy, withToken],
  );

  const updateOnboardingCategories = useCallback(
    async (payload: CategoryStepPayload) =>
      runBusy(async () => {
        if (MOCK_BACKEND) {
          setSession((current) => {
            const base = current ?? buildMockSession();
            return {
              ...base,
              onboarding: {
                ...base.onboarding,
                currentStep:
                  base.onboarding.isCompleted || base.onboarding.currentStep === "complete"
                    ? "complete"
                    : "appearance",
                selectedCategories: payload.categories,
              },
            };
          });
          return;
        }
        await withToken("/api/mobile/onboarding/categories", "PATCH", payload);
      }),
    [runBusy, withToken],
  );

  const updateOnboardingPreferences = useCallback(
    async (payload: UserPreferences) =>
      runBusy(async () => {
        if (MOCK_BACKEND) {
          setSession((current) => {
            const base = current ?? buildMockSession();
            const next: SessionPayload["onboarding"]["currentStep"] =
              base.onboarding.currentStep === "appearance"
                ? "notifications"
                : base.onboarding.currentStep === "notifications"
                ? "reading"
                : base.onboarding.currentStep;
            return {
              ...base,
              preferences: payload,
              onboarding: { ...base.onboarding, currentStep: next },
            };
          });
          return;
        }
        await withToken("/api/mobile/onboarding/preferences", "PATCH", payload);
      }),
    [runBusy, withToken],
  );

  const completeOnboarding = useCallback(
    async () =>
      runBusy(async () => {
        if (MOCK_BACKEND) {
          setSession((current) => {
            const base = current ?? buildMockSession();
            return {
              ...base,
              onboarding: {
                ...base.onboarding,
                currentStep: "complete",
                isCompleted: true,
                completedAt: new Date().toISOString(),
              },
            };
          });
          return;
        }
        await withToken("/api/mobile/onboarding/complete", "POST");
      }),
    [runBusy, withToken],
  );

  const signOut = useCallback(
    async () =>
      runBusy(async () => {
        if (MOCK_BACKEND) {
          setSession(null);
          setStatus("signed-out");
          return;
        }
        const auth = getFirebaseAuth();
        await firebaseSignOut(auth);
        setSession(null);
        setStatus("signed-out");
      }),
    [runBusy],
  );

  const deleteAccount = useCallback(
    async () =>
      runBusy(async () => {
        if (MOCK_BACKEND) {
          setSession(null);
          setStatus("signed-out");
          return;
        }

        await deleteAccountRemote();

        const auth = getFirebaseAuth();
        await firebaseSignOut(auth);
        setSession(null);
        setStatus("signed-out");
      }),
    [runBusy],
  );

  const value = useMemo<AuthContextValue>(
    () => ({
      status,
      session,
      errorMessage,
      isBusy,
      refreshSession,
      clearError,
      dismissSessionError,
      signInWithEmail,
      signUpWithEmail,
      requestPasswordReset,
      updateProfileDetails,
      updateOnboardingProfile,
      updateOnboardingCategories,
      updateOnboardingPreferences,
      completeOnboarding,
      deleteAccount,
      signOut,
    }),
    [
      clearError,
      completeOnboarding,
      dismissSessionError,
      errorMessage,
      isBusy,
      refreshSession,
      requestPasswordReset,
      session,
      signInWithEmail,
      signOut,
      signUpWithEmail,
      status,
      updateOnboardingCategories,
      updateOnboardingPreferences,
      updateProfileDetails,
      updateOnboardingProfile,
      deleteAccount,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }

  return context;
}
