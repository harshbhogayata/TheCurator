import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";

import { queryKeys } from "../../lib/query-keys";
import { createStripeCheckout, createStripePortal, fetchEntitlement } from "../../services/mobile-api";
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
  /** Starts Stripe checkout (redirects). In mock/dev mode, upgrades locally. */
  upgradeTier: (newTier: Exclude<SubscriptionTier, "free">) => Promise<void>;
  /** Opens the Stripe customer portal (redirects). In mock/dev mode, downgrades locally. */
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
  const { isAuthenticated } = useAuth();
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
        const { url } = await createStripeCheckout(newTier);
        window.location.assign(url);
      },
      cancelSubscription: async () => {
        if (MOCK_PREMIUM || isMockBackend) {
          setLocalTier("free");
          return;
        }
        const { url } = await createStripePortal();
        window.location.assign(url);
      },
    }),
    [tier, features],
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
