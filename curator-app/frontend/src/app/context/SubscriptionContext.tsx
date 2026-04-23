import { createContext, useContext, useState, ReactNode, useEffect } from 'react';

export type SubscriptionTier = 'free' | 'basic' | 'premium' | 'lifetime';

interface SubscriptionContextType {
  tier: SubscriptionTier;
  isSubscribed: boolean;
  hasAdFree: boolean;
  hasAudioAccess: boolean;
  hasUnlimitedSaves: boolean;
  hasCommunityAccess: boolean;
  hasExclusiveContent: boolean;
  maxSaves: number;
  upgradeTier: (newTier: SubscriptionTier) => void;
  cancelSubscription: () => void;
}

const SubscriptionContext = createContext<SubscriptionContextType | undefined>(undefined);

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
};

export function SubscriptionProvider({ children }: { children: ReactNode }) {
  const [tier, setTier] = useState<SubscriptionTier>(() => {
    const saved = localStorage.getItem('curator_subscription');
    return saved ? (JSON.parse(saved) as SubscriptionTier) : 'free';
  });
  
  useEffect(() => {
    localStorage.setItem('curator_subscription', JSON.stringify(tier));
  }, [tier]);
  
  const features = TIER_FEATURES[tier];
  
  const upgradeTier = (newTier: SubscriptionTier) => {
    setTier(newTier);
  };
  
  const cancelSubscription = () => {
    setTier('free');
  };
  
  return (
    <SubscriptionContext.Provider
      value={{
        tier,
        ...features,
        upgradeTier,
        cancelSubscription,
      }}
    >
      {children}
    </SubscriptionContext.Provider>
  );
}

export function useSubscription() {
  const context = useContext(SubscriptionContext);
  if (context === undefined) {
    throw new Error('useSubscription must be used within a SubscriptionProvider');
  }
  return context;
}