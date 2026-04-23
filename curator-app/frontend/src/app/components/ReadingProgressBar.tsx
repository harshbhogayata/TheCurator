import { useEffect, useState } from 'react';

export function ReadingProgressBar() {
  const [progress, setProgress] = useState(0);
  
  useEffect(() => {
    const calculateProgress = () => {
      const windowHeight = window.innerHeight;
      const documentHeight = document.documentElement.scrollHeight;
      const scrollTop = window.scrollY;
      
      const totalScroll = documentHeight - windowHeight;
      const currentProgress = (scrollTop / totalScroll) * 100;
      
      setProgress(Math.min(100, Math.max(0, currentProgress)));
    };
    
    calculateProgress();
    window.addEventListener('scroll', calculateProgress, { passive: true });
    
    return () => window.removeEventListener('scroll', calculateProgress);
  }, []);
  
  return (
    <div className="fixed top-0 left-0 right-0 z-[60] h-1 bg-surface-container-high/30">
      <div 
        className="h-full bg-gradient-to-r from-primary via-secondary to-tertiary transition-all duration-150 ease-out"
        style={{ width: `${progress}%` }}
      />
    </div>
  );
}
