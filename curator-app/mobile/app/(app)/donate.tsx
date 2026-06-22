import { useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import {
  Heart,
  Sparkles,
  Crown,
  Star,
  Check,
  CreditCard,
  ChevronRight,
  Rss,
} from "lucide-react-native";

import { useTheme } from "../../src/providers/theme-provider";
import { useSubscription, type SubscriptionTier } from "../../src/providers/subscription-provider";
import { usesRazorpayBilling } from "../../src/lib/billing-provider";
import {
  formatPlanPriceParts,
  subscribeCtaSubtitle,
  subscribeCtaTitle,
  type PlanId,
} from "../../src/lib/plan-pricing";
import { shouldUseWebRazorpayCheckout } from "../../src/services/razorpay-checkout";
import { SubscriptionBadge } from "../../src/ui/subscription-badge";
import { useToast } from "../../src/providers/toast-provider";
import { PillPageHeader } from "../../src/ui/pill-page-header";
import type { PurchasesPackage } from "react-native-purchases";
import Constants from "expo-constants";

interface Plan {
  id: PlanId;
  name: string;
  price: number;
  period: string;
  description: string;
  benefits: string[];
  popular?: boolean;
}

const plans: Plan[] = [
  {
    id: "free",
    name: "Free",
    price: 0,
    period: "",
    description: "Ad-supported, always free",
    benefits: [
      "Access to all daily briefs",
      "Save up to 25 articles",
      "Ad-supported experience",
    ],
  },
  {
    id: "basic",
    name: "Basic",
    price: 499,
    period: "/mo",
    description: "Essential features for casual readers",
    benefits: [
      "Ad-free reading experience",
      "Early access to daily briefs",
      "Monthly newsletter",
      "Save up to 100 articles",
    ],
  },
  {
    id: "premium",
    name: "Premium",
    price: 1499,
    period: "/mo",
    description: "Complete access for serious readers",
    benefits: [
      "Everything in Basic",
      "Audio versions of all articles",
      "Community forum access",
      "Unlimited saves & collections",
      "Exclusive source insights",
    ],
    popular: true,
  },
  {
    id: "lifetime",
    name: "Lifetime",
    price: 24999,
    period: "",
    description: "One-time payment, lifetime access",
    benefits: [
      "Everything in Premium",
      "Lifetime access - pay once",
      "All future features included",
      "Priority support",
      "Recognition in credits",
    ],
  },
];

const planIcons = {
  free: Rss,
  basic: Sparkles,
  premium: Crown,
  lifetime: Star,
};

const MOCK_BACKEND = __DEV__ && process.env.EXPO_PUBLIC_MOCK_BACKEND === "true";
const RC_PRODUCT_IDS: Partial<Record<Exclude<Plan["id"], "free">, string>> = {
  basic: process.env.EXPO_PUBLIC_RC_BASIC_PRODUCT_ID,
  premium: process.env.EXPO_PUBLIC_RC_PREMIUM_PRODUCT_ID,
  lifetime: process.env.EXPO_PUBLIC_RC_LIFETIME_PRODUCT_ID,
};

function normalizeIdentifier(value?: string | null): string {
  return (value ?? "").trim().toLowerCase();
}

function findPackageForPlan(packages: PurchasesPackage[], planId: Plan["id"]): PurchasesPackage | undefined {
  if (planId === "free") {
    return undefined;
  }

  const configuredProductId = normalizeIdentifier(RC_PRODUCT_IDS[planId]);
  return packages.find((pkg) => {
    const identifiers = [
      normalizeIdentifier(pkg.identifier),
      normalizeIdentifier(pkg.product?.identifier),
    ].filter(Boolean);

    if (configuredProductId) {
      return identifiers.includes(configuredProductId);
    }

    return identifiers.some((id) => {
      const tokens = id.replace(/[$.-]/g, "_").split("_").filter(Boolean);
      return tokens.includes(planId);
    });
  });
}

export default function DonateScreen() {
  const { palette } = useTheme();
  const { tier, setTier, packages, purchasePackage, purchaseTier, downgradeToFree, isPurchasing } = useSubscription();
  const razorpayBilling = usesRazorpayBilling();
  const usesWebCheckout = razorpayBilling && shouldUseWebRazorpayCheckout();
  const { showToast } = useToast();
  const router = useRouter();
  const [selectedPlan, setSelectedPlan] = useState<Plan["id"]>("premium");
  const selectedPlanData = plans.find((plan) => plan.id === selectedPlan) ?? plans[2];
  const selectedPackage = findPackageForPlan(packages, selectedPlan);

  const handleSubscribe = async () => {
    const isExpoGo = Constants.appOwnership === "expo";
    if (MOCK_BACKEND || (isExpoGo && !razorpayBilling)) {
      setTier(selectedPlan);
      const msg = selectedPlan === "free"
        ? "Switched to Free plan."
        : `You're now a ${selectedPlan} member! [Expo Go Mock Enabled] Thank you for your support.`;
      showToast("success", msg);
      router.back();
      return;
    }

    if (selectedPlan === "free") {
      if (tier === "free") {
        showToast("info", "You are already on the free plan.");
        return;
      }

      if (tier === "lifetime") {
        showToast("info", "Lifetime plans cannot be cancelled online. Contact support if you need help.");
        return;
      }

      try {
        const message = await downgradeToFree();
        showToast("success", message);
        router.back();
      } catch (error) {
        const message = error instanceof Error ? error.message : "Unable to switch plans right now.";
        showToast("error", message);
      }
      return;
    }

    if (razorpayBilling) {
      try {
        const success = await purchaseTier(selectedPlan);
        if (success) {
          showToast("success", `You're now a ${selectedPlan} member! Thank you for your support.`);
          router.back();
          return;
        }
        if (usesWebCheckout) {
          showToast(
            "info",
            "Complete payment in the browser tab. When you're done, return here — your plan refreshes automatically.",
          );
          return;
        }
        showToast("info", "Payment was not completed.");
      } catch (error) {
        const message = error instanceof Error ? error.message : "Payment failed.";
        showToast("error", message);
      }
      return;
    }

    const pkg = selectedPackage;
    
    if (!pkg) {
      showToast("error", "This package is not available for purchase right now.");
      return;
    }

    const success = await purchasePackage(pkg);
    if (success) {
      showToast("success", `You're now a ${selectedPlan} member! Thank you for your support.`);
      router.back();
    }
  };

  const selectedPriceParts = formatPlanPriceParts(
    selectedPlanData.id,
    selectedPlanData.price,
    selectedPlanData.period,
    { razorpayBilling, storePackage: selectedPackage },
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: palette.background }}>
      <PillPageHeader title="Support Us" />

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero */}
        <View style={{ marginBottom: 28, marginTop: 8 }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 14, marginBottom: 14 }}>
            <View
              style={{
                width: 52,
                height: 52,
                borderRadius: 26,
                backgroundColor: palette.primaryContainer,
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <Heart size={24} color={palette.onPrimaryContainer} />
            </View>
            <Text
              style={{
                fontFamily: "Newsreader_500Medium_Italic",
                fontSize: 26,
                color: palette.onSurface,
                flex: 1,
                lineHeight: 32,
              }}
            >
              Support Independent Journalism
            </Text>
          </View>
          <Text
            style={{
              fontFamily: "Manrope_400Regular",
              fontSize: 14,
              color: palette.onSurfaceVariant,
              lineHeight: 22,
              paddingLeft: 4,
            }}
          >
            No ads, no paywalls, no corporate influence. Just thoughtful journalism funded by readers like you.
          </Text>
        </View>

        {usesWebCheckout ? (
          <View
            style={{
              backgroundColor: palette.secondaryContainer + "99",
              borderRadius: 16,
              padding: 14,
              marginBottom: 16,
              borderWidth: 1,
              borderColor: palette.outlineVariant + "33",
            }}
          >
            <Text
              style={{
                fontFamily: "Manrope_500Medium",
                fontSize: 13,
                color: palette.onSecondaryContainer,
                lineHeight: 20,
                textAlign: "center",
              }}
            >
              Secure checkout opens in your browser. Return here after payment — your plan updates automatically.
            </Text>
          </View>
        ) : null}

        {/* Current Tier */}
        {tier !== "free" && (
          <View
            style={{
              backgroundColor: palette.primaryContainer + "80",
              borderRadius: 16,
              padding: 12,
              alignItems: "center",
              marginBottom: 16,
            }}
          >
            <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
              <Text
                style={{
                  fontFamily: "Manrope_500Medium",
                  fontSize: 14,
                  color: palette.onPrimaryContainer,
                }}
              >
                Current plan:
              </Text>
              <SubscriptionBadge size="md" />
            </View>
          </View>
        )}

        {/* Plan Cards */}
        <View style={{ gap: 12, marginBottom: 24 }}>
          {plans.map((plan) => {
            const Icon = planIcons[plan.id];
            const isSelected = selectedPlan === plan.id;
            const isCurrent = tier === plan.id;
            const storePackage = findPackageForPlan(packages, plan.id);
            const priceParts = formatPlanPriceParts(plan.id, plan.price, plan.period, {
              razorpayBilling,
              storePackage,
            });

            return (
              <Pressable
                key={plan.id}
                onPress={() => setSelectedPlan(plan.id)}
                style={{
                  backgroundColor: palette.surfaceContainerLowest,
                  borderRadius: 24,
                  borderWidth: 2,
                  borderColor: isSelected ? palette.primary : palette.outlineVariant + "26",
                  padding: 20,
                  position: "relative",
                  overflow: "hidden",
                }}
              >
                {plan.popular && (
                  <View
                    style={{
                      position: "absolute",
                      top: 12,
                      right: 12,
                      backgroundColor: palette.primary,
                      borderRadius: 999,
                      paddingHorizontal: 10,
                      paddingVertical: 4,
                    }}
                  >
                    <Text
                      style={{
                        fontFamily: "Manrope_600SemiBold",
                        fontSize: 10,
                        color: "#ffffff",
                        textTransform: "uppercase",
                        letterSpacing: 1,
                      }}
                    >
                      Popular
                    </Text>
                  </View>
                )}

                {isCurrent && (
                  <View
                    style={{
                      position: "absolute",
                      top: 12,
                      right: plan.popular ? 80 : 12,
                      backgroundColor: palette.secondaryContainer,
                      borderRadius: 999,
                      paddingHorizontal: 10,
                      paddingVertical: 4,
                    }}
                  >
                    <Text
                      style={{
                        fontFamily: "Manrope_600SemiBold",
                        fontSize: 10,
                        color: palette.onSecondaryContainer,
                        textTransform: "uppercase",
                        letterSpacing: 1,
                      }}
                    >
                      Current
                    </Text>
                  </View>
                )}

                <View style={{ flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 12 }}>
                  <View
                    style={{
                      width: 44,
                      height: 44,
                      borderRadius: 22,
                      backgroundColor: palette.primaryContainer,
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <Icon size={22} color={palette.onPrimaryContainer} />
                  </View>
                  <View style={{ flex: 1, minWidth: 0, paddingRight: plan.popular || isCurrent ? 72 : 0 }}>
                    <Text
                      style={{
                        fontFamily: "Newsreader_700Bold",
                        fontSize: 20,
                        color: palette.onSurface,
                      }}
                    >
                      {plan.name}
                    </Text>
                    <Text
                      style={{
                        fontFamily: "Manrope_400Regular",
                        fontSize: 13,
                        color: palette.onSurfaceVariant,
                      }}
                    >
                      {plan.description}
                    </Text>
                  </View>
                </View>

                <View style={{ flexDirection: "row", alignItems: "flex-end", flexWrap: "wrap", gap: 6, marginBottom: 14 }}>
                  <Text
                    style={{
                      fontFamily: "Manrope_700Bold",
                      fontSize: 32,
                      color: palette.onSurface,
                    }}
                  >
                    {priceParts.amount}
                  </Text>
                  {priceParts.suffix ? (
                    <Text
                      style={{
                        fontFamily: "Manrope_500Medium",
                        fontSize: 15,
                        color: palette.onSurfaceVariant,
                        marginBottom: 4,
                      }}
                    >
                      {plan.id === "lifetime" || !plan.period ? priceParts.suffix : `/${priceParts.suffix}`}
                    </Text>
                  ) : null}
                </View>

                <View style={{ gap: 8 }}>
                  {plan.benefits.map((benefit) => (
                    <View key={benefit} style={{ flexDirection: "row", alignItems: "flex-start", gap: 8 }}>
                      <Check size={16} color={palette.primary} style={{ marginTop: 2 }} />
                      <Text
                        style={{
                          flex: 1,
                          fontFamily: "Manrope_400Regular",
                          fontSize: 14,
                          color: palette.onSurface,
                          lineHeight: 20,
                        }}
                      >
                        {benefit}
                      </Text>
                    </View>
                  ))}
                </View>
              </Pressable>
            );
          })}
        </View>

        {/* Subscribe Button — the most important CTA in the app */}
        <View
          style={{
            backgroundColor: palette.primary,
            borderRadius: 28,
            marginBottom: 16,
            shadowColor: palette.primary,
            shadowOffset: { width: 0, height: 10 },
            shadowOpacity: 0.28,
            shadowRadius: 24,
            elevation: 14,
          }}
        >
          <Pressable
            onPress={handleSubscribe}
            android_ripple={{ color: "rgba(255,255,255,0.12)" }}
            disabled={isPurchasing}
            style={({ pressed }) => ({
              width: "100%",
              paddingHorizontal: 20,
              paddingVertical: 18,
              flexDirection: "row",
              alignItems: "center",
              gap: 14,
              opacity: pressed || isPurchasing ? 0.92 : 1,
            })}
          >
            <View
              style={{
                width: 48,
                height: 48,
                borderRadius: 24,
                backgroundColor: palette.primaryForeground + "26",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <CreditCard size={22} color={palette.primaryForeground} />
            </View>

            <View style={{ flex: 1, minWidth: 0, paddingRight: 4 }}>
              <Text
                style={{
                  fontFamily: "Manrope_700Bold",
                  fontSize: 18,
                  color: palette.primaryForeground,
                  letterSpacing: 0.2,
                }}
              >
                {subscribeCtaTitle(selectedPlan, selectedPlanData.name, tier, isPurchasing)}
              </Text>
              <Text
                numberOfLines={2}
                style={{
                  fontFamily: "Manrope_500Medium",
                  fontSize: 14,
                  color: palette.primaryForeground + "CC",
                  marginTop: 4,
                }}
              >
                {subscribeCtaSubtitle(selectedPlan, tier, selectedPriceParts)}
              </Text>
            </View>

            <View style={{ flexShrink: 0 }}>
              <ChevronRight size={22} color={palette.primaryForeground} />
            </View>
          </Pressable>
        </View>

        {/* Impact */}
        <View
          style={{
            backgroundColor: palette.primaryContainer + "80",
            borderRadius: 24,
            padding: 20,
            borderWidth: 1,
            borderColor: palette.outlineVariant + "26",
          }}
        >
          <Text
            style={{
              fontFamily: "Manrope_400Regular",
              fontSize: 14,
              color: palette.onPrimaryContainer,
              lineHeight: 20,
              textAlign: "center",
            }}
          >
            Your subscription matters. 100% of proceeds go directly to supporting our editorial team, expanding our
            source network, and keeping The Curator free from commercial influence.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
