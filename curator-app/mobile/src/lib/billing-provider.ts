const explicit = (process.env.EXPO_PUBLIC_BILLING_PROVIDER ?? "auto").toLowerCase();

export type BillingProvider = "razorpay" | "revenuecat";

function revenueCatConfigured(): boolean {
  return Boolean(
    process.env.EXPO_PUBLIC_RC_IOS_KEY?.trim() || process.env.EXPO_PUBLIC_RC_ANDROID_KEY?.trim(),
  );
}

export function getBillingProvider(): BillingProvider {
  if (explicit === "razorpay") {
    return "razorpay";
  }
  if (explicit === "revenuecat") {
    return "revenuecat";
  }
  if (revenueCatConfigured()) {
    return "revenuecat";
  }
  return "razorpay";
}

export function usesRazorpayBilling(): boolean {
  return getBillingProvider() === "razorpay";
}
