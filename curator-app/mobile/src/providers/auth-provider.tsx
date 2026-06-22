import {
  createContext,
  type PropsWithChildren,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  useRef,
} from "react";
import {
  createUserWithEmailAndPassword,
  onIdTokenChanged,
  sendEmailVerification,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  updateProfile,
  type User as FirebaseUser,
} from "firebase/auth";

import { defaultPreferences } from "../lib/types";
import type { AuthStatus, SessionPayload, UserPreferences } from "../lib/types";
import { useUIStore } from "../lib/store";
import { apiRequest } from "../services/api-client";
import { uploadProfileAvatarImage } from "../services/avatar-upload";
import { deleteAccountRemote, updateAccount } from "../services/mobile-api";
import { firebaseConfigured, getFirebaseAuth } from "../services/firebase";
import { AUTH_API_PREFIX } from "../lib/api-routes";
import { resetQueryCache } from "../lib/query-client";
import { buildEmailVerificationSettings } from "../lib/firebase-email-verification";
import { useTheme } from "./theme-provider";
import { getAuthErrorMessage } from "../lib/auth-errors";

// Set EXPO_PUBLIC_MOCK_BACKEND=true in .env to short-circuit auth locally.
// Defaults to false so production builds are safe without explicit opt-in.
const MOCK_BACKEND = __DEV__ && process.env.EXPO_PUBLIC_MOCK_BACKEND === "true";

