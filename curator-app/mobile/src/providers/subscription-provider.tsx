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

import { Platform } from "react-native";
import Purchases, { LOG_LEVEL, type PurchasesPackage } from "react-native-purchases";

import { fetchEntitlement } from "../services/mobile-api";
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
  packages: PurchasesPackage[];
  purchasePackage: (pkg: PurchasesPackage) => Promise<boolean>;
  isPurchasing: boolean;
}

// Set EXPO_PUBLIC_MOCK_PREMIUM=true in .env to unlock premium features locally.
const MOCK_PREMIUM = __DEV__ && process.env.EXPO_PUBLIC_MOCK_PREMIUM === "true";
const MOCK_BACKEND = __DEV__ && process.env.EXPO_PUBLIC_MOCK_BACKEND === "true";

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
  const { status, session } = useAuth();
  const [tier, setTierState] = useState<SubscriptionTier>(MOCK_PREMIUM ? "premium" : "free");
  const [packages, setPackages] = useState<PurchasesPackage[]>([]);
  const [isPurchasing, setIsPurchasing] = useState(false);

  useEffect(() => {
    // Configure RevenueCat
    const apiKey = Platform.select({
      ios: process.env.EXPO_PUBLIC_RC_IOS_KEY,
      android: process.env.EXPO_PUBLIC_RC_ANDROID_KEY,
    });

    if (apiKey && !MOCK_BACKEND) {
      Purchases.setLogLevel(__DEV__ ? LOG_LEVEL.DEBUG : LOG_LEVEL.WARN);
      Purchases.configure({ apiKey });
      
      Purchases.getOfferings().then((offerings) => {
        if (offerings.current !== null && offerings.current.availablePackages.length !== 0) {
          setPackages(offerings.current.availablePackages);
        }
      }).catch(console.error);
    }
  }, []);

  useEffect(() => {
    if (session?.user?.id && !MOCK_BACKEND) {
      void Purchases.logIn(session.user.id);
    } else if (status === "signed-out") {
      void Purchases.logOut();
    }
  }, [session?.user?.id, status]);

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
      if (status === "signed-in") {
        void fetchEntitlement()
          .then((payload) => {
            setTierState(payload.effectiveTier ?? payload.tier);
          })
          .catch(() => {
            setTierState(MOCK_PREMIUM ? "premium" : "free");
          });
      } else {
        setTierState(MOCK_PREMIUM ? "premium" : "free");
      }

      return;
    }

    setTierState(newTier);
  }, [status]);

  const purchasePackage = useCallback(async (pkg: PurchasesPackage) => {
    if (MOCK_BACKEND) return false;
    
    setIsPurchasing(true);
    try {
      const { customerInfo } = await Purchases.purchasePackage(pkg);
      
      // Update local state based on active entitlements
      if (typeof customerInfo.entitlements.active['Premium'] !== "undefined") {
        setTierState("premium");
        return true;
      } else if (typeof customerInfo.entitlements.active['Basic'] !== "undefined") {
        setTierState("basic");
        return true;
      } else if (typeof customerInfo.entitlements.active['Lifetime'] !== "undefined") {
        setTierState("lifetime");
        return true;
      }
      return false;
    } catch (e: any) {
      if (!e.userCancelled) {
        console.error("Purchase error:", e);
      }
      return false;
    } finally {
      setIsPurchasing(false);
    }
  }, []);

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
      packages,
      purchasePackage,
      isPurchasing,
    }),
    [tier, setTier, features, packages, purchasePackage, isPurchasing],
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
