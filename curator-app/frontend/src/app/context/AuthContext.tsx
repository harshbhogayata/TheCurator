import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
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

import type {
  NotificationPreference,
  ThemePreference,
  AuthUser,
  OnboardingState,
  AuthIdentity,
  AuthSessionResponse,
  IdentityProvider,
} from "../lib/authApi";
import { firebaseConfigured, getFirebaseAuth } from "../../services/firebase";
import { apiRequest } from "../../services/api-client";
import { resetQueryCache } from "../../lib/query-client";
import {
  defaultPreferences,
  onboardingStepToNumber,
  type SessionPayload,
  type UserPreferences,
} from "../../lib/types";
import { isDevBypassAuth, isMockBackend } from "../../lib/dev-mode";
import { getAuthErrorMessage } from "../../lib/auth-errors";
import { useTheme } from "./ThemeContext";

type AuthStatus = "loading" | "authenticated" | "unauthenticated";

interface ProviderAvailability {
  entra: boolean;
  google: boolean;
  apple: boolean;
}

interface AuthContextType {
  user: AuthUser | null;
  onboarding: OnboardingState | null;
  preferences: UserPreferences | null;
  identities: AuthIdentity[];
  providerAvailability: ProviderAvailability;
  authStatus: AuthStatus;
  isAuthenticated: boolean;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<AuthSessionResponse>;
  signUp: (name: string, email: string, password: string) => Promise<AuthSessionResponse>;
  exchangeEntraSession: (idToken: string, providerHint: IdentityProvider) => Promise<AuthSessionResponse>;
  linkIdentity: (idToken: string, providerHint: IdentityProvider) => Promise<OnboardingState>;
  saveOnboarding: (payload: {
    currentStep?: number;
    selectedCategories?: string[];
    themePreference?: ThemePreference;
    notificationPreference?: NotificationPreference;
    autoSaveEnabled?: boolean;
  }) => Promise<OnboardingState>;
  completeOnboarding: () => Promise<OnboardingState>;
  requestPasswordReset: (email: string) => Promise<{ previewUrl?: string }>;
  resetPassword: (token: string, password: string) => Promise<AuthSessionResponse>;
  signOut: () => void;
  updateProfile: (updates: Partial<AuthUser>) => void;
  updateSessionPreferences: (preferences: UserPreferences) => void;
}

const MOCK_BACKEND = isMockBackend;

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface ActiveExchange {
  uid: string;
  promise: Promise<SessionPayload>;
}

function buildMockSession(overrides?: Partial<SessionPayload>): SessionPayload {
  const now = new Date().toISOString();
  return {
    user: {
      id: "mock-user-id",
      email: "demo@curator.app",
      displayName: "Demo User",
      avatarUrl: null,
      firebaseUid: "mock-user-id",
      memberSince: now,
    },
    onboarding: {
      currentStep: "complete",
      isCompleted: true,
      completedAt: now,
      selectedCategories: ["economy", "technology", "culture"],
    },
    preferences: { ...defaultPreferences },
    identities: [{ provider: "email", providerEmail: "demo@curator.app", providerUid: null }],
    ...overrides,
  };
}

function mapSessionToAuthUser(session: SessionPayload): AuthUser {
  return {
    id: session.user.id,
    name: session.user.displayName ?? session.user.email.split("@")[0],
    email: session.user.email,
    profileImage: session.user.avatarUrl,
    memberSince: session.user.memberSince,
    themePreference: session.preferences.themePreference,
  };
}

function mapSessionToOnboarding(session: SessionPayload): OnboardingState {
  return {
    currentStep: onboardingStepToNumber(session.onboarding.currentStep),
    completed: session.onboarding.isCompleted,
    selectedCategories: session.onboarding.selectedCategories,
    themePreference: session.preferences.themePreference,
    notificationPreference: session.preferences.notificationFrequency,
    autoSaveEnabled: session.preferences.autoSaveEnabled,
  };
}

function mapSessionToIdentities(session: SessionPayload): AuthIdentity[] {
  return session.identities.map((identity) => ({
    provider: identity.provider,
    providerEmail: identity.providerEmail,
  }));
}

