import { useNavigate } from 'react-router';
import { Home, Search, ArrowLeft } from 'lucide-react';

export function NotFound() {
  const navigate = useNavigate();
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-surface via-background to-surface-container-low flex items-center justify-center px-6">
      <div className="max-w-lg text-center">
        <div className="mb-8">
          <div className="w-32 h-32 mx-auto mb-6 rounded-full bg-surface-container flex items-center justify-center">
            <Search className="w-16 h-16 text-outline" />
          </div>
          <h1 className="font-[family-name:var(--font-headline)] text-6xl italic text-on-surface mb-4">
            404
          </h1>
          <h2 className="font-[family-name:var(--font-headline)] text-3xl text-on-surface mb-3">
            Page Not Found
          </h2>
          <p className="text-on-surface-variant leading-relaxed mb-8">
            The narrative you're seeking has eluded our distillation process. It seems this page doesn't exist in our archives.
          </p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <button
            onClick={() => navigate(-1)}
            className="bg-surface-container hover:bg-surface-container-high text-on-surface px-8 py-4 rounded-full transition-all flex items-center justify-center gap-2"
          >
            <ArrowLeft className="w-5 h-5" />
            Go Back
          </button>
          <button
            onClick={() => navigate('/brief')}
            className="bg-inverse-surface hover:bg-primary text-white px-8 py-4 rounded-full transition-all flex items-center justify-center gap-2"
          >
            <Home className="w-5 h-5" />
            Go Home
          </button>
        </div>
      </div>
    </div>
  );
}
