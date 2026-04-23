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
  memberSince: string;
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
    key: "world",
    label: "World",
    description: "Global context, diplomacy, and markets that reshape the day.",
  },
  {
    key: "business",
    label: "Business",
    description: "Leadership moves, earnings, and intelligent company analysis.",
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
    key: "design",
    label: "Design",
    description: "Architecture, product craft, systems thinking, and style.",
  },
  {
    key: "climate",
    label: "Climate",
    description: "Energy, sustainability, resilience, and environmental change.",
  },
  {
    key: "policy",
    label: "Policy",
    description: "Government decisions, public institutions, and civic impact.",
  },
  {
    key: "sport",
    label: "Sport",
    description: "High-signal stories around performance, culture, and competition.",
  },
];

export const defaultPreferences: UserPreferences = {
  themePreference: "system",
  notificationFrequency: "daily",
  pushEnabled: true,
  emailDigestEnabled: true,
  autoSaveEnabled: true,
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
  | "world"
  | "business"
  | "technology"
  | "science"
  | "culture"
  | "design"
  | "climate"
  | "policy"
  | "sport";

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
