export type ThemePreference = "light" | "dark" | "system";
export type NotificationPreference = "daily" | "breaking" | "weekly" | "none";
export type IdentityProvider = "entra" | "google" | "apple";

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  profileImage: string | null;
  memberSince: string;
  themePreference: ThemePreference;
}

export interface OnboardingState {
  currentStep: number;
  completed: boolean;
  selectedCategories: string[];
  themePreference: ThemePreference;
  notificationPreference: NotificationPreference;
  autoSaveEnabled: boolean;
}

export interface AuthIdentity {
  provider: string;
  providerEmail: string | null;
}

export interface AuthSessionResponse {
  token: string;
  user: AuthUser;
  onboarding: OnboardingState;
  identities: AuthIdentity[];
}

export interface SessionStateResponse {
  user: AuthUser;
  onboarding: OnboardingState;
  identities: AuthIdentity[];
}

export interface ProviderAvailabilityResponse {
  providers: {
    entra: boolean;
    google: boolean;
    apple: boolean;
  };
}

export interface ForgotPasswordResponse {
  message: string;
  previewUrl?: string;
}

class ApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || "").replace(/\/$/, "");

function buildApiUrl(path: string) {
  return API_BASE_URL ? `${API_BASE_URL}${path}` : path;
}

async function apiRequest<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(buildApiUrl(path), {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers || {}),
    },
  });

  const text = await response.text();
  const data = text ? (JSON.parse(text) as Record<string, unknown>) : {};

  if (!response.ok) {
    throw new ApiError(
      typeof data.error === "string" ? data.error : "Request failed",
      response.status,
    );
  }

  return data as T;
}

function authHeaders(token: string) {
  return {
    Authorization: `Bearer ${token}`,
  };
}

export { ApiError };

export const authApi = {
  getProviderAvailability() {
    return apiRequest<ProviderAvailabilityResponse>("/api/auth/providers");
  },

  exchangeEntraSession(idToken: string, providerHint: IdentityProvider) {
    return apiRequest<AuthSessionResponse>("/api/auth/entra/session", {
      method: "POST",
      body: JSON.stringify({ idToken, providerHint }),
    });
  },

  signIn(email: string, password: string) {
    return apiRequest<AuthSessionResponse>("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
  },

  signUp(name: string, email: string, password: string) {
    return apiRequest<AuthSessionResponse>("/api/auth/register", {
      method: "POST",
      body: JSON.stringify({ name, email, password }),
    });
  },

  getSession(token: string) {
    return apiRequest<SessionStateResponse>("/api/auth/me", {
      headers: authHeaders(token),
    });
  },

  saveOnboarding(
    token: string,
    payload: Partial<{
      currentStep: number;
      selectedCategories: string[];
      themePreference: ThemePreference;
      notificationPreference: NotificationPreference;
      autoSaveEnabled: boolean;
    }>,
  ) {
    return apiRequest<{
      user: AuthUser;
      onboarding: OnboardingState;
    }>("/api/onboarding", {
      method: "PUT",
      headers: authHeaders(token),
      body: JSON.stringify(payload),
    });
  },

  completeOnboarding(token: string) {
    return apiRequest<SessionStateResponse>("/api/onboarding/complete", {
      method: "POST",
      headers: authHeaders(token),
    });
  },

  requestPasswordReset(email: string) {
    return apiRequest<ForgotPasswordResponse>("/api/auth/forgot-password", {
      method: "POST",
      body: JSON.stringify({ email }),
    });
  },

  resetPassword(token: string, password: string) {
    return apiRequest<AuthSessionResponse>("/api/auth/reset-password", {
      method: "POST",
      body: JSON.stringify({ token, password }),
    });
  },

  getIdentities(token: string) {
    return apiRequest<{ identities: AuthIdentity[] }>("/api/account/identities", {
      headers: authHeaders(token),
    });
  },

  linkIdentity(token: string, idToken: string, providerHint: IdentityProvider) {
    return apiRequest<SessionStateResponse>("/api/account/identities/link", {
      method: "POST",
      headers: authHeaders(token),
      body: JSON.stringify({ idToken, providerHint }),
    });
  },
};
