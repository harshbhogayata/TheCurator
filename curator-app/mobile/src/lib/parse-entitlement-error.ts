import { ApiError } from "../services/api-client";
import type { SubscriptionTier } from "../providers/subscription-provider";

interface EntitlementErrorDetails {
  code?: string;
  requiredTier?: SubscriptionTier;
}

function isSubscriptionTier(value: unknown): value is SubscriptionTier {
  return value === "free" || value === "basic" || value === "premium" || value === "lifetime";
}

export function parseEntitlementError(error: unknown): {
  isEntitlement: boolean;
  requiredTier: SubscriptionTier;
} {
  if (!(error instanceof ApiError) || error.status !== 403) {
    return { isEntitlement: false, requiredTier: "basic" };
  }

  const details = error.details as EntitlementErrorDetails | undefined;
  if (details?.code !== "entitlement_required") {
    return { isEntitlement: false, requiredTier: "basic" };
  }

  return {
    isEntitlement: true,
    requiredTier: isSubscriptionTier(details.requiredTier) ? details.requiredTier : "basic",
  };
}
