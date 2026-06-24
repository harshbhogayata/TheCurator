import {
  createContext,
  type PropsWithChildren,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";
import { useRouter } from "expo-router";

import { PaywallModal } from "../ui/paywall-modal";
import type { SubscriptionTier } from "./subscription-provider";

interface UpgradeRequest {
  featureName: string;
  requiredTier: SubscriptionTier;
}

interface UpgradeGateContextValue {
  requestUpgrade: (request: UpgradeRequest) => void;
}

const UpgradeGateContext = createContext<UpgradeGateContextValue | null>(null);

export function UpgradeGateProvider({ children }: PropsWithChildren) {
  const router = useRouter();
  const [request, setRequest] = useState<UpgradeRequest | null>(null);

  const requestUpgrade = useCallback((next: UpgradeRequest) => {
    setRequest(next);
  }, []);

  const handleClose = useCallback(() => {
    setRequest(null);
  }, []);

  const handleUpgrade = useCallback(() => {
    setRequest(null);
    router.push("/(app)/donate");
  }, [router]);

  const value = useMemo(() => ({ requestUpgrade }), [requestUpgrade]);

  return (
    <UpgradeGateContext.Provider value={value}>
      {children}
      <PaywallModal
        visible={request !== null}
        onClose={handleClose}
        featureName={request?.featureName ?? "this feature"}
        requiredTier={request?.requiredTier ?? "basic"}
        onUpgrade={handleUpgrade}
      />
    </UpgradeGateContext.Provider>
  );
}

export function useUpgradeGate(): UpgradeGateContextValue {
  const context = useContext(UpgradeGateContext);
  if (!context) {
    throw new Error("useUpgradeGate must be used within an UpgradeGateProvider");
  }
  return context;
}
