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
import { useSubscription } from "../../src/providers/subscription-provider";
import { SubscriptionBadge } from "../../src/ui/subscription-badge";
import { useToast } from "../../src/providers/toast-provider";
import { PillPageHeader } from "../../src/ui/pill-page-header";

interface Plan {
  id: "free" | "basic" | "premium" | "lifetime";
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
    price: 5,
    period: "/mo",
    description: "Essential features for casual readers",
    benefits: [
      "Ad-free reading experience",
      "Early access to daily briefs",
      "Monthly newsletter",
      "Save up to 50 articles",
    ],
  },
  {
    id: "premium",
    name: "Premium",
    price: 15,
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
    price: 299,
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

export default function DonateScreen() {
  const { palette } = useTheme();
  const { tier, setTier } = useSubscription();
  const { showToast } = useToast();
  const router = useRouter();
  const [selectedPlan, setSelectedPlan] = useState<Plan["id"]>("premium");
  const selectedPlanData = plans.find((plan) => plan.id === selectedPlan) ?? plans[2];

  const handleSubscribe = () => {
    setTier(selectedPlan);
    const msg = selectedPlan === "free"
      ? "Switched to Free plan."
      : `You're now a ${selectedPlan} member! Thank you for your support.`;
    showToast("success", msg);
    router.back();
  };

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
                  <View>
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

                <View style={{ flexDirection: "row", alignItems: "baseline", marginBottom: 14 }}>
                  <Text
                    style={{
                      fontFamily: "Manrope_700Bold",
                      fontSize: 32,
                      color: palette.onSurface,
                    }}
                  >
                    ${plan.price}
                  </Text>
                  {plan.period ? (
                    <Text
                      style={{
                        fontFamily: "Manrope_400Regular",
                        fontSize: 14,
                        color: palette.onSurfaceVariant,
                        marginLeft: 4,
                      }}
                    >
                      {plan.period}
                    </Text>
                  ) : (
                    <Text
                      style={{
                        fontFamily: "Manrope_400Regular",
                        fontSize: 14,
                        color: palette.onSurfaceVariant,
                        marginLeft: 4,
                      }}
                    >
                      one-time
                    </Text>
                  )}
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
            backgroundColor: "#111111",
            borderRadius: 28,
            marginBottom: 16,
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 10 },
            shadowOpacity: 0.28,
            shadowRadius: 24,
            elevation: 14,
            overflow: "hidden",
          }}
        >
          <Pressable
            onPress={handleSubscribe}
            android_ripple={{ color: "rgba(255,255,255,0.12)" }}
            style={({ pressed }) => ({
              width: "100%",
              minHeight: 96,
              paddingHorizontal: 24,
              flexDirection: "row",
              alignItems: "center",
              gap: 16,
              opacity: pressed ? 0.92 : 1,
            })}
          >
            <View
              style={{
                width: 52,
                height: 52,
                borderRadius: 26,
                backgroundColor: "rgba(255,255,255,0.16)",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <CreditCard size={24} color="#ffffff" />
            </View>

            <View style={{ flex: 1, minWidth: 0 }}>
              <Text
                numberOfLines={1}
                style={{
                  fontFamily: "Manrope_700Bold",
                  fontSize: 19,
                  color: "#ffffff",
                  letterSpacing: 0.2,
                }}
              >
                Subscribe to {selectedPlanData.name}
              </Text>
              <Text
                numberOfLines={1}
                style={{
                  fontFamily: "Manrope_400Regular",
                  fontSize: 14,
                  color: "rgba(255,255,255,0.78)",
                  marginTop: 4,
                }}
              >
                {selectedPlanData.price === 0
                  ? "Always free"
                  : `$${selectedPlanData.price}${selectedPlanData.period || " one-time"}`}
              </Text>
            </View>

            <ChevronRight size={22} color="#ffffff" />
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
