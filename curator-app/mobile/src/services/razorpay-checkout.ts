import Constants from "expo-constants";
import * as WebBrowser from "expo-web-browser";
import { Platform } from "react-native";

import type { CheckoutPayload, RazorpaySuccessResponse } from "./billing-api";
import { createMobileDonateHandoff } from "./billing-api";
import { buildMobileDonateUrl } from "../lib/resolve-mobile-donate-url";

const RAZORPAY_KEY_ID = process.env.EXPO_PUBLIC_RAZORPAY_KEY_ID ?? "";

type NativeRazorpayModule = {
  open: (options: Record<string, unknown>) => Promise<RazorpaySuccessResponse>;
};

/** Android uses secure web checkout (native SDK is incompatible with New Architecture). */
export function shouldUseWebRazorpayCheckout(): boolean {
  return Platform.OS === "android" || Constants.appOwnership === "expo";
}

function resolveNativeRazorpay(): NativeRazorpayModule | null {
  if (shouldUseWebRazorpayCheckout()) {
    return null;
  }

  try {
    const RazorpayCheckout = require("react-native-razorpay").default;
    return RazorpayCheckout as NativeRazorpayModule;
  } catch {
    return null;
  }
}

function resolveKeyId(serverKeyId: string): string {
  return RAZORPAY_KEY_ID || serverKeyId;
}

function buildNativeOptions(
  checkout: CheckoutPayload & { provider: "razorpay" },
): Record<string, unknown> {
  const options: Record<string, unknown> = {
    key: resolveKeyId(checkout.keyId),
    name: checkout.name,
    description: checkout.description,
    prefill: checkout.prefill ?? {},
    theme: { color: "#31332b" },
  };

  if (checkout.mode === "subscription" && checkout.subscriptionId) {
    options.subscription_id = checkout.subscriptionId;
  } else {
    options.order_id = checkout.orderId;
    options.amount = checkout.amount;
    options.currency = checkout.currency;
  }

  return options;
}

export async function openRazorpayCheckout(
  checkout: CheckoutPayload & { provider: "razorpay" },
): Promise<RazorpaySuccessResponse> {
  const native = resolveNativeRazorpay();
  if (!native) {
    throw new Error(
      Constants.appOwnership === "expo"
        ? "Razorpay native checkout requires a development build. Use web checkout or install a dev build."
        : Platform.OS === "android"
          ? "Razorpay native checkout is disabled on Android. Use web checkout."
          : "Razorpay checkout is unavailable on this device.",
    );
  }

  try {
    return await native.open(buildNativeOptions(checkout));
  } catch (error: unknown) {
    const code = (error as { code?: number })?.code;
    if (code === 0 || code === 2) {
      throw new Error("Payment cancelled");
    }
    const description = (error as { description?: string })?.description;
    throw new Error(description ?? "Payment failed");
  }
}

export async function openStandardRazorpayOrderCheckout(input: {
  keyId: string;
  orderId: string;
  amount: number;
  currency: string;
  name?: string;
  description?: string;
  prefill?: { email?: string; name?: string };
}): Promise<RazorpaySuccessResponse> {
  return openRazorpayCheckout({
    provider: "razorpay",
    mode: "order",
    keyId: input.keyId,
    tier: "",
    orderId: input.orderId,
    amount: input.amount,
    currency: input.currency,
    name: input.name ?? "The Curator",
    description: input.description ?? "Membership",
    prefill: input.prefill,
    callbackUrl: "",
  });
}

/** Complete payment on the web app (Android / Expo Go), then refresh entitlement. */
export async function openWebDonateCheckout(plan: string): Promise<void> {
  let url = buildMobileDonateUrl({ plan, source: "app", auto: "1" });

  try {
    const handoff = await createMobileDonateHandoff(
      plan as "basic" | "premium" | "lifetime",
    );
    url = handoff.donateUrl;
  } catch {
    // Handoff optional — unsigned URL still works if user signs in on the page.
  }

  await WebBrowser.openBrowserAsync(url, {
    presentationStyle: WebBrowser.WebBrowserPresentationStyle.FULL_SCREEN,
    enableBarCollapsing: true,
  });
}
