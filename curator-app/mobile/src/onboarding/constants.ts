import { BookOpen, Heart, Monitor, Moon, Sun, Zap } from "lucide-react-native";

import { onboardingStepOrder, type OnboardingStep } from "../lib/types";

export const onboardingSteps = onboardingStepOrder.filter(
  (step): step is Exclude<OnboardingStep, "complete"> => step !== "complete",
);

export const visualStepKeys = ["account", "categories", "appearance", "reading"] as const;

export const categoryEmojiByKey: Record<string, string> = {
  news: "🌍",
  economy: "📈",
  technology: "💻",
  science: "🔬",
  culture: "🎭",
  health: "❤️",
  politics: "🏛️",
  climate: "🌿",
};

export const themeOptions = [
  { value: "light" as const, label: "Light", description: "Bright & crisp", Icon: Sun },
  { value: "dark" as const, label: "Dark", description: "Easy on eyes", Icon: Moon },
  { value: "system" as const, label: "Auto", description: "Match device", Icon: Monitor },
];

export const notificationOptions = [
  { key: "daily" as const, label: "Daily brief" },
  { key: "breaking" as const, label: "Breaking news" },
  { key: "weekly" as const, label: "Weekly digest" },
  { key: "none" as const, label: "None" },
];

export const textSizeOptions = [
  { key: "compact" as const, label: "Compact", description: "Fast scanning" },
  { key: "comfortable" as const, label: "Comfortable", description: "Balanced" },
  { key: "large" as const, label: "Large", description: "More room" },
];

export const welcomeFeatures = [
  {
    key: "narratives",
    title: "Synthesized narratives",
    description: "From global sources, shaped into one clear story.",
    Icon: BookOpen,
  },
  {
    key: "collections",
    title: "Save to collections",
    description: "Keep the stories that matter without losing your place.",
    Icon: Heart,
  },
  {
    key: "briefs",
    title: "Personalized briefs",
    description: "A calmer daily feed tuned to what you care about.",
    Icon: Zap,
  },
];

/** 20% opacity — matches Figma's /20 */
export const BORDER_SUBTLE = "33";
