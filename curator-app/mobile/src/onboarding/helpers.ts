import { onboardingSteps, visualStepKeys } from "./constants";

export type VisualStep = (typeof onboardingSteps)[number];

export function getVisualIndex(step: VisualStep): number {
  if (step === "notifications") return 2;
  return visualStepKeys.indexOf(step as (typeof visualStepKeys)[number]);
}

export function getPreviousStep(step: VisualStep): VisualStep | null {
  const index = onboardingSteps.indexOf(step);
  if (index <= 0) return null;
  return onboardingSteps[index - 1];
}

export function getStepCopy(step: VisualStep) {
  if (step === "account") {
    return {
      title: "Let's Get Acquainted",
      description: "Tell us how The Curator should address you across the app.",
    };
  }
  if (step === "categories") {
    return {
      title: "What Interests You?",
      description: "Select at least 3 topics to personalize your feed.",
    };
  }
  if (step === "appearance" || step === "notifications") {
    return {
      title: "Customize Your Experience",
      description: "Choose how you want to read The Curator.",
    };
  }
  return {
    title: "Shape Your Reading Ritual",
    description: "A few final choices before we drop you into home.",
  };
}
