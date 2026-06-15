import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";

import { queryKeys } from "../../lib/query-keys";
import { openStandardRazorpayCheckout } from "../../lib/razorpay-checkout";
import { createBillingPortal, createCheckout, fetchEntitlement } from "../../services/mobile-api";
import { createRazorpayOrder, verifyRazorpayPayment } from "../../services/razorpay-api";
import type { SubscriptionTier } from "../../lib/types";
import { useAuth } from "./AuthContext";
import { isMockBackend, isMockPremium } from "../../lib/dev-mode";

interface SubscriptionContextType {
  tier: SubscriptionTier;
  isSubscribed: boolean;
  hasAdFree: boolean;
  hasAudioAccess: boolean;
  hasUnlimitedSaves: boolean;
  hasCommunityAccess: boolean;
  hasExclusiveContent: boolean;
  maxSaves: number;
  upgradeTier: (newTier: Exclude<SubscriptionTier, "free">) => Promise<void>;
  cancelSubscription: () => Promise<void>;
}

const MOCK_PREMIUM = isMockPremium;

const TIER_FEATURES = {
  free: {
    isSubscribed: false,
    hasAdFree: false,
    hasAudioAccess: false,
    hasUnlimitedSaves: false,
    hasCommunityAccess: false,
    hasExclusiveContent: false,
    maxSaves: 10,
  },
  basic: {
    isSubscribed: true,
    hasAdFree: true,
    hasAudioAccess: false,
    hasUnlimitedSaves: false,
    hasCommunityAccess: false,
    hasExclusiveContent: false,
    maxSaves: 50,
  },
  premium: {
    isSubscribed: true,
    hasAdFree: true,
    hasAudioAccess: true,
    hasUnlimitedSaves: true,
    hasCommunityAccess: true,
    hasExclusiveContent: true,
    maxSaves: Infinity,
  },
  lifetime: {
    isSubscribed: true,
    hasAdFree: true,
    hasAudioAccess: true,
    hasUnlimitedSaves: true,
    hasCommunityAccess: true,
    hasExclusiveContent: true,
    maxSaves: Infinity,
  },
} as const;

const SubscriptionContext = createContext<SubscriptionContextType | undefined>(undefined);

export function SubscriptionProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const { isAuthenticated, user } = useAuth();
  const [localTier, setLocalTier] = useState<SubscriptionTier>("free");

  const { data: entitlement } = useQuery({
    queryKey: queryKeys.entitlements.all,
    queryFn: fetchEntitlement,
    enabled: isAuthenticated && !MOCK_PREMIUM,
    staleTime: 10 * 60 * 1000,
  });

  useEffect(() => {
    if (MOCK_PREMIUM) {
      setLocalTier("premium");
    } else if (entitlement) {
      setLocalTier(entitlement.effectiveTier);
    } else if (!isAuthenticated) {
      setLocalTier("free");
    }
  }, [entitlement, isAuthenticated]);

  const tier = MOCK_PREMIUM ? "premium" : localTier;
  const features = TIER_FEATURES[tier];

  const value = useMemo(
    () => ({
      tier,
      ...features,
      upgradeTier: async (newTier: Exclude<SubscriptionTier, "free">) => {
        if (MOCK_PREMIUM || isMockBackend) {
          setLocalTier(newTier);
          return;
        }

        const checkout = await createCheckout(newTier);

        if (checkout.provider === "stripe") {
          window.location.assign(checkout.url);
          return;
        }

        if (checkout.mode === "subscription" && checkout.subscriptionId) {
          const { openRazorpayCheckout } = await import("../../lib/razorpay-checkout");
          const { verifyRazorpayCheckout } = await import("../../services/mobile-api");
          await openRazorpayCheckout(checkout, async (response) => {
            await verifyRazorpayCheckout({
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              razorpay_order_id: response.razorpay_order_id,
              razorpay_subscription_id: response.razorpay_subscription_id,
            });
            await queryClient.invalidateQueries({ queryKey: queryKeys.entitlements.all });
          });
          return;
        }

        const order = await createRazorpayOrder({ tier: newTier });
        const payment = await openStandardRazorpayCheckout({
          keyId: order.key_id,
          orderId: order.order_id,
          amount: order.amount,
          currency: order.currency,
          name: "The Curator",
          description: `${newTier} membership`,
          prefill: {
            email: user?.email,
            name: user?.name,
          },
        });

        const verified = await verifyRazorpayPayment({
          razorpay_order_id: payment.razorpay_order_id,
          razorpay_payment_id: payment.razorpay_payment_id,
          razorpay_signature: payment.razorpay_signature,
        });

        if (!verified.success) {
          throw new Error("Payment verification failed.");
        }

        await queryClient.invalidateQueries({ queryKey: queryKeys.entitlements.all });
      },
      cancelSubscription: async () => {
        if (MOCK_PREMIUM || isMockBackend) {
          setLocalTier("free");
          return;
        }

        const portal = await createBillingPortal();
        if (portal.provider === "stripe") {
          window.location.assign(portal.url);
          return;
        }

        await queryClient.invalidateQueries({ queryKey: queryKeys.entitlements.all });
      },
    }),
    [tier, features, queryClient, user?.email, user?.name],
  );

  return <SubscriptionContext.Provider value={value}>{children}</SubscriptionContext.Provider>;
}

export function useSubscription() {
  const context = useContext(SubscriptionContext);
  if (context === undefined) {
    throw new Error("useSubscription must be used within a SubscriptionProvider");
  }
  return context;
}
