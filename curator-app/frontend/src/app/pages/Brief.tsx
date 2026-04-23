import { useState, useEffect, useRef } from 'react';
import { Menu, Play, Pause, Volume2, VolumeX, Download, Share2, Sparkles, Lock, SkipBack, SkipForward } from 'lucide-react';
import { BottomNav } from '../components/BottomNav';
import { AdBanner } from '../components/AdBanner';
import { PaywallModal } from '../components/PaywallModal';
import { SubscriptionBadge } from '../components/SubscriptionBadge';
import { useNavigate } from 'react-router';
import { useAuth } from '../context/AuthContext';
import { useSubscription } from '../context/SubscriptionContext';
import { useToast } from '../components/Toast';
import { IMAGES } from '../constants/images';

interface BriefItem {
  id: string;
  title: string;
  duration: string;
  durationSeconds: number;
  category: string;
  imageUrl: string;
  insights: number;
  audioUrl: string;
  date: string;
}

const dailyBriefs: BriefItem[] = [
  {
    id: '1',
    title: 'Your morning distillation: 8 vital insights for Wednesday',
    duration: '12 min',
    durationSeconds: 720,
    category: 'Daily Brief',
    imageUrl: IMAGES.briefs.morning,
    insights: 8,
    audioUrl: 'https://www2.cs.uic.edu/~i101/SoundFiles/BabyElephantWalk60.wav',
    date: 'Today'
  },
  {
    id: '2',
    title: 'Technology Week in Review: AI governance and quantum breakthroughs',
    duration: '15 min',
    durationSeconds: 900,
    category: 'Weekly Tech',
    imageUrl: IMAGES.briefs.tech,
    insights: 12,
    audioUrl: 'https://www2.cs.uic.edu/~i101/SoundFiles/PinkPanther30.wav',
    date: 'Yesterday'
  },
  {
    id: '3',
    title: 'Climate Action Digest: Policy shifts across three continents',
    duration: '10 min',
    durationSeconds: 600,
    category: 'Climate Focus',
    imageUrl: IMAGES.briefs.climate,
    insights: 6,
    audioUrl: 'https://www2.cs.uic.edu/~i101/SoundFiles/StarWars60.wav',
    date: '2 days ago'
  },
  {
    id: '4',
    title: 'Economic Indicators: Markets respond to central bank signals',
    duration: '8 min',
    durationSeconds: 480,
    category: 'Markets',
    imageUrl: IMAGES.briefs.markets,
    insights: 5,
    audioUrl: 'https://www2.cs.uic.edu/~i101/SoundFiles/CantinaBand3.wav',
    date: '3 days ago'
  },
];

