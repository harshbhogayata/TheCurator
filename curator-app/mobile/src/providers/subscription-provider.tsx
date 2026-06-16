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
import Constants from "expo-constants";
import type { PurchasesPackage } from "react-native-purchases";

// Dynamic import to prevent crashes on Web/Expo Go
const Purchases = Platform.OS !== "web" && Constants.appOwnership !== "expo"
  ? require("react-native-purchases").default || require("react-native-purchases")
  : null;

const LOG_LEVEL = Platform.OS !== "web" && Constants.appOwnership !== "expo"
  ? require("react-native-purchases").LOG_LEVEL
  : { DEBUG: 0, INFO: 1, WARN: 2, ERROR: 3 };

import { fetchEntitlement } from "../services/mobile-api";
import {
  createCheckout,
  createRazorpayOrder,
  verifyRazorpayCheckout,
  verifyRazorpayPayment,
} from "../services/billing-api";
import {
  openRazorpayCheckout,
  openStandardRazorpayOrderCheckout,
  openWebDonateCheckout,
  shouldUseWebRazorpayCheckout,
} from "../services/razorpay-checkout";
import { getBillingProvider, usesRazorpayBilling, type BillingProvider } from "../lib/billing-provider";
import { firebaseConfigured, getFirebaseAuth } from "../services/firebase";
import { useAuth } from "./auth-provider";

export type SubscriptionTier = "free" | "basic" | "premium" | "lifetime";

interface SubscriptionContextValue {
  tier: SubscriptionTier;
  setTier: (tier: SubscriptionTier) => void;
  billingProvider: BillingProvider;
  hasAdFree: boolean;
  hasAudioAccess: boolean;
  hasBriefAudioAccess: boolean;
  hasUnlimitedSaves: boolean;
  hasCollections: boolean;
  hasOfflineAccess: boolean;
  hasCustomThemes: boolean;
  maxSaves: number;
  maxCollections: number;
  packages: PurchasesPackage[];
  purchasePackage: (pkg: PurchasesPackage) => Promise<boolean>;
  purchaseTier: (tier: Exclude<SubscriptionTier, "free">) => Promise<boolean>;
  isPurchasing: boolean;
}

// Set EXPO_PUBLIC_MOCK_PREMIUM=true in .env to unlock premium features locally.
const MOCK_PREMIUM = __DEV__ && process.env.EXPO_PUBLIC_MOCK_PREMIUM === "true";
const MOCK_BACKEND = __DEV__ && process.env.EXPO_PUBLIC_MOCK_BACKEND === "true";

const STORAGE_KEY = "curator.subscription-tier";
const RC_ENTITLEMENT_IDS: Record<Exclude<SubscriptionTier, "free">, string[]> = {
  basic: [process.env.EXPO_PUBLIC_RC_BASIC_ENTITLEMENT_ID ?? "Basic", "basic"],
  premium: [process.env.EXPO_PUBLIC_RC_PREMIUM_ENTITLEMENT_ID ?? "Premium", "premium"],
  lifetime: [process.env.EXPO_PUBLIC_RC_LIFETIME_ENTITLEMENT_ID ?? "Lifetime", "lifetime"],
};

const RC_PRODUCT_IDS: Record<Exclude<SubscriptionTier, "free">, string | undefined> = {
  basic: process.env.EXPO_PUBLIC_RC_BASIC_PRODUCT_ID,
  premium: process.env.EXPO_PUBLIC_RC_PREMIUM_PRODUCT_ID,
  lifetime: process.env.EXPO_PUBLIC_RC_LIFETIME_PRODUCT_ID,
};

const TIER_FEATURES: Record<
  SubscriptionTier,
  {
    adFree: boolean;
    audio: boolean;
    briefAudio: boolean;
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
    briefAudio: false,
    unlimitedSaves: false,
    collections: false,
    offline: false,
    customThemes: false,
    maxSaves: 25,
    maxCollections: 3,
  },
  basic: {
    adFree: true,
    audio: false,
    briefAudio: true,
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
    briefAudio: true,
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
    briefAudio: true,
    unlimitedSaves: true,
    collections: true,
    offline: true,
    customThemes: true,
    maxSaves: Infinity,
    maxCollections: Infinity,
  },
};

const TIER_RANK: Record<SubscriptionTier, number> = {
  free: 0,
  basic: 1,
  premium: 2,
  lifetime: 3,
};

function higherTier(a: SubscriptionTier, b: SubscriptionTier): SubscriptionTier {
  return TIER_RANK[a] >= TIER_RANK[b] ? a : b;
}

