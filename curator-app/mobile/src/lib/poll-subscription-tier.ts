import type { SubscriptionTier } from "../lib/types";
import { fetchEntitlement } from "../services/mobile-api";

const MOCK_PREMIUM = __DEV__ && process.env.EXPO_PUBLIC_MOCK_PREMIUM === "true";

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

/** Poll backend after web checkout — webhooks can lag a few seconds. */
export async function pollSubscriptionTierAfterPayment(
  previousTier: SubscriptionTier,
  maxAttempts = 8,
): Promise<SubscriptionTier> {
  let latest: SubscriptionTier = MOCK_PREMIUM ? "premium" : "free";

  for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
    try {
      const payload = await fetchEntitlement();
      latest = payload.effectiveTier ?? payload.tier;
      if (latest !== "free" && latest !== previousTier) {
        return latest;
      }
    } catch {
      // Keep polling on transient errors.
    }
    await sleep(1500 * (attempt + 1));
  }

  return latest;
}
