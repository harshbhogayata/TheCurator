import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import {
  authApi,
  type AuthIdentity,
  type IdentityProvider,
  type AuthSessionResponse,
  type AuthUser,
  type NotificationPreference,
  type OnboardingState,
  type ThemePreference,
} from "../lib/authApi";
import { logoutEntraIfPossible } from "../lib/entraAuth";
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
  identities: AuthIdentity[];
  providerAvailability: ProviderAvailability;
  authStatus: AuthStatus;
  isAuthenticated: boolean;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<AuthSessionResponse>;
  signUp: (name: string, email: string, password: string) => Promise<AuthSessionResponse>;
  exchangeEntraSession: (
    idToken: string,
    providerHint: IdentityProvider,
  ) => Promise<AuthSessionResponse>;
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
}

const TOKEN_KEY = "curator_token";

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const { setTheme } = useTheme();
  const [authStatus, setAuthStatus] = useState<AuthStatus>("loading");
  const [user, setUser] = useState<AuthUser | null>(null);
  const [onboarding, setOnboarding] = useState<OnboardingState | null>(null);
  const [identities, setIdentities] = useState<AuthIdentity[]>([]);
  const [providerAvailability, setProviderAvailability] = useState<ProviderAvailability>({
    entra: false,
    google: false,
    apple: false,
  });

  const isAuthenticated = authStatus === "authenticated" && user !== null;
  const isLoading = authStatus === "loading";

  const clearSession = () => {
    localStorage.removeItem(TOKEN_KEY);
    setUser(null);
    setOnboarding(null);
    setIdentities([]);
    setAuthStatus("unauthenticated");
  };

  const applySession = (
    session: {
      user: AuthUser;
      onboarding: OnboardingState;
      identities: AuthIdentity[];
    },
    token?: string,
  ) => {
    if (token) {
      localStorage.setItem(TOKEN_KEY, token);
    }

    setUser(session.user);
    setOnboarding(session.onboarding);
    setIdentities(session.identities);
    setTheme(session.onboarding.themePreference);
    setAuthStatus("authenticated");
  };

  useEffect(() => {
    let isMounted = true;

    const initAuth = async () => {
      try {
        const providerResponse = await authApi.getProviderAvailability();
        if (isMounted) {
          setProviderAvailability(providerResponse.providers);
        }
      } catch {
        if (isMounted) {
          setProviderAvailability({ entra: false, google: false, apple: false });
        }
      }

      const token = localStorage.getItem(TOKEN_KEY);
      if (!token) {
        if (isMounted) {
          setAuthStatus("unauthenticated");
        }
        return;
      }

      try {
        const session = await authApi.getSession(token);
        if (!isMounted) {
          return;
        }

        applySession(session);
      } catch {
        if (isMounted) {
          clearSession();
        }
      }
    };

    void initAuth();

    return () => {
      isMounted = false;
    };
  }, [setTheme]);

  const signIn = async (email: string, password: string) => {
    const session = await authApi.signIn(email, password);
    applySession(session, session.token);
    return session;
  };

  const signUp = async (name: string, email: string, password: string) => {
    const session = await authApi.signUp(name, email, password);
    applySession(session, session.token);
    return session;
  };

  const exchangeEntraSession = async (idToken: string, providerHint: IdentityProvider) => {
    const session = await authApi.exchangeEntraSession(idToken, providerHint);
    applySession(session, session.token);
    return session;
  };

  const linkIdentity = async (idToken: string, providerHint: IdentityProvider) => {
    const token = localStorage.getItem(TOKEN_KEY);
    if (!token) {
      throw new Error("You need to be signed in to connect another account.");
    }

    const session = await authApi.linkIdentity(token, idToken, providerHint);
    applySession(session);
    return session.onboarding;
  };

  const saveOnboarding = async (payload: {
    currentStep?: number;
    selectedCategories?: string[];
    themePreference?: ThemePreference;
    notificationPreference?: NotificationPreference;
    autoSaveEnabled?: boolean;
  }) => {
    const token = localStorage.getItem(TOKEN_KEY);
    if (!token) {
      throw new Error("You need to be signed in to save onboarding");
    }

    const response = await authApi.saveOnboarding(token, payload);

    setUser((current) => (current ? { ...current, ...response.user } : response.user));
    setOnboarding(response.onboarding);

    if (payload.themePreference) {
      setTheme(payload.themePreference);
    }

    return response.onboarding;
  };

  const completeOnboarding = async () => {
    const token = localStorage.getItem(TOKEN_KEY);
    if (!token) {
      throw new Error("You need to be signed in to finish onboarding");
    }

    const response = await authApi.completeOnboarding(token);
    applySession(response);
    return response.onboarding;
  };

  const requestPasswordReset = async (email: string) => {
    const response = await authApi.requestPasswordReset(email);
    return {
      previewUrl: response.previewUrl,
    };
  };

  const resetPassword = async (token: string, password: string) => {
    const session = await authApi.resetPassword(token, password);
    applySession(session, session.token);
    return session;
  };

  const signOut = () => {
    clearSession();
    localStorage.removeItem("curator_subscription");
    localStorage.removeItem("curator_saved_articles");
    logoutEntraIfPossible().catch((err: unknown) => {
      console.error('[auth] Entra logout failed:', err);
    });
  };

  const updateProfile = (updates: Partial<AuthUser>) => {
    setUser((current) => (current ? { ...current, ...updates } : current));
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        onboarding,
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
        updateProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