async function resolveSubscriptionTier(): Promise<SubscriptionTier> {
  let resolved: SubscriptionTier = MOCK_PREMIUM ? "premium" : "free";

  try {
    const payload = await fetchEntitlement();
    resolved = payload.effectiveTier ?? payload.tier;
  } catch {
    // Fall back to RevenueCat or mock defaults below.
  }

  if (!MOCK_BACKEND && Purchases && Platform.OS !== "web" && Constants.appOwnership !== "expo") {
    try {
      const customerInfo = await Purchases.getCustomerInfo();
      resolved = higherTier(resolved, tierFromCustomerInfo(customerInfo));
    } catch {
      // RevenueCat unavailable; keep backend/mock tier.
    }
  }

  return resolved;
}

const SubscriptionContext = createContext<SubscriptionContextValue | null>(null);

function hasRevenueCatEntitlement(customerInfo: any, tier: Exclude<SubscriptionTier, "free">): boolean {
  const active = customerInfo?.entitlements?.active ?? {};
  return RC_ENTITLEMENT_IDS[tier].some((id) => Boolean(active[id]));
}

function tierFromCustomerInfo(customerInfo: any): SubscriptionTier {
  if (hasRevenueCatEntitlement(customerInfo, "lifetime")) return "lifetime";
  if (hasRevenueCatEntitlement(customerInfo, "premium")) return "premium";
  if (hasRevenueCatEntitlement(customerInfo, "basic")) return "basic";
  return "free";
}

function normalizeIdentifier(value?: string | null): string {
  return (value ?? "").trim().toLowerCase();
}

function packageMatchesTier(pkg: PurchasesPackage, tier: Exclude<SubscriptionTier, "free">): boolean {
  const configuredProductId = normalizeIdentifier(RC_PRODUCT_IDS[tier]);
  const identifiers = [
    normalizeIdentifier(pkg.identifier),
    normalizeIdentifier(pkg.product?.identifier),
  ].filter(Boolean);

  if (configuredProductId) {
    return identifiers.includes(configuredProductId);
  }

  return identifiers.some((id) => {
    const tokens = id.replace(/[$.-]/g, "_").split("_").filter(Boolean);
    return tokens.includes(tier);
  });
}

function findPackageForTier(packages: PurchasesPackage[], tier: SubscriptionTier) {
  if (tier === "free") return undefined;
  return packages.find((pkg) => packageMatchesTier(pkg, tier));
}

