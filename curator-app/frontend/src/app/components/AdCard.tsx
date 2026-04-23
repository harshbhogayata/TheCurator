import { ExternalLink } from 'lucide-react';
import { useSubscription } from '../context/SubscriptionContext';
import { useNavigate } from 'react-router';
import { ImageWithFallback } from './figma/ImageWithFallback';

export function AdCard() {
  const { hasAdFree } = useSubscription();
  const navigate = useNavigate();
  
  // Don't show ads if user has ad-free subscription
  if (hasAdFree) {
    return null;
  }
  
  return (
    <div className="bg-gradient-to-br from-tertiary-container to-secondary-container border-2 border-outline-variant/30 rounded-[40px] overflow-hidden shadow-xl">
      <div className="relative h-48">
        <ImageWithFallback 
          className="w-full h-full object-cover opacity-80" 
          alt="Sponsored content" 
          query="luxury product elegant design"
        />
        <div className="absolute top-4 left-4 bg-surface-container-lowest/90 backdrop-blur-sm px-3 py-1 rounded-full">
          <span className="text-[8px] uppercase tracking-widest text-outline">
            Sponsored
          </span>
        </div>
      </div>
      
      <div className="p-6">
        <h3 className="font-[family-name:var(--font-headline)] text-2xl text-on-surface mb-2">
          Discover Premium Features
        </h3>
        <p className="text-on-surface-variant mb-4">
          Remove ads and unlock exclusive content with a subscription.
        </p>
        <button 
          onClick={() => navigate('/donate')}
          className="w-full bg-inverse-surface text-white py-3 px-6 rounded-full hover:bg-primary transition-all flex items-center justify-center gap-2"
        >
          Learn More
          <ExternalLink className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