function buildMockSession(overrides?: Partial<SessionPayload>): SessionPayload {
  const now = new Date().toISOString();
  return {
    user: {
      id: "mock-user-id",
      email: "demo@curator.app",
      displayName: null,
      avatarUrl: null,
      firebaseUid: "mock-user-id",
      memberSince: now,
      emailVerified: true,
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
  isBusy: boolean;
  errorMessage: string | null;
  refreshSession: () => Promise<void>;
  dismissSessionError: () => void;
  clearError: () => void;
  updateSessionPreferences: (preferences: UserPreferences) => void;
  signInWithEmail: (email: string, password: string) => Promise<void>;
  signUpWithEmail: (input: {
    email: string;
    password: string;
    displayName?: string;
  }) => Promise<void>;
  requestPasswordReset: (email: string) => Promise<void>;
  resendVerificationEmail: () => Promise<void>;
  updateProfileDetails: (payload: ProfileStepPayload) => Promise<void>;
  updateProfileAvatar: (avatarUrl: string) => Promise<void>;
  updateOnboardingProfile: (payload: ProfileStepPayload) => Promise<void>;
  updateOnboardingCategories: (payload: CategoryStepPayload) => Promise<void>;
  updateOnboardingPreferences: (
    payload: UserPreferences,
    options?: { skipNotifications?: boolean },
  ) => Promise<void>;
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
  const activeExchangePromiseRef = useRef<Promise<void> | null>(null);
  const activeUserIdRef = useRef<string | null>(null);

  const { runBusy, setError, clearError, isBusy, globalError } = useUIStore();

  const dismissSessionError = useCallback(() => {
    clearError();
    activeUserIdRef.current = null;
    void resetQueryCache();
    setStatus("signed-out");
    setSession(null);
  }, [clearError]);

  const applySession = useCallback(
    (payload: SessionPayload) => {
      if (activeUserIdRef.current && activeUserIdRef.current !== payload.user.id) {
        void resetQueryCache();
      }
      activeUserIdRef.current = payload.user.id;
      setSession(payload);
      setStatus("signed-in");
      hydratePreference(payload.preferences.themePreference);
    },
    [hydratePreference],
  );

  const updateSessionPreferences = useCallback(
    (preferences: UserPreferences) => {
      setSession((current) =>
        current ? { ...current, preferences } : current,
      );
      hydratePreference(preferences.themePreference);
    },
    [hydratePreference],
  );

  const exchangeSession = useCallback(
    async (firebaseUser?: FirebaseUser | null) => {
      if (!firebaseConfigured) {
        setStatus("signed-out");
        setSession(null);
        throw new Error("Firebase is not configured yet.");
      }

      const auth = getFirebaseAuth();
      const activeUser = firebaseUser ?? auth.currentUser;

      if (!activeUser) {
        setStatus("signed-out");
        setSession(null);
        throw new Error("No active user session found. Please sign in again.");
      }

      if (activeExchangePromiseRef.current) {
        return activeExchangePromiseRef.current;
      }

      const promise = (async () => {
        try {
          await activeUser.reload();
          const idToken = await activeUser.getIdToken();
          const payload = await apiRequest<SessionPayload>(`${AUTH_API_PREFIX}/auth/session`, {
            method: "POST",
            token: idToken,
          });
          applySession({
            ...payload,
            user: {
              ...payload.user,
              emailVerified: payload.user.emailVerified ?? activeUser.emailVerified,
            },
          });
        } finally {
          activeExchangePromiseRef.current = null;
        }
      })();

      activeExchangePromiseRef.current = promise;
      return promise;
    },
    [applySession],
  );

  const refreshSession = useCallback(async () => {
    setStatus("loading");
    try {
      await exchangeSession();
    } catch (error) {
      setStatus("error");
      setError(
        error instanceof Error
          ? error.message
          : "We couldn't refresh your session. Please try again.",
      );
    }
  }, [exchangeSession, setError]);

  useEffect(() => {
    if (MOCK_BACKEND) {
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
          activeUserIdRef.current = null;
          void resetQueryCache();
          setSession(null);
          setStatus("signed-out");
          return;
        }

        setStatus("loading");
        await exchangeSession(firebaseUser);
      } catch (error) {
        setStatus("error");
        setError(
          error instanceof Error
            ? error.message
            : "We couldn't restore your session.",
        );
      }
    });

    return unsubscribe;
  }, [exchangeSession, setError]);

  const withToken = useCallback(
    async (path: string, method: "PATCH" | "POST", body?: unknown) => {
      const auth = getFirebaseAuth();
      const currentUser = auth.currentUser;

      if (!currentUser) {
        throw new Error("You need to be signed in to continue.");
      }

      const payload = await apiRequest<SessionPayload>(path, {
        method,
        body,
      });

      applySession(payload);
    },
    [applySession],
  );

  const deliverVerificationEmail = useCallback(async () => {
    const auth = getFirebaseAuth();
    const currentUser = auth.currentUser;
    if (!currentUser) {
      throw new Error("You need to be signed in to resend the verification email.");
    }
    if (currentUser.emailVerified) {
      return;
    }

    try {
      await apiRequest<void>(`${AUTH_API_PREFIX}/auth/verification-email`, {
        method: "POST",
      });
    } catch {
      await sendEmailVerification(currentUser, buildEmailVerificationSettings());
    }
  }, []);

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
              firebaseUid: "mock-user-id",
              memberSince: new Date().toISOString(),
              emailVerified: true,
            },
            onboarding: {
              currentStep: "complete",
              isCompleted: true,
              completedAt: new Date().toISOString(),
              selectedCategories: ["economy", "technology", "culture"],
            },
          });
          applySession(mock);
          return;
        }
        try {
          const auth = getFirebaseAuth();
          const credential = await signInWithEmailAndPassword(auth, email.trim(), password);
          await exchangeSession(credential.user);
        } catch (error) {
          throw new Error(getAuthErrorMessage(error, "sign-in"), { cause: error });
        }
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
              firebaseUid: "mock-user-id",
              memberSince: new Date().toISOString(),
              emailVerified: false,
            },
          });
          applySession(mock);
          return;
        }
        try {
          const auth = getFirebaseAuth();
          const credential = await createUserWithEmailAndPassword(auth, email.trim(), password);

          if (displayName?.trim()) {
            await updateProfile(credential.user, { displayName: displayName.trim() });
            await credential.user.getIdToken(true);
          }

          if (!credential.user.emailVerified) {
            await exchangeSession(credential.user);
            await deliverVerificationEmail();
            return;
          }

          await exchangeSession(credential.user);
        } catch (error) {
          throw new Error(getAuthErrorMessage(error, "sign-up"), { cause: error });
        }
      }),
    [applySession, deliverVerificationEmail, exchangeSession, runBusy],
  );

  const requestPasswordReset = useCallback(
    async (email: string) =>
      runBusy(async () => {
        if (MOCK_BACKEND) {
          await new Promise((resolve) => setTimeout(resolve, 400));
          return;
        }
        try {
          const auth = getFirebaseAuth();
          await sendPasswordResetEmail(auth, email.trim());
        } catch (error) {
          throw new Error(getAuthErrorMessage(error, "password-reset"), { cause: error });
        }
      }),
    [runBusy],
  );

  const resendVerificationEmail = useCallback(
    async () =>
      runBusy(async () => {
        if (MOCK_BACKEND) {
          await new Promise((resolve) => setTimeout(resolve, 400));
          return;
        }
        try {
          await deliverVerificationEmail();
        } catch (error) {
          throw new Error(getAuthErrorMessage(error, "sign-up"), { cause: error });
        }
      }),
    [deliverVerificationEmail, runBusy],
  );

  const updateProfileCore = useCallback(
    async (payload: ProfileStepPayload) => {
      await withToken(`${AUTH_API_PREFIX}/onboarding/profile`, "PATCH", payload);
      const auth = getFirebaseAuth();
      if (auth.currentUser) {
        await updateProfile(auth.currentUser, { displayName: payload.displayName.trim() });
      }
    },
    [withToken],
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
            emailVerified: base.user.emailVerified ?? true,
          },
            };
          });
          return;
        }
        await updateProfileCore(payload);
      }),
    [runBusy, updateProfileCore],
  );

  const updateProfileAvatar = useCallback(
    async (localUri: string) =>
      runBusy(async () => {
        if (MOCK_BACKEND) {
          setSession((current) => {
            const base = current ?? buildMockSession();
            return {
              ...base,
              user: {
                ...base.user,
                avatarUrl: localUri,
              },
            };
          });
          return;
        }

        const auth = getFirebaseAuth();
        const currentUser = auth.currentUser;

        if (!currentUser) {
          throw new Error("You need to be signed in to update your profile photo.");
        }

        const remoteUrl = await uploadProfileAvatarImage(localUri);

        await updateProfile(currentUser, { photoURL: remoteUrl });
        await currentUser.getIdToken(true);

        const payload = await updateAccount({ avatarUrl: remoteUrl });
        applySession(payload);
      }),
    [applySession, runBusy],
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
        await updateProfileCore(payload);
      }),
    [runBusy, updateProfileCore],
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
        await withToken(`${AUTH_API_PREFIX}/onboarding/categories`, "PATCH", payload);
      }),
    [runBusy, withToken],
  );

  const updateOnboardingPreferences = useCallback(
    async (payload: UserPreferences, options?: { skipNotifications?: boolean }) =>
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
        const body = options?.skipNotifications
          ? { ...payload, skipNotifications: true }
          : payload;
        await withToken(`${AUTH_API_PREFIX}/onboarding/preferences`, "PATCH", body);
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
        await withToken(`${AUTH_API_PREFIX}/onboarding/complete`, "POST");
      }),
    [runBusy, withToken],
  );

  const signOut = useCallback(
    async () =>
      runBusy(async () => {
        await resetQueryCache();
        if (MOCK_BACKEND) {
          activeUserIdRef.current = null;
          setSession(null);
          setStatus("signed-out");
          return;
        }
        const auth = getFirebaseAuth();
        await firebaseSignOut(auth);
        activeUserIdRef.current = null;
        setSession(null);
        setStatus("signed-out");
      }),
    [runBusy],
  );

  const deleteAccount = useCallback(
    async () =>
      runBusy(async () => {
        if (MOCK_BACKEND) {
          await resetQueryCache();
          activeUserIdRef.current = null;
          setSession(null);
          setStatus("signed-out");
          return;
        }

        await deleteAccountRemote();
        await resetQueryCache();

        const auth = getFirebaseAuth();
        await firebaseSignOut(auth);
        activeUserIdRef.current = null;
        setSession(null);
        setStatus("signed-out");
      }),
    [runBusy],
  );

  const value = useMemo<AuthContextValue>(
    () => ({
      status,
      session,
      isBusy,
      errorMessage: globalError,
      refreshSession,
      dismissSessionError,
      clearError,
      updateSessionPreferences,
      signInWithEmail,
      signUpWithEmail,
      requestPasswordReset,
      resendVerificationEmail,
      updateProfileDetails,
      updateProfileAvatar,
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
      globalError,
      isBusy,
      refreshSession,
      requestPasswordReset,
      resendVerificationEmail,
      session,
      signInWithEmail,
      signOut,
      signUpWithEmail,
      status,
      updateOnboardingCategories,
      updateOnboardingPreferences,
      updateProfileDetails,
      updateOnboardingProfile,
      updateSessionPreferences,
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
