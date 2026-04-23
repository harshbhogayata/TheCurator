import { X, Lock, Crown, Sparkles, Star } from 'lucide-react';
import { useNavigate } from 'react-router';
import { useSubscription } from '../context/SubscriptionContext';

interface PaywallModalProps {
  isOpen: boolean;
  onClose: () => void;
  feature: string;
  description: string;
  requiredTier?: 'basic' | 'premium' | 'lifetime';
}

export function PaywallModal({ 
  isOpen, 
  onClose, 
  feature, 
  description,
  requiredTier = 'basic' 
}: PaywallModalProps) {
  const navigate = useNavigate();
  const { tier } = useSubscription();
  
  if (!isOpen) return null;
  
  const tierInfo = {
    basic: { icon: Sparkles, name: 'Basic', price: '$5/mo', color: 'text-primary' },
    premium: { icon: Crown, name: 'Premium', price: '$15/mo', color: 'text-secondary' },
    lifetime: { icon: Star, name: 'Lifetime', price: '$299', color: 'text-tertiary' },
  };
  
  const info = tierInfo[requiredTier];
  const Icon = info.icon;
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-inverse-surface/50 backdrop-blur-sm">
      <div className="bg-surface-container-lowest rounded-[40px] border border-outline-variant/15 shadow-2xl max-w-md w-full p-8 relative">
        <button 
          onClick={onClose}
          className="absolute top-6 right-6 w-8 h-8 rounded-full hover:bg-surface-container flex items-center justify-center transition-colors"
        >
          <X className="w-5 h-5 text-outline" />
        </button>
        
        <div className="flex flex-col items-center text-center mb-6">
          <div className="w-20 h-20 rounded-full bg-primary-container flex items-center justify-center mb-4">
            <Lock className="w-10 h-10 text-on-primary-container" />
          </div>
          
          <h2 className="font-[family-name:var(--font-headline)] text-3xl text-on-surface mb-2">
            {feature}
          </h2>
          
          <p className="text-on-surface-variant leading-relaxed mb-4">
            {description}
          </p>
          
          <div className="inline-flex items-center gap-2 bg-surface-container px-4 py-2 rounded-full">
            <Icon className={`w-5 h-5 ${info.color}`} />
            <span className="text-sm text-on-surface">
              Requires <strong>{info.name}</strong> tier ({info.price})
            </span>
          </div>
        </div>
        
        <div className="flex flex-col gap-3">
          <button
            onClick={() => {
              onClose();
              navigate('/donate');
            }}
            className="w-full bg-inverse-surface text-white py-4 px-6 rounded-full transition-all hover:bg-primary shadow-lg"
          >
            Upgrade Now
          </button>
          
          <button
            onClick={onClose}
            className="w-full bg-surface-container hover:bg-surface-container-high text-on-surface py-4 px-6 rounded-full transition-all"
          >
            Maybe Later
          </button>
        </div>
        
        <p className="text-center text-xs text-outline mt-4">
          Ad-free experience • Audio versions • Unlimited saves
        </p>
      </div>
    </div>
  );
}