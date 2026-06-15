import { Play, Pause, SkipForward, SkipBack, X, Gauge } from 'lucide-react';
import { useAudio } from '../context/AudioContext';
import { useState } from 'react';
import { useLayout } from '../../providers/layout-provider';

export function AudioMiniPlayer() {
  const { audioState, pauseBrief, resumeBrief, skipForward, skipBackward, setSpeed, stopBrief } = useAudio();
  const { isWebDesktop, sidebarWidth } = useLayout();
  const [showSpeedMenu, setShowSpeedMenu] = useState(false);
  
  if (!audioState.currentBriefId) return null;
  
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };
  
  const progressPercent = audioState.duration > 0 
    ? (audioState.currentTime / audioState.duration) * 100 
    : 0;
  
  const speeds = [0.5, 0.75, 1.0, 1.25, 1.5, 2.0];
  
  return (
    <div
      className="fixed bottom-24 left-0 right-0 z-40 animate-slide-up px-4 lg:bottom-6"
      style={isWebDesktop ? { left: sidebarWidth } : undefined}
    >
      <div 
        className="mx-auto max-w-2xl overflow-hidden rounded-full border border-outline-variant/25 bg-surface-container-lowest/95 shadow-2xl backdrop-blur-2xl"
      >
        {/* Progress Bar */}
        <div className="relative h-1 bg-surface-container-high">
          <div 
            className="absolute top-0 left-0 h-full bg-gradient-to-r from-primary via-secondary to-tertiary transition-all"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
        
        <div className="flex items-center gap-3 px-4 py-3 sm:gap-4">
          {/* Waveform Icon Placeholder */}
          <div className="hidden h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-primary to-secondary sm:flex">
            <div className="flex gap-0.5">
              <div className="w-0.5 h-3 bg-white rounded-full animate-pulse" style={{ animationDelay: '0ms' }} />
              <div className="w-0.5 h-5 bg-white rounded-full animate-pulse" style={{ animationDelay: '150ms' }} />
              <div className="w-0.5 h-4 bg-white rounded-full animate-pulse" style={{ animationDelay: '300ms' }} />
              <div className="w-0.5 h-6 bg-white rounded-full animate-pulse" style={{ animationDelay: '450ms' }} />
            </div>
          </div>
          
          {/* Info */}
          <div className="flex-1 min-w-0">
            <p className="text-on-surface font-medium truncate text-sm">
              Daily Audio Brief
            </p>
            <p className="text-outline text-xs">
              {formatTime(audioState.currentTime)} / {formatTime(audioState.duration)}
            </p>
          </div>
          
          {/* Controls */}
          <div className="flex items-center gap-0.5 sm:gap-1">
            {/* Skip Back */}
            <button
              onClick={skipBackward}
              className="w-9 h-9 rounded-full hover:bg-surface-container flex items-center justify-center transition-colors"
              aria-label="Skip back 15 seconds"
            >
              <SkipBack className="w-4 h-4 text-on-surface" />
            </button>
            
            {/* Play/Pause */}
            <button
              onClick={audioState.isPlaying ? pauseBrief : resumeBrief}
              className="w-11 h-11 rounded-full bg-primary hover:bg-primary/90 flex items-center justify-center transition-all active-press"
              aria-label={audioState.isPlaying ? 'Pause' : 'Play'}
            >
              {audioState.isPlaying ? (
                <Pause className="w-5 h-5 text-primary-foreground" fill="currentColor" />
              ) : (
                <Play className="w-5 h-5 text-primary-foreground" fill="currentColor" />
              )}
            </button>
            
            {/* Skip Forward */}
            <button
              onClick={skipForward}
              className="w-9 h-9 rounded-full hover:bg-surface-container flex items-center justify-center transition-colors"
              aria-label="Skip forward 15 seconds"
            >
              <SkipForward className="w-4 h-4 text-on-surface" />
            </button>
            
            {/* Speed Control */}
            <div className="relative">
              <button
                onClick={() => setShowSpeedMenu(!showSpeedMenu)}
                className="w-9 h-9 rounded-full hover:bg-surface-container flex items-center justify-center transition-colors relative"
                aria-label="Playback speed"
              >
                <Gauge className="w-4 h-4 text-on-surface" />
                <span className="absolute -bottom-1 text-[9px] font-bold text-on-surface">
                  {audioState.playbackSpeed}x
                </span>
              </button>
              
              {/* Speed Menu */}
              {showSpeedMenu && (
                <div 
                  className="absolute bottom-full right-0 mb-2 rounded-2xl border border-outline-variant/30 bg-surface-container-lowest p-2 shadow-xl animate-scale-in"
                  style={{ minWidth: '80px' }}
                >
                  {speeds.map(speed => (
                    <button
                      key={speed}
                      onClick={() => {
                        setSpeed(speed);
                        setShowSpeedMenu(false);
                      }}
                      className={`w-full px-3 py-2 rounded-lg text-sm transition-colors ${
                        audioState.playbackSpeed === speed
                          ? 'bg-primary text-primary-foreground'
                          : 'hover:bg-surface-container text-on-surface'
                      }`}
                    >
                      {speed}x
                    </button>
                  ))}
                </div>
              )}
            </div>
            
            {/* Close */}
            <button
              onClick={stopBrief}
              className="w-9 h-9 rounded-full hover:bg-surface-container flex items-center justify-center transition-colors ml-1"
              aria-label="Close player"
            >
              <X className="w-4 h-4 text-on-surface" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