export function SubscriptionProvider({ children }: PropsWithChildren) {
  const { status, session } = useAuth();
  const [tier, setTierState] = useState<SubscriptionTier>(MOCK_PREMIUM ? "premium" : "free");
  const [packages, setPackages] = useState<PurchasesPackage[]>([]);
  const [isPurchasing, setIsPurchasing] = useState(false);

  const isExpoGo = Constants.appOwnership === "expo";

  useEffect(() => {
    if (usesRazorpayBilling() || isExpoGo || Platform.OS === "web" || !Purchases) {
      if (__DEV__ && usesRazorpayBilling()) {
        console.log("Razorpay billing enabled — skipping RevenueCat configuration.");
      } else if (__DEV__ && (isExpoGo || Platform.OS === "web" || !Purchases)) {
        console.log("Expo Go, web, or missing Purchases native module. Bypassing native RevenueCat configuration.");
      }
      return;
    }

    // Configure RevenueCat
    const apiKey = Platform.select({
      ios: process.env.EXPO_PUBLIC_RC_IOS_KEY,
      android: process.env.EXPO_PUBLIC_RC_ANDROID_KEY,
    });

    let listenerRemove: (() => void) | null = null;

    if (apiKey && !MOCK_BACKEND) {
      try {
        Purchases.setLogLevel(__DEV__ ? LOG_LEVEL.DEBUG : LOG_LEVEL.WARN);
        Purchases.configure({ apiKey });
        
        Purchases.getOfferings().then((offerings: any) => {
          if (offerings.current !== null && offerings.current.availablePackages.length !== 0) {
            setPackages(offerings.current.availablePackages);
          }
        }).catch(console.error);

        // Listen for external customer updates (App Store restorations, renewals, etc.)
        const removeListener = Purchases.addCustomerInfoUpdateListener((customerInfo: any) => {
          setTierState((current) => higherTier(current, tierFromCustomerInfo(customerInfo)));
        });
        listenerRemove = typeof removeListener === "function" ? removeListener : (removeListener as any)?.remove?.bind(removeListener) ?? null;
      } catch (e) {
        console.warn("Failed to initialize RevenueCat Purchases:", e);
      }
    }

    return () => {
      listenerRemove?.();
    };
  }, [isExpoGo]);

  useEffect(() => {
    if (usesRazorpayBilling() || MOCK_BACKEND) {
      return;
    }

    if (Platform.OS !== "web" && !isExpoGo && Purchases) {
      if (session?.user?.id) {
        const appUserId = session.user.firebaseUid ?? (firebaseConfigured ? getFirebaseAuth().currentUser?.uid : null) ?? session.user.id;
        void Purchases.logIn(appUserId).catch(console.error);
      } else if (status === "signed-out") {
        void Purchases.logOut().catch(console.error);
      }
    }
  }, [session?.user?.firebaseUid, session?.user?.id, status, isExpoGo]);

  useEffect(() => {
    if (!MOCK_BACKEND) {
      if (status !== "signed-in") {
        setTierState(MOCK_PREMIUM ? "premium" : "free");
        return;
      }

      let cancelled = false;
      void resolveSubscriptionTier()
        .then((resolved) => {
          if (!cancelled) {
            setTierState(resolved);
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
    setTierState(newTier);
    void AsyncStorage.setItem(STORAGE_KEY, newTier).catch(console.error);
  }, []);

  const purchasePackage = useCallback(async (pkg: PurchasesPackage) => {
    if (MOCK_BACKEND || Platform.OS === "web" || !Purchases) return false;
    
    setIsPurchasing(true);
    try {
      const { customerInfo } = await Purchases.purchasePackage(pkg);
      
      const purchasedTier = tierFromCustomerInfo(customerInfo);
      setTierState((current) => higherTier(current, purchasedTier));
      return purchasedTier !== "free";
    } catch (e: any) {
      if (!e.userCancelled) {
        console.error("Purchase error:", e);
      }
      return false;
    } finally {
      setIsPurchasing(false);
    }
  }, []);

  const purchaseTier = useCallback(async (selectedTier: Exclude<SubscriptionTier, "free">) => {
    if (MOCK_BACKEND) {
      setTierState(selectedTier);
      return true;
    }

    if (!usesRazorpayBilling()) {
      const pkg = findPackageForTier(packages, selectedTier);
      if (!pkg) {
        return false;
      }
      return purchasePackage(pkg);
    }

    setIsPurchasing(true);
    try {
      if (shouldUseWebRazorpayCheckout()) {
        await openWebDonateCheckout(selectedTier);
        const resolved = await resolveSubscriptionTier();
        setTierState(resolved);
        return resolved !== "free";
      }

      const checkout = await createCheckout(selectedTier);
      if (checkout.provider !== "razorpay") {
        throw new Error("Only Razorpay checkout is supported in the mobile app.");
      }

      const runNativeCheckout = async () => {
        if (checkout.mode === "subscription" && checkout.subscriptionId) {
          const response = await openRazorpayCheckout(checkout);
          await verifyRazorpayCheckout({
            razorpay_payment_id: response.razorpay_payment_id,
            razorpay_signature: response.razorpay_signature,
            razorpay_order_id: response.razorpay_order_id,
            razorpay_subscription_id: response.razorpay_subscription_id,
          });
          return;
        }

        if (checkout.mode === "order" && checkout.orderId) {
          const response = await openRazorpayCheckout(checkout);
          await verifyRazorpayCheckout({
            razorpay_payment_id: response.razorpay_payment_id,
            razorpay_signature: response.razorpay_signature,
            razorpay_order_id: response.razorpay_order_id,
          });
          return;
        }

        const order = await createRazorpayOrder({ tier: selectedTier });
        const response = await openStandardRazorpayOrderCheckout({
          keyId: order.key_id,
          orderId: order.order_id,
          amount: order.amount,
          currency: order.currency,
          description: `${selectedTier} membership`,
        });
        const verified = await verifyRazorpayPayment({
          razorpay_order_id: response.razorpay_order_id,
          razorpay_payment_id: response.razorpay_payment_id,
          razorpay_signature: response.razorpay_signature,
        });
        if (!verified.success) {
          throw new Error("Payment verification failed.");
        }
      };

      try {
        await runNativeCheckout();
      } catch (error) {
        const message = error instanceof Error ? error.message : "Payment failed";
        if (message === "Payment cancelled") {
          return false;
        }
        // Native Razorpay may fail on New Architecture — fall back to web checkout.
        await openWebDonateCheckout(selectedTier);
      }

      const resolved = await resolveSubscriptionTier();
      setTierState(resolved);
      return resolved !== "free";
    } finally {
      setIsPurchasing(false);
    }
  }, [isExpoGo, packages, purchasePackage]);

  const features = TIER_FEATURES[tier];

  const value = useMemo<SubscriptionContextValue>(
    () => ({
      tier,
      setTier,
      billingProvider: getBillingProvider(),
      hasAdFree: features.adFree,
      hasAudioAccess: features.audio,
      hasBriefAudioAccess: features.briefAudio,
      hasUnlimitedSaves: features.unlimitedSaves,
      hasCollections: features.collections,
      hasOfflineAccess: features.offline,
      hasCustomThemes: features.customThemes,
      maxSaves: features.maxSaves,
      maxCollections: features.maxCollections,
      packages,
      purchasePackage,
      purchaseTier,
      isPurchasing,
    }),
    [tier, setTier, features, packages, purchasePackage, purchaseTier, isPurchasing],
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