export function Brief() {
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();
  const { hasAdFree, hasAudioAccess } = useSubscription();
  const { success, error: showError } = useToast();
  
  // Audio state
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(0.7);
  const [isMuted, setIsMuted] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [showPaywall, setShowPaywall] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>('1'); // Featured is expanded by default
  
  const audioRef = useRef<HTMLAudioElement | null>(null);
  
  // Auth guard
  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/', { replace: true });
    }
  }, [isAuthenticated, navigate]);
  
  // Initialize audio element
  useEffect(() => {
    audioRef.current = new Audio();
    
    const audio = audioRef.current;
    
    // Event listeners
    const handleTimeUpdate = () => {
      setCurrentTime(audio.currentTime);
    };
    
    const handleLoadedMetadata = () => {
      setDuration(audio.duration);
    };
    
    const handleEnded = () => {
      setPlayingId(null);
      setCurrentTime(0);
      // Auto-play next brief
      const currentIndex = dailyBriefs.findIndex(b => b.id === playingId);
      if (currentIndex >= 0 && currentIndex < dailyBriefs.length - 1) {
        handlePlay(dailyBriefs[currentIndex + 1].id);
      }
    };
    
    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('ended', handleEnded);
    
    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('ended', handleEnded);
      audio.pause();
    };
  }, []);
  
  // Update volume
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
    }
  }, [volume]);
  
  // Update mute
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.muted = isMuted;
    }
  }, [isMuted]);
  
  // Update playback rate
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.playbackRate = playbackRate;
    }
  }, [playbackRate]);
  
  if (!isAuthenticated) {
    return null;
  }
  
  const handlePlay = (id: string) => {
    if (!hasAudioAccess) {
      setShowPaywall(true);
      return;
    }
    
    const brief = dailyBriefs.find(b => b.id === id);
    if (!brief) return;
    
    if (audioRef.current) {
      if (playingId === id) {
        // Pause current
        audioRef.current.pause();
        setPlayingId(null);
      } else {
        // Play new
        if (playingId) {
          // Stop current first
          audioRef.current.pause();
        }
        audioRef.current.src = brief.audioUrl;
        audioRef.current.play().catch((err) => {
          console.error('Playback error:', err);
          showError('Could not play audio');
        });
        setPlayingId(id);
        setExpandedId(id);
      }
    }
  };
  
  const handleSeek = (time: number) => {
    if (audioRef.current) {
      audioRef.current.currentTime = time;
      setCurrentTime(time);
    }
  };
  
  const handleSkip = (seconds: number) => {
    if (audioRef.current) {
      audioRef.current.currentTime = Math.max(0, Math.min(duration, audioRef.current.currentTime + seconds));
    }
  };
  
  const handleDownload = (brief: BriefItem) => {
    if (!hasAudioAccess) {
      setShowPaywall(true);
      return;
    }
    success(`Downloading "${brief.title}"`);
    // In real app: window.open(brief.audioUrl, '_blank');
  };
  
  const handleShare = (brief: BriefItem) => {
    if (navigator.share) {
      navigator.share({
        title: brief.title,
        text: `Listen to: ${brief.title}`,
        url: window.location.href
      }).catch(() => {
        navigator.clipboard.writeText(window.location.href);
        success('Link copied to clipboard');
      });
    } else {
      navigator.clipboard.writeText(window.location.href);
      success('Link copied to clipboard');
    }
  };
  
  const toggleMute = () => {
    setIsMuted(!isMuted);
  };
  
  const formatTime = (seconds: number) => {
    if (!seconds || isNaN(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };
  
  const cycleSpeed = () => {
    const speeds = [1, 1.25, 1.5, 1.75, 2];
    const currentIndex = speeds.indexOf(playbackRate);
    const nextIndex = (currentIndex + 1) % speeds.length;
    setPlaybackRate(speeds[nextIndex]);
  };
  
  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-surface via-background to-surface-container-low pb-32">
      {/* Header */}
      <header className="fixed top-0 w-full z-50 pt-4 sm:pt-6 px-4 sm:px-6">
        <div className="flex justify-between items-center gap-2 sm:gap-3">
          <div className="rounded-full border-2 border-outline-variant/30 bg-surface-container-lowest/80 backdrop-blur-2xl shadow-[0_4px_16px_rgba(0,0,0,0.12)] p-0.5">
            <button 
              onClick={() => navigate('/menu')}
              className="w-9 h-9 sm:w-10 sm:h-10 rounded-full hover:bg-surface-container/40 flex items-center justify-center transition-colors"
            >
              <Menu className="w-5 h-5 text-on-surface" />
            </button>
          </div>
          
          <div className="flex-1 rounded-full border-2 border-outline-variant/30 bg-surface-container-lowest/80 backdrop-blur-2xl shadow-[0_4px_16px_rgba(0,0,0,0.12)] px-4 sm:px-6 py-2 sm:py-2.5 min-w-0">
            <h1 className="text-xl sm:text-2xl font-[family-name:var(--font-headline)] italic tracking-tight text-on-surface text-center truncate">
              Audio Briefs
            </h1>
          </div>
          
          <div className="rounded-full border-2 border-outline-variant/30 bg-surface-container-lowest/80 backdrop-blur-2xl shadow-[0_4px_16px_rgba(0,0,0,0.12)] px-3 sm:px-4 py-2 flex items-center gap-2 sm:gap-3">
            <SubscriptionBadge size="sm" />
            <div 
              className="w-8 h-8 rounded-full overflow-hidden border border-outline-variant/15 cursor-pointer shrink-0"
              onClick={() => navigate('/account')}
            >
              <img 
                src={user?.profileImage || IMAGES.profile.main}
                className="w-full h-full object-cover" 
                alt="User profile" 
              />
            </div>
          </div>
        </div>
      </header>
      
      <main className="pt-28 sm:pt-32 px-4 sm:px-6 max-w-4xl mx-auto">
        {/* Ad Banner for free users */}
        {!hasAdFree && <AdBanner position="top" />}
        
        {/* Audio Access Notice for non-subscribers */}
        {!hasAudioAccess && (
          <div className="mb-8 bg-primary-container/50 border-2 border-outline-variant/15 shadow-lg" style={{ borderRadius: '60px 30px 70px 40px', padding: '24px' }}>
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center shrink-0">
                <Lock className="w-6 h-6 text-primary-foreground" />
              </div>
              <div className="flex-1">
                <h3 className="font-[family-name:var(--font-headline)] text-xl text-on-surface mb-2">
                  Unlock Audio Briefs
                </h3>
                <p className="text-on-surface-variant mb-3">
                  Subscribe to Premium tier to listen to audio versions of all articles and briefs.
                </p>
                <button 
                  onClick={() => navigate('/donate')}
                  className="bg-inverse-surface text-inverse-on-surface px-6 py-2 rounded-full text-sm hover:bg-primary transition-all"
                >
                  Upgrade Now
                </button>
              </div>
            </div>
          </div>
        )}
        
        {/* Featured Brief */}
        <section className="mb-12">
          <div className="bg-surface-container-lowest/70 backdrop-blur-2xl border-2 border-outline-variant/15 shadow-xl p-6 sm:p-8" style={{ borderRadius: '80px 40px 100px 60px' }}>
            <div className="flex items-center gap-2 mb-4">
              <Sparkles className="w-5 h-5 text-primary" fill="currentColor" />
              <span className="text-xs uppercase tracking-[0.2em] text-outline">Today's Featured</span>
            </div>
            
            <div className="flex flex-col md:flex-row gap-6 items-center mb-6">
              <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-full overflow-hidden border-4 border-outline-variant/30 shadow-lg shrink-0">
                <img 
                  src={dailyBriefs[0].imageUrl}
                  className="w-full h-full object-cover" 
                  alt="Daily brief cover" 
                />
              </div>
              
              <div className="flex-1 text-center md:text-left min-w-0">
                <h2 className="font-[family-name:var(--font-headline)] text-2xl sm:text-3xl text-on-background leading-tight mb-2">
                  {dailyBriefs[0].title}
                </h2>
                <div className="flex items-center gap-3 sm:gap-4 justify-center md:justify-start text-outline text-sm flex-wrap">
                  <span>{dailyBriefs[0].duration}</span>
                  <span>•</span>
                  <span>{dailyBriefs[0].insights} insights</span>
                  {playbackRate !== 1 && (
                    <>
                      <span>•</span>
                      <span className="text-primary font-medium">{playbackRate}x speed</span>
                    </>
                  )}
                </div>
              </div>
            </div>
            
            {/* Player Controls */}
            <div className="space-y-4">
              {/* Progress Bar */}
              {playingId === dailyBriefs[0].id && hasAudioAccess && (
                <div className="space-y-2">
                  <div className="w-full h-3 bg-surface-container rounded-full overflow-hidden cursor-pointer" onClick={(e) => {
                    const rect = e.currentTarget.getBoundingClientRect();
                    const x = e.clientX - rect.left;
                    const percentage = x / rect.width;
                    handleSeek(percentage * duration);
                  }}>
                    <div 
                      className="h-full bg-gradient-to-r from-primary to-primary-variant transition-all duration-100"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-xs text-outline">
                    <span>{formatTime(currentTime)}</span>
                    <span>{formatTime(duration)}</span>
                  </div>
                </div>
              )}
              
              {/* Primary Controls */}
              <div className="flex items-center justify-center gap-3">
                {/* Skip Back */}
                {hasAudioAccess && playingId === dailyBriefs[0].id && (
                  <button 
                    onClick={() => handleSkip(-15)}
                    className="w-12 h-12 rounded-full bg-surface-container hover:bg-surface-container-high flex items-center justify-center transition-all"
                  >
                    <SkipBack className="w-5 h-5 text-on-surface" />
                  </button>
                )}
                
                {/* Play/Pause */}
                <button 
                  onClick={() => handlePlay(dailyBriefs[0].id)}
                  className="bg-inverse-surface text-inverse-on-surface w-16 h-16 rounded-full flex items-center justify-center transition-transform hover:scale-110 shadow-xl relative"
                >
                  {!hasAudioAccess && (
                    <div className="absolute inset-0 bg-inverse-surface/90 rounded-full flex items-center justify-center">
                      <Lock className="w-6 h-6" />
                    </div>
                  )}
                  {playingId === dailyBriefs[0].id && hasAudioAccess ? (
                    <Pause className="w-7 h-7" fill="currentColor" />
                  ) : (
                    <Play className="w-7 h-7 ml-1" fill="currentColor" />
                  )}
                </button>
                
                {/* Skip Forward */}
                {hasAudioAccess && playingId === dailyBriefs[0].id && (
                  <button 
                    onClick={() => handleSkip(15)}
                    className="w-12 h-12 rounded-full bg-surface-container hover:bg-surface-container-high flex items-center justify-center transition-all"
                  >
                    <SkipForward className="w-5 h-5 text-on-surface" />
                  </button>
                )}
              </div>
              
              {/* Secondary Controls */}
              <div className="overflow-x-auto hide-scrollbar">
                <div className="flex items-center justify-center gap-2 sm:gap-3 min-w-max px-4">
                  {/* Volume */}
                  <div className="flex items-center gap-2 px-3 sm:px-4 py-2 rounded-full bg-surface-container/50">
                    <button 
                      onClick={toggleMute}
                      disabled={!hasAudioAccess}
                      className="disabled:opacity-30 disabled:cursor-not-allowed shrink-0"
                    >
                      {isMuted ? (
                        <VolumeX className="w-4 h-4 sm:w-5 sm:h-5 text-on-surface" />
                      ) : (
                        <Volume2 className="w-4 h-4 sm:w-5 sm:h-5 text-on-surface" />
                      )}
                    </button>
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.01"
                      value={isMuted ? 0 : volume}
                      onChange={(e) => {
                        setVolume(parseFloat(e.target.value));
                        if (isMuted) setIsMuted(false);
                      }}
                      disabled={!hasAudioAccess}
                      className="w-16 sm:w-24 h-2 rounded-full appearance-none cursor-pointer bg-outline/30 disabled:opacity-30 disabled:cursor-not-allowed
                        [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-primary [&::-webkit-slider-thumb]:cursor-pointer
                        [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-primary [&::-moz-range-thumb]:border-0 [&::-moz-range-thumb]:cursor-pointer"
                    />
                  </div>
                  
                  {/* Speed */}
                  <button 
                    onClick={cycleSpeed}
                    disabled={!hasAudioAccess}
                    className="px-3 sm:px-4 py-2 rounded-full bg-surface-container hover:bg-surface-container-high transition-colors disabled:opacity-30 disabled:cursor-not-allowed shrink-0"
                  >
                    <span className="text-sm font-medium text-on-surface">{playbackRate}x</span>
                  </button>
                  
                  {/* Download */}
                  <button 
                    onClick={() => handleDownload(dailyBriefs[0])}
                    disabled={!hasAudioAccess}
                    className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-surface-container hover:bg-surface-container-high flex items-center justify-center transition-colors disabled:opacity-30 disabled:cursor-not-allowed shrink-0"
                  >
                    <Download className="w-4 h-4 sm:w-5 sm:h-5 text-on-surface" />
                  </button>
                  
                  {/* Share */}
                  <button 
                    onClick={() => handleShare(dailyBriefs[0])}
                    className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-surface-container hover:bg-surface-container-high flex items-center justify-center transition-colors shrink-0"
                  >
                    <Share2 className="w-4 h-4 sm:w-5 sm:h-5 text-on-surface" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section>
        
        {/* Ad Banner for free users */}
        {!hasAdFree && <AdBanner position="inline" />}
        
        {/* More Briefs */}
        <section>
          <h3 className="font-[family-name:var(--font-headline)] text-2xl italic text-on-surface mb-6 px-4">
            More Briefs
          </h3>
          
          <div className="space-y-4">
            {dailyBriefs.slice(1).map((brief) => (
              <div 
                key={brief.id}
                className="bg-surface-container-lowest/70 backdrop-blur-xl border-2 border-outline-variant/15 transition-all group cursor-pointer hover:shadow-lg"
                style={{ borderRadius: '60px 30px 70px 40px', padding: '16px' }}
                onClick={() => {
                  if (expandedId === brief.id) {
                    setExpandedId(null);
                  } else {
                    setExpandedId(brief.id);
                  }
                }}
              >
                <div className="flex items-center gap-4">
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      handlePlay(brief.id);
                    }}
                    className="bg-inverse-surface text-inverse-on-surface w-14 h-14 rounded-full flex items-center justify-center transition-transform group-hover:scale-110 shrink-0 relative"
                  >
                    {!hasAudioAccess && (
                      <div className="absolute inset-0 bg-inverse-surface/90 rounded-full flex items-center justify-center">
                        <Lock className="w-5 h-5" />
                      </div>
                    )}
                    {playingId === brief.id && hasAudioAccess ? (
                      <Pause className="w-5 h-5" fill="currentColor" />
                    ) : (
                      <Play className="w-5 h-5 ml-0.5" fill="currentColor" />
                    )}
                  </button>
                  
                  <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-outline-variant/20 shrink-0">
                    <img 
                      src={brief.imageUrl}
                      className="w-full h-full object-cover" 
                      alt={brief.title} 
                    />
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="text-xs uppercase tracking-wider text-outline mb-1">
                      {brief.category}
                    </div>
                    <h4 className="font-[family-name:var(--font-headline)] text-lg text-on-surface leading-tight line-clamp-2">
                      {brief.title}
                    </h4>
                    <div className="flex items-center gap-3 text-outline text-xs mt-1">
                      <span>{brief.duration}</span>
                      <span>•</span>
                      <span>{brief.insights} insights</span>
                      <span>•</span>
                      <span>{brief.date}</span>
                    </div>
                  </div>
                  
                  {playingId === brief.id && hasAudioAccess && (
                    <div className="w-24 shrink-0">
                      <div className="w-full h-2 bg-surface-container rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-primary transition-all duration-100"
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                      <div className="text-xs text-outline text-center mt-1">
                        {formatTime(currentTime)}
                      </div>
                    </div>
                  )}
                </div>
                
                {/* Expanded Controls */}
                {expandedId === brief.id && (
                  <div className="mt-4 pt-4 border-t border-outline-variant/15 space-y-3">
                    {/* Progress Bar */}
                    {playingId === brief.id && hasAudioAccess && (
                      <div className="space-y-2">
                        <div className="w-full h-2 bg-surface-container rounded-full overflow-hidden cursor-pointer" onClick={(e) => {
                          e.stopPropagation();
                          const rect = e.currentTarget.getBoundingClientRect();
                          const x = e.clientX - rect.left;
                          const percentage = x / rect.width;
                          handleSeek(percentage * duration);
                        }}>
                          <div 
                            className="h-full bg-gradient-to-r from-primary to-primary-variant transition-all duration-100"
                            style={{ width: `${progress}%` }}
                          />
                        </div>
                        <div className="flex justify-between text-xs text-outline">
                          <span>{formatTime(currentTime)}</span>
                          <span>{formatTime(duration)}</span>
                        </div>
                      </div>
                    )}
                    
                    {/* Controls */}
                    <div className="overflow-x-auto hide-scrollbar" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-center gap-2 sm:gap-3 min-w-max px-2">
                        {/* Skip Back */}
                        {hasAudioAccess && playingId === brief.id && (
                          <button 
                            onClick={() => handleSkip(-15)}
                            className="w-10 h-10 rounded-full bg-surface-container hover:bg-surface-container-high flex items-center justify-center transition-all shrink-0"
                          >
                            <SkipBack className="w-4 h-4 text-on-surface" />
                          </button>
                        )}
                        
                        {/* Volume */}
                        <div className="flex items-center gap-2 px-2 sm:px-3 py-2 rounded-full bg-surface-container/50">
                          <button 
                            onClick={toggleMute}
                            disabled={!hasAudioAccess}
                            className="disabled:opacity-30 disabled:cursor-not-allowed shrink-0"
                          >
                            {isMuted ? (
                              <VolumeX className="w-4 h-4 text-on-surface" />
                            ) : (
                              <Volume2 className="w-4 h-4 text-on-surface" />
                            )}
                          </button>
                          <input
                            type="range"
                            min="0"
                            max="1"
                            step="0.01"
                            value={isMuted ? 0 : volume}
                            onChange={(e) => {
                              setVolume(parseFloat(e.target.value));
                              if (isMuted) setIsMuted(false);
                            }}
                            disabled={!hasAudioAccess}
                            className="w-16 sm:w-20 h-2 rounded-full appearance-none cursor-pointer bg-outline/30 disabled:opacity-30 disabled:cursor-not-allowed
                              [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-primary [&::-webkit-slider-thumb]:cursor-pointer
                              [&::-moz-range-thumb]:w-3 [&::-moz-range-thumb]:h-3 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-primary [&::-moz-range-thumb]:border-0 [&::-moz-range-thumb]:cursor-pointer"
                          />
                        </div>
                        
                        {/* Speed */}
                        <button 
                          onClick={cycleSpeed}
                          disabled={!hasAudioAccess}
                          className="px-2 sm:px-3 py-2 rounded-full bg-surface-container hover:bg-surface-container-high transition-colors disabled:opacity-30 disabled:cursor-not-allowed shrink-0"
                        >
                          <span className="text-xs font-medium text-on-surface">{playbackRate}x</span>
                        </button>
                        
                        {/* Download */}
                        <button 
                          onClick={() => handleDownload(brief)}
                          disabled={!hasAudioAccess}
                          className="w-10 h-10 rounded-full bg-surface-container hover:bg-surface-container-high flex items-center justify-center transition-colors disabled:opacity-30 disabled:cursor-not-allowed shrink-0"
                        >
                          <Download className="w-4 h-4 text-on-surface" />
                        </button>
                        
                        {/* Share */}
                        <button 
                          onClick={() => handleShare(brief)}
                          className="w-10 h-10 rounded-full bg-surface-container hover:bg-surface-container-high flex items-center justify-center transition-colors shrink-0"
                        >
                          <Share2 className="w-4 h-4 text-on-surface" />
                        </button>
                        
                        {/* Skip Forward */}
                        {hasAudioAccess && playingId === brief.id && (
                          <button 
                            onClick={() => handleSkip(15)}
                            className="w-10 h-10 rounded-full bg-surface-container hover:bg-surface-container-high flex items-center justify-center transition-all shrink-0"
                          >
                            <SkipForward className="w-4 h-4 text-on-surface" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>
      </main>
      
      <BottomNav />
      
      <PaywallModal 
        isOpen={showPaywall}
        onClose={() => setShowPaywall(false)}
        feature="Audio Briefs"
        description="Get instant access to audio versions of all articles and daily briefs. Perfect for listening on the go."
        requiredTier="premium"
      />
    </div>
  );
}