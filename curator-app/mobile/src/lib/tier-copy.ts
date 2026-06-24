import type { SubscriptionTier } from "../providers/subscription-provider";
import type { PlanId } from "./plan-pricing";
import { usesRazorpayBilling } from "./billing-provider";

export function tierDisplayName(tier: SubscriptionTier): string {
  switch (tier) {
    case "basic":
      return "Basic";
    case "premium":
      return "Premium";
    case "lifetime":
      return "Lifetime";
    default:
      return "Free";
  }
}

export function tierUpgradeLine(featureName: string, requiredTier: SubscriptionTier): string {
  return `Upgrade to ${tierDisplayName(requiredTier)} to unlock ${featureName} and more.`;
}

export function briefAudioPromoCopy(): string {
  return "Upgrade to Basic for narrated daily briefs. Premium adds full article narration.";
}

export const DONATE_PLAN_COPY: Record<
  PlanId,
  { description: string; benefits: string[] }
> = {
  free: {
    description: "Ad-supported, always free",
    benefits: [
      "Daily curated briefs and articles",
      "Save up to 25 articles",
      "Source transparency on every story",
    ],
  },
  basic: {
    description: "Ad-free reading with narrated briefs",
    benefits: [
      "Everything in Free, without ads",
      "Narrated daily briefs",
      "Save up to 100 articles",
      "Collections to organize your reading",
    ],
  },
  premium: {
    description: "Full narration and unlimited reading",
    benefits: [
      "Everything in Basic",
      "Full article narration",
      "Unlimited saves and collections",
      "Early access to new editorial features",
    ],
  },
  lifetime: {
    description: "One payment, permanent Premium access",
    benefits: [
      "Everything in Premium",
      "Lifetime access — pay once",
      "All future Premium features included",
      "Priority support",
    ],
  },
};

export function subscriptionCancelHelpText(): string {
  if (usesRazorpayBilling()) {
    return "Open Profile → Manage Subscription (or Menu → Support Us), select the Free plan, and confirm. Your paid access continues until the end of your billing period. Lifetime memberships are one-time purchases.";
  }

  return "Open Profile → Manage Subscription to review your plan. For App Store or Google Play subscriptions, manage or cancel in your device subscription settings. Lifetime memberships are one-time purchases.";
}

export function collectionsTierHelpText(): string {
  return "Basic and above unlock collections. Premium adds unlimited saves and full article narration.";
}
