import { signInWithCustomToken } from "firebase/auth";

import { apiRequest } from "../services/api-client";
import { firebaseConfigured, getFirebaseAuth } from "../services/firebase";

export type DonatePlanId = "basic" | "premium" | "lifetime";

const VALID_PLANS: DonatePlanId[] = ["basic", "premium", "lifetime"];

export function parseDonatePlan(value: string | null | undefined): DonatePlanId | null {
  const normalized = String(value ?? "").trim().toLowerCase();
  return VALID_PLANS.includes(normalized as DonatePlanId) ? (normalized as DonatePlanId) : null;
}

/** Exchange a short-lived mobile handoff token for a Firebase custom token and sign in. */
export async function exchangeMobileHandoff(handoffToken: string): Promise<void> {
  if (!firebaseConfigured) {
    throw new Error("Firebase is not configured.");
  }

  const { customToken } = await apiRequest<{ customToken: string }>(
    "/api/billing/v1/mobile-handoff/exchange/",
    {
      method: "POST",
      body: { handoffToken },
    },
  );

  const auth = getFirebaseAuth();
  await signInWithCustomToken(auth, customToken);
}
