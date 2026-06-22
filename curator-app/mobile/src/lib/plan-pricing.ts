import type { PurchasesPackage } from "react-native-purchases";

export type PlanId = "free" | "basic" | "premium" | "lifetime";

export interface PlanPriceParts {
  amount: string;
  suffix: string;
  line: string;
}

interface FormatPlanPriceOptions {
  razorpayBilling: boolean;
  storePackage?: PurchasesPackage;
}

export function formatPlanPriceParts(
  planId: PlanId,
  price: number,
  period: string,
  options: FormatPlanPriceOptions,
): PlanPriceParts {
  const { razorpayBilling, storePackage } = options;

  if (planId === "free") {
    const amount = razorpayBilling ? "₹0" : "$0";
    return { amount, suffix: "", line: amount };
  }

  if (storePackage?.product.priceString && !razorpayBilling) {
    const line = storePackage.product.priceString;
    return { amount: line, suffix: "", line };
  }

  if (razorpayBilling) {
    const amount = `₹${price.toLocaleString("en-IN")}`;
    if (planId === "lifetime") {
      return { amount, suffix: "one-time", line: `${amount} one-time` };
    }
    const suffix = period.replace("/", "") || "mo";
    return { amount, suffix, line: `${amount}${period}` };
  }

  const amount = `$${price}`;
  if (planId === "lifetime") {
    return { amount, suffix: "one-time", line: `${amount} one-time` };
  }
  const suffix = period.replace("/", "") || "mo";
  return { amount, suffix, line: `${amount}${period}` };
}

export function subscribeCtaTitle(
  selectedPlan: PlanId,
  planName: string,
  tier: PlanId,
  isPurchasing: boolean,
): string {
  if (isPurchasing) return "Processing…";
  if (selectedPlan === "free" && tier !== "free") return "Switch to Free";
  if (selectedPlan === "free") return "Stay on Free";
  return `Subscribe to ${planName}`;
}

export function subscribeCtaSubtitle(
  selectedPlan: PlanId,
  tier: PlanId,
  priceParts: PlanPriceParts,
): string {
  if (selectedPlan === "free") {
    return tier !== "free" ? "Cancel paid plan" : "Always free";
  }
  return priceParts.line;
}
