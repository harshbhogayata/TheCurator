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
export type SubscriptionTier = "free" | "basic" | "premium" | "lifetime";

export interface AppUser {
  id: string;
  email: string;
  displayName: string | null;
  avatarUrl: string | null;
  firebaseUid: string | null;
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

export interface IdentityRecord {
  provider: IdentityProvider;
  providerEmail: string | null;
  providerUid: string | null;
}

export interface SessionPayload {
  user: AppUser;
  onboarding: UserOnboardingState;
  preferences: UserPreferences;
  identities: IdentityRecord[];
}

export interface Collection {
  id: string;
  name: string;
  description: string;
  color: string;
  icon: string;
  articleIds: string[];
  createdAt: string;
}

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

export const categoryOptions = [
  { key: "news", label: "World News", emoji: "🌍" },
  { key: "economy", label: "Economy", emoji: "📈" },
  { key: "technology", label: "Technology", emoji: "💻" },
  { key: "science", label: "Science", emoji: "🔬" },
  { key: "culture", label: "Culture", emoji: "🎭" },
  { key: "health", label: "Health", emoji: "❤️" },
  { key: "politics", label: "Politics", emoji: "🏛️" },
  { key: "climate", label: "Climate", emoji: "🌿" },
] as const;

export function onboardingStepToNumber(step: OnboardingStep): number {
  const index = onboardingStepOrder.indexOf(step);
  return index >= 0 ? index + 1 : 1;
}

export function numberToOnboardingStep(step: number): OnboardingStep {
  return onboardingStepOrder[Math.max(0, Math.min(step - 1, onboardingStepOrder.length - 1))];
}
