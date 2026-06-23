export type AuthStatus = "loading" | "signed-out" | "signed-in" | "error";
export type ThemePreference = "light" | "dark" | "system";
export type NotificationFrequency = "daily" | "breaking" | "weekly" | "none";
export type TextSize = "compact" | "comfortable" | "large";
export type OnboardingStep =
  | "account"
  | "categories"
  | "appearance"
  | "notifications"
  | "reading"
  | "complete";
export type IdentityProvider = "email" | "google" | "apple";

export interface CategoryOption {
  key: string;
  label: string;
  description: string;
}

export interface IdentityRecord {
  provider: IdentityProvider;
  providerEmail: string | null;
  providerUid: string | null;
}

export interface AppUser {
  id: string;
  email: string;
  displayName: string | null;
  avatarUrl: string | null;
  firebaseUid: string | null;
  memberSince: string;
  emailVerified: boolean;
}

export interface UserPreferences {
  themePreference: ThemePreference;
  notificationFrequency: NotificationFrequency;
  pushEnabled: boolean;
  emailDigestEnabled: boolean;
  autoSaveEnabled: boolean;
  textSize: TextSize;
  reduceMotionEnabled: boolean;
}

export interface UserOnboardingState {
  currentStep: OnboardingStep;
  isCompleted: boolean;
  completedAt: string | null;
  selectedCategories: string[];
}

export interface SessionPayload {
  user: AppUser;
  onboarding: UserOnboardingState;
  preferences: UserPreferences;
  identities: IdentityRecord[];
}

export const categoryOptions: CategoryOption[] = [
  {
    key: "news",
    label: "World News",
    description: "Headlines, global events, and the stories shaping the day.",
  },
  {
    key: "economy",
    label: "Economy",
    description: "Global context, business, and markets that reshape the day.",
  },
  {
    key: "technology",
    label: "Technology",
    description: "AI, product launches, regulation, and startup momentum.",
  },
  {
    key: "science",
    label: "Science",
    description: "Breakthroughs, research, and evidence-driven storytelling.",
  },
  {
    key: "culture",
    label: "Culture",
    description: "Film, books, creators, and the ideas shaping taste.",
  },
  {
    key: "health",
    label: "Health",
    description: "Medicine, wellness, longevity, and biotechnology developments.",
  },
  {
    key: "politics",
    label: "Politics",
    description: "Government decisions, public institutions, and civic impact.",
  },
  {
    key: "climate",
    label: "Climate",
    description: "Energy, sustainability, resilience, and environmental change.",
  },
];

export const defaultPreferences: UserPreferences = {
  themePreference: "system",
  notificationFrequency: "daily",
  pushEnabled: true,
  emailDigestEnabled: true,
  autoSaveEnabled: false,
  textSize: "comfortable",
  reduceMotionEnabled: false,
};

export const onboardingStepOrder: OnboardingStep[] = [
  "account",
  "categories",
  "appearance",
  "notifications",
  "reading",
  "complete",
];

// Article types
export type ArticleCategory =
  | "news"
  | "economy"
  | "technology"
  | "science"
  | "culture"
  | "health"
  | "politics"
  | "climate";

// Collection types
export interface Collection {
  id: string;
  name: string;
  description: string;
  color: string;
  icon: string;
  articleIds: string[];
  createdAt: string;
}

// Subscription types
export type SubscriptionTier = "free" | "basic" | "premium" | "lifetime";

// Reading types — TextSize is the canonical font-size token (matches UserPreferences)
export type LineHeight = "compact" | "comfortable" | "spacious";

// Toast types
export type ToastType = "success" | "error" | "info" | "warning";

// Audio types
export type AudioPlaybackState = "idle" | "loading" | "playing" | "paused";
export type PlaybackSpeed = 1 | 1.25 | 1.5 | 1.75 | 2;
