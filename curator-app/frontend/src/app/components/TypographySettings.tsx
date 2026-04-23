import { Type, AlignLeft } from 'lucide-react';
import { useReadingPreferences } from '../context/ReadingPreferencesContext';

interface TypographySettingsProps {
  isOpen: boolean;
  onClose: () => void;
}

export function TypographySettings({ isOpen, onClose }: TypographySettingsProps) {
  const { preferences, setFontSize, setReadingWidth } = useReadingPreferences();
  
  if (!isOpen) return null;
  
  return (
    <div 
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center z-[100] p-0 sm:p-6 animate-fade-in"
      onClick={onClose}
    >
      <div 
        className="bg-surface-container-lowest p-8 w-full sm:max-w-md sm:w-full shadow-2xl rounded-t-[40px] sm:rounded-[40px] animate-slide-up"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="font-[family-name:var(--font-headline)] text-3xl text-on-surface mb-3 text-center">
          Reading Settings
        </h3>
        <p className="text-outline text-center mb-8">
          Customize your reading experience
        </p>
        
        {/* Font Size */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <Type className="w-5 h-5 text-on-surface" />
            <h4 className="font-medium text-on-surface">Font Size</h4>
          </div>
          <div className="grid grid-cols-3 gap-3">
            {(['small', 'medium', 'large'] as const).map((size) => (
              <button
                key={size}
                onClick={() => setFontSize(size)}
                className={`p-4 rounded-2xl border-2 transition-all ${
                  preferences.fontSize === size
                    ? 'bg-primary border-primary'
                    : 'bg-surface-container border-outline-variant/20 hover:border-primary/50'
                }`}
              >
                <div className={`font-medium capitalize ${
                  preferences.fontSize === size ? 'text-primary-foreground' : 'text-on-surface'
                }`}>
                  {size}
                </div>
                <div className={`mt-1 ${
                  size === 'small' ? 'text-xs' : size === 'large' ? 'text-lg' : 'text-sm'
                } ${preferences.fontSize === size ? 'text-primary-foreground/80' : 'text-outline'}`}>
                  Aa
                </div>
              </button>
            ))}
          </div>
        </div>
        
        {/* Reading Width */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <AlignLeft className="w-5 h-5 text-on-surface" />
            <h4 className="font-medium text-on-surface">Reading Width</h4>
          </div>
          <div className="grid grid-cols-3 gap-3">
            {(['narrow', 'medium', 'wide'] as const).map((width) => (
              <button
                key={width}
                onClick={() => setReadingWidth(width)}
                className={`p-4 rounded-2xl border-2 transition-all ${
                  preferences.readingWidth === width
                    ? 'bg-primary border-primary'
                    : 'bg-surface-container border-outline-variant/20 hover:border-primary/50'
                }`}
              >
                <div className={`font-medium capitalize ${
                  preferences.readingWidth === width ? 'text-primary-foreground' : 'text-on-surface'
                }`}>
                  {width}
                </div>
                <div className="mt-2 flex justify-center">
                  <div className={`h-2 rounded-full ${
                    preferences.readingWidth === width ? 'bg-primary-foreground' : 'bg-outline'
                  } ${
                    width === 'narrow' ? 'w-8' : width === 'wide' ? 'w-16' : 'w-12'
                  }`} />
                </div>
              </button>
            ))}
          </div>
        </div>
        
        <button
          onClick={onClose}
          className="w-full bg-surface-container hover:bg-surface-container-high text-on-surface py-4 px-6 rounded-full transition-all"
        >
          Done
        </button>
      </div>
    </div>
  );
}
