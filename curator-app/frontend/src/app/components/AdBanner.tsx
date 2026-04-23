import { X, ExternalLink } from 'lucide-react';
import { useState } from 'react';
import { useSubscription } from '../context/SubscriptionContext';
import { useNavigate } from 'react-router';

interface AdBannerProps {
  position?: 'top' | 'bottom' | 'inline';
}

const adContent = [
  {
    title: 'Premium News Experience',
    description: 'Remove ads and unlock exclusive features',
    cta: 'Upgrade Now',
    internal: true,
    link: '/donate',
  },
  {
    title: 'Sustainable Coffee Co.',
    description: 'Direct trade, carbon-neutral delivery',
    cta: 'Shop Now',
    internal: false,
    link: '#',
  },
  {
    title: 'Master Class Online',
    description: 'Learn from world-class experts',
    cta: 'Start Free Trial',
    internal: false,
    link: '#',
  },
];

export function AdBanner({ position = 'inline' }: AdBannerProps) {
  const { hasAdFree } = useSubscription();
  const navigate = useNavigate();
  const [isVisible, setIsVisible] = useState(true);
  const [currentAd] = useState(adContent[Math.floor(Math.random() * adContent.length)]);
  
  // Don't show ads if user has ad-free subscription
  if (hasAdFree || !isVisible) {
    return null;
  }
  
  const handleClick = () => {
    if (currentAd.internal) {
      navigate(currentAd.link);
    }
  };
  
  return (
    <div className={`relative ${
      position === 'top' ? 'mb-6' : position === 'bottom' ? 'mt-6' : 'my-6'
    }`}>
      <div className="bg-gradient-to-r from-secondary-container to-tertiary-container border border-outline-variant/30 rounded-[30px] p-4 md:p-6 flex items-center justify-between gap-4 shadow-lg">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[8px] uppercase tracking-widest text-outline bg-surface-container-low px-2 py-0.5 rounded-full">
              Advertisement
            </span>
          </div>
          <h3 className="font-[family-name:var(--font-headline)] text-xl text-on-surface mb-1">
            {currentAd.title}
          </h3>
          <p className="text-sm text-on-surface-variant mb-3">
            {currentAd.description}
          </p>
          <button 
            onClick={handleClick}
            className="bg-inverse-surface text-white px-6 py-2 rounded-full text-sm hover:bg-primary transition-all inline-flex items-center gap-2"
          >
            {currentAd.cta}
            {!currentAd.internal && <ExternalLink className="w-4 h-4" />}
          </button>
        </div>
        
        <button 
          onClick={() => setIsVisible(false)}
          className="w-8 h-8 rounded-full hover:bg-surface-container flex items-center justify-center transition-colors shrink-0"
          aria-label="Close ad"
        >
          <X className="w-4 h-4 text-outline" />
        </button>
      </div>
    </div>
  );
}
