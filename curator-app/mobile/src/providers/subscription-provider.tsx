import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  createContext,
  type PropsWithChildren,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

import { fetchEntitlement, updateEntitlementTier } from "../services/mobile-api";
import { useAuth } from "./auth-provider";

export type SubscriptionTier = "free" | "basic" | "premium" | "lifetime";

interface SubscriptionContextValue {
  tier: SubscriptionTier;
  setTier: (tier: SubscriptionTier) => void;
  hasAdFree: boolean;
  hasAudioAccess: boolean;
  hasUnlimitedSaves: boolean;
  hasCollections: boolean;
  hasOfflineAccess: boolean;
  hasCustomThemes: boolean;
  maxSaves: number;
  maxCollections: number;
}

// Set EXPO_PUBLIC_MOCK_PREMIUM=true in .env to unlock premium features locally.
const MOCK_PREMIUM = process.env.EXPO_PUBLIC_MOCK_PREMIUM === "true";
const MOCK_BACKEND = process.env.EXPO_PUBLIC_MOCK_BACKEND === "true";

const STORAGE_KEY = "curator.subscription-tier";

const TIER_FEATURES: Record<
  SubscriptionTier,
  {
    adFree: boolean;
    audio: boolean;
    unlimitedSaves: boolean;
    collections: boolean;
    offline: boolean;
    customThemes: boolean;
    maxSaves: number;
    maxCollections: number;
  }
> = {
  free: {
    adFree: false,
    audio: false,
    unlimitedSaves: false,
    collections: false,
    offline: false,
    customThemes: false,
    maxSaves: 25,
    maxCollections: 3,
  },
  basic: {
    adFree: true,
    audio: true,
    unlimitedSaves: false,
    collections: true,
    offline: false,
    customThemes: false,
    maxSaves: 100,
    maxCollections: 10,
  },
  premium: {
    adFree: true,
    audio: true,
    unlimitedSaves: true,
    collections: true,
    offline: true,
    customThemes: true,
    maxSaves: Infinity,
    maxCollections: Infinity,
  },
  lifetime: {
    adFree: true,
    audio: true,
    unlimitedSaves: true,
    collections: true,
    offline: true,
    customThemes: true,
    maxSaves: Infinity,
    maxCollections: Infinity,
  },
};

const SubscriptionContext = createContext<SubscriptionContextValue | null>(null);

export function SubscriptionProvider({ children }: PropsWithChildren) {
  const { status } = useAuth();
  const [tier, setTierState] = useState<SubscriptionTier>(MOCK_PREMIUM ? "premium" : "free");

  useEffect(() => {
    if (!MOCK_BACKEND) {
      if (status !== "signed-in") {
        setTierState(MOCK_PREMIUM ? "premium" : "free");
        return;
      }

      let cancelled = false;
      void fetchEntitlement()
        .then((payload) => {
          if (!cancelled) {
            setTierState(payload.effectiveTier ?? payload.tier);
          }
        })
        .catch(() => {
          if (!cancelled) {
            setTierState(MOCK_PREMIUM ? "premium" : "free");
          }
        });

      return () => {
        cancelled = true;
      };
    }

    let cancelled = false;
    AsyncStorage.getItem(STORAGE_KEY).then((value) => {
      if (!cancelled && value) {
        setTierState(value as SubscriptionTier);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [status]);

  const setTier = useCallback((newTier: SubscriptionTier) => {
    if (!MOCK_BACKEND) {
      if (status !== "signed-in") {
        setTierState(newTier);
        return;
      }

      const previous = tier;
      setTierState(newTier);
      void updateEntitlementTier(newTier)
        .then((payload) => {
          setTierState(payload.effectiveTier ?? payload.tier);
        })
        .catch(() => {
          setTierState(previous);
        });
      return;
    }

    setTierState(newTier);
    void AsyncStorage.setItem(STORAGE_KEY, newTier);
  }, [status, tier]);

  const features = TIER_FEATURES[tier];

  const value = useMemo<SubscriptionContextValue>(
    () => ({
      tier,
      setTier,
      hasAdFree: features.adFree,
      hasAudioAccess: features.audio,
      hasUnlimitedSaves: features.unlimitedSaves,
      hasCollections: features.collections,
      hasOfflineAccess: features.offline,
      hasCustomThemes: features.customThemes,
      maxSaves: features.maxSaves,
      maxCollections: features.maxCollections,
    }),
    [tier, setTier, features],
  );

  return (
    <SubscriptionContext.Provider value={value}>
      {children}
    </SubscriptionContext.Provider>
  );
}

export function useSubscription(): SubscriptionContextValue {
  const context = useContext(SubscriptionContext);
  if (!context) {
    throw new Error("useSubscription must be used within a SubscriptionProvider");
  }
  return context;
}
