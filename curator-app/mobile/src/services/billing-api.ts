import type { SubscriptionTier } from "../lib/types";
import { apiRequest } from "./api-client";

const BILLING_PREFIX = "/api/billing/v1";

export type CheckoutPayload =
  | { provider: "stripe"; url: string }
  | {
      provider: "razorpay";
      mode: "order" | "subscription";
      keyId: string;
      tier: string;
      orderId?: string;
      subscriptionId?: string;
      amount?: number;
      currency?: string;
      prefill?: { email?: string; name?: string };
      name: string;
      description: string;
      callbackUrl: string;
    };

export type RazorpayOrderResponse = {
  order_id: string;
  amount: number;
  currency: string;
  key_id: string;
};

export type RazorpaySuccessResponse = {
  razorpay_payment_id: string;
  razorpay_order_id: string;
  razorpay_signature: string;
  razorpay_subscription_id?: string;
};

export async function createCheckout(
  tier: Exclude<SubscriptionTier, "free">,
): Promise<CheckoutPayload> {
  return apiRequest<CheckoutPayload>(`${BILLING_PREFIX}/checkout/`, {
    method: "POST",
    body: { tier },
  });
}

export async function verifyRazorpayCheckout(body: {
  razorpay_payment_id: string;
  razorpay_order_id?: string;
  razorpay_subscription_id?: string;
  razorpay_signature: string;
}): Promise<{ verified: boolean }> {
  return apiRequest<{ verified: boolean }>(`${BILLING_PREFIX}/verify/`, {
    method: "POST",
    body,
  });
}

export async function createRazorpayOrder(body: {
  tier: Exclude<SubscriptionTier, "free">;
}): Promise<RazorpayOrderResponse> {
  return apiRequest<RazorpayOrderResponse>("/api/create-order", {
    method: "POST",
    body,
  });
}

export async function verifyRazorpayPayment(body: {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
}): Promise<{ success: boolean; verified?: boolean }> {
  return apiRequest<{ success: boolean; verified?: boolean }>("/api/verify-payment", {
    method: "POST",
    body,
  });
}

export type MobileDonateHandoffResponse = {
  handoffToken: string;
  donateUrl: string;
  expiresInSeconds: number;
};

/** POST /api/billing/v1/mobile-handoff/ — signed URL for web donate with auth. */
export async function createMobileDonateHandoff(
  plan: Exclude<SubscriptionTier, "free">,
): Promise<MobileDonateHandoffResponse> {
  return apiRequest<MobileDonateHandoffResponse>(`${BILLING_PREFIX}/mobile-handoff/`, {
    method: "POST",
    body: { plan },
  });
}

export type CancelSubscriptionResponse = {
  provider?: string;
  status: "already_free" | "cancel_scheduled" | "downgraded";
  message?: string;
};

/** POST /api/billing/v1/portal/ — cancel recurring billing or downgrade order-based plans. */
export async function cancelBillingSubscription(): Promise<CancelSubscriptionResponse> {
  return apiRequest<CancelSubscriptionResponse>(`${BILLING_PREFIX}/portal/`, {
    method: "POST",
  });
}