function buildAuthSessionResponse(session: SessionPayload): AuthSessionResponse {
  return {
    token: "",
    user: mapSessionToAuthUser(session),
    onboarding: mapSessionToOnboarding(session),
    identities: mapSessionToIdentities(session),
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const { setTheme } = useTheme();
  const [authStatus, setAuthStatus] = useState<AuthStatus>("loading");
  const [session, setSession] = useState<SessionPayload | null>(null);
  const activeExchangeRef = useRef<ActiveExchange | null>(null);

  const user = session ? mapSessionToAuthUser(session) : null;
  const onboarding = session ? mapSessionToOnboarding(session) : null;
  const preferences = session?.preferences ?? null;
  const identities = session ? mapSessionToIdentities(session) : [];
  const isAuthenticated = authStatus === "authenticated" && user !== null;
  const isLoading = authStatus === "loading";

  const providerAvailability: ProviderAvailability = {
    entra: false,
    google: false,
    apple: false,
  };

  const applySession = useCallback(
    (payload: SessionPayload) => {
      setSession(payload);
      setAuthStatus("authenticated");
      setTheme(payload.preferences.themePreference);
    },
    [setTheme],
  );

  const exchangeSession = useCallback(
    async (firebaseUser?: FirebaseUser | null) => {
      if (MOCK_BACKEND) {
        applySession(buildMockSession());
        return;
      }

      if (!firebaseConfigured) {
        setAuthStatus("unauthenticated");
        setSession(null);
        throw new Error("Firebase is not configured yet.");
      }

      const auth = getFirebaseAuth();
      const activeUser = firebaseUser ?? auth.currentUser;

      if (!activeUser) {
        setAuthStatus("unauthenticated");
        setSession(null);
        throw new Error("No active user session found.");
      }

      if (activeExchangeRef.current?.uid === activeUser.uid) {
        return activeExchangeRef.current.promise;
      }

      const promise = (async () => {
        try {
          const idToken = await activeUser.getIdToken();
          const payload = await apiRequest<SessionPayload>("/api/mobile/v1/auth/session", {
            method: "POST",
            token: idToken,
          });
          applySession(payload);
          return payload;
        } finally {
          if (activeExchangeRef.current?.uid === activeUser.uid) {
            activeExchangeRef.current = null;
          }
        }
      })();

      activeExchangeRef.current = { uid: activeUser.uid, promise };
      return promise;
    },
    [applySession],
  );

  const withToken = useCallback(
    async (path: string, method: "PATCH" | "POST", body?: unknown) => {
      const payload = await apiRequest<SessionPayload>(path, { method, body });
      applySession(payload);
      return payload;
    },
    [applySession],
  );

  useEffect(() => {
    if (MOCK_BACKEND || isDevBypassAuth) {
      applySession(buildMockSession());
      return;
    }

    if (!firebaseConfigured) {
      setAuthStatus("unauthenticated");
      return;
    }

    const auth = getFirebaseAuth();

    const unsubscribe = onIdTokenChanged(auth, async (firebaseUser) => {
      try {
        if (!firebaseUser) {
          resetQueryCache();
          setSession(null);
          setAuthStatus("unauthenticated");
          return;
        }

        setAuthStatus("loading");
        await exchangeSession(firebaseUser);
      } catch (error) {
        setSession(null);
        setAuthStatus("unauthenticated");
        if (import.meta.env.DEV) {
          console.warn(getAuthErrorMessage(error, "session"));
        }
      }
    });

    return unsubscribe;
  }, [applySession, exchangeSession]);

  const signIn = async (email: string, password: string) => {
    if (MOCK_BACKEND) {
      const mock = buildMockSession({
        user: {
          id: "mock-user-id",
          email,
          displayName: null,
          avatarUrl: null,
          firebaseUid: "mock-user-id",
          memberSince: new Date().toISOString(),
        },
      });
      applySession(mock);
      return buildAuthSessionResponse(mock);
    }

    try {
      const auth = getFirebaseAuth();
      const credential = await signInWithEmailAndPassword(auth, email.trim(), password);
      const payload = await exchangeSession(credential.user);
      return buildAuthSessionResponse(payload);
    } catch (error) {
      throw new Error(getAuthErrorMessage(error, "sign-in"), { cause: error });
    }
  };

  const signUp = async (name: string, email: string, password: string) => {
    if (MOCK_BACKEND) {
      const mock = buildMockSession({
        user: {
          id: "mock-user-id",
          email,
          displayName: name.trim() || null,
          avatarUrl: null,
          firebaseUid: "mock-user-id",
          memberSince: new Date().toISOString(),
        },
        onboarding: {
          currentStep: "categories",
          isCompleted: false,
          completedAt: null,
          selectedCategories: [],
        },
      });
      applySession(mock);
      return buildAuthSessionResponse(mock);
    }

    try {
      const auth = getFirebaseAuth();
      const credential = await createUserWithEmailAndPassword(auth, email.trim(), password);
      if (name.trim()) {
        await updateProfile(credential.user, { displayName: name.trim() });
        await credential.user.getIdToken(true);
      }
      const payload = await exchangeSession(credential.user);
      return buildAuthSessionResponse(payload);
    } catch (error) {
      throw new Error(getAuthErrorMessage(error, "sign-up"), { cause: error });
    }
  };

  const exchangeEntraSession = async (_idToken: string, _providerHint: IdentityProvider) => {
    throw new Error("External identity providers are not configured for the web app yet.");
  };

  const linkIdentity = async (_idToken: string, _providerHint: IdentityProvider) => {
    throw new Error("External identity providers are not configured for the web app yet.");
  };

  const saveOnboarding = async (payload: {
    currentStep?: number;
    selectedCategories?: string[];
    themePreference?: ThemePreference;
    notificationPreference?: NotificationPreference;
    autoSaveEnabled?: boolean;
  }) => {
    if (MOCK_BACKEND && session) {
      const next = {
        ...session,
        onboarding: {
          ...session.onboarding,
          selectedCategories: payload.selectedCategories ?? session.onboarding.selectedCategories,
          currentStep: "appearance" as const,
        },
        preferences: {
          ...session.preferences,
          themePreference: payload.themePreference ?? session.preferences.themePreference,
          notificationFrequency:
            payload.notificationPreference ?? session.preferences.notificationFrequency,
          autoSaveEnabled: payload.autoSaveEnabled ?? session.preferences.autoSaveEnabled,
        },
      };
      applySession(next);
      return mapSessionToOnboarding(next);
    }

    let latestSession = session;

    if (payload.selectedCategories) {
      latestSession = await withToken("/api/mobile/v1/onboarding/categories", "PATCH", {
        categories: payload.selectedCategories,
      });
    }

    const preferences: Partial<UserPreferences> = {};
    if (payload.themePreference) preferences.themePreference = payload.themePreference;
    if (payload.notificationPreference) {
      preferences.notificationFrequency = payload.notificationPreference;
    }
    if (payload.autoSaveEnabled !== undefined) {
      preferences.autoSaveEnabled = payload.autoSaveEnabled;
    }

    if (Object.keys(preferences).length > 0) {
      latestSession = await withToken(
        "/api/mobile/v1/onboarding/preferences",
        "PATCH",
        preferences,
      );
    }

    if (!latestSession) throw new Error("Session not available");
    return mapSessionToOnboarding(latestSession);
  };

  const completeOnboarding = async () => {
    if (MOCK_BACKEND && session) {
      const next = {
        ...session,
        onboarding: {
          ...session.onboarding,
          currentStep: "complete" as const,
          isCompleted: true,
          completedAt: new Date().toISOString(),
        },
      };
      applySession(next);
      return mapSessionToOnboarding(next);
    }

    const updated = await withToken("/api/mobile/v1/onboarding/complete", "POST");
    return mapSessionToOnboarding(updated);
  };

  const requestPasswordReset = async (email: string) => {
    if (MOCK_BACKEND) {
      return {};
    }
    try {
      const auth = getFirebaseAuth();
      await sendPasswordResetEmail(auth, email.trim());
      return {};
    } catch (error) {
      throw new Error(getAuthErrorMessage(error, "password-reset"), { cause: error });
    }
  };

  const resetPassword = async (_token: string, _password: string) => {
    throw new Error("Use the password reset link from your email.");
  };

  const signOut = () => {
    resetQueryCache();
    if (MOCK_BACKEND) {
      setSession(null);
      setAuthStatus("unauthenticated");
      return;
    }
    if (firebaseConfigured) {
      void firebaseSignOut(getFirebaseAuth());
    }
    setSession(null);
    setAuthStatus("unauthenticated");
  };

  const updateProfileLocal = (updates: Partial<AuthUser>) => {
    if (!session) return;
    applySession({
      ...session,
      user: {
        ...session.user,
        displayName: updates.name ?? session.user.displayName,
        avatarUrl: updates.profileImage ?? session.user.avatarUrl,
      },
    });
  };

  const updateSessionPreferences = useCallback(
    (nextPreferences: UserPreferences) => {
      if (!session) return;
      applySession({ ...session, preferences: nextPreferences });
    },
    [session, applySession],
  );

  const value = useMemo(
    () => ({
      user,
      onboarding,
      preferences,
      identities,
      providerAvailability,
      authStatus,
      isAuthenticated,
      isLoading,
      signIn,
      signUp,
      exchangeEntraSession,
      linkIdentity,
      saveOnboarding,
      completeOnboarding,
      requestPasswordReset,
      resetPassword,
      signOut,
      updateProfile: updateProfileLocal,
      updateSessionPreferences,
    }),
    [user, onboarding, preferences, identities, authStatus, isAuthenticated, isLoading],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
