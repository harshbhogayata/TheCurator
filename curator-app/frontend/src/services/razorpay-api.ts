import { apiRequest } from "./api-client";
import type { SubscriptionTier } from "../lib/types";

export type RazorpayOrderResponse = {
  order_id: string;
  amount: number;
  currency: string;
  key_id: string;
};

export type RazorpayVerifyResponse = {
  success: boolean;
  verified?: boolean;
};

/** POST /api/create-order — Razorpay Standard Checkout */
export async function createRazorpayOrder(
  body:
    | { tier: Exclude<SubscriptionTier, "free">; currency?: string; receipt?: string }
    | { amount: number; currency?: string; receipt?: string },
): Promise<RazorpayOrderResponse> {
  return apiRequest<RazorpayOrderResponse>("/api/create-order", {
    method: "POST",
    body,
  });
}

/** POST /api/verify-payment — HMAC signature verification */
export async function verifyRazorpayPayment(body: {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
}): Promise<RazorpayVerifyResponse> {
  return apiRequest<RazorpayVerifyResponse>("/api/verify-payment", {
    method: "POST",
    body,
  });
}
