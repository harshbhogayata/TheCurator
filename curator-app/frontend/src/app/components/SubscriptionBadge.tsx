import { Crown, Sparkles, Star } from 'lucide-react';
import { useSubscription, type SubscriptionTier } from '../context/SubscriptionContext';

interface SubscriptionBadgeProps {
  tier?: SubscriptionTier;
  size?: 'sm' | 'md' | 'lg';
}

export function SubscriptionBadge({ tier: propTier, size = 'md' }: SubscriptionBadgeProps) {
  const { tier: contextTier } = useSubscription();
  const tier = propTier || contextTier;
  
  if (tier === 'free') return null;
  
  const config = {
    basic: {
      icon: Sparkles,
      label: 'Basic',
      bgColor: 'bg-primary-container',
      textColor: 'text-on-primary-container',
    },
    premium: {
      icon: Crown,
      label: 'Premium',
      bgColor: 'bg-secondary-container',
      textColor: 'text-on-secondary-container',
    },
    lifetime: {
      icon: Star,
      label: 'Lifetime',
      bgColor: 'bg-tertiary-container',
      textColor: 'text-on-tertiary-container',
    },
  };
  
  const info = config[tier];
  const Icon = info.icon;
  
  const sizeClasses = {
    sm: 'px-2 py-1 text-[9px] gap-1',
    md: 'px-3 py-1.5 text-[10px] gap-1.5',
    lg: 'px-4 py-2 text-xs gap-2',
  };
  
  const iconSizes = {
    sm: 'w-3 h-3',
    md: 'w-3.5 h-3.5',
    lg: 'w-4 h-4',
  };
  
  return (
    <div className={`inline-flex items-center ${sizeClasses[size]} ${info.bgColor} ${info.textColor} rounded-full uppercase tracking-widest font-medium`}>
      <Icon className={iconSizes[size]} />
      <span>{info.label}</span>
    </div>
  );
}
