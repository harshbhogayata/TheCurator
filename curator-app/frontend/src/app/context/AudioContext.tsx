import { createContext, useContext, useState, useEffect, useRef, ReactNode } from 'react';

interface AudioState {
  isPlaying: boolean;
  currentBriefId: string | null;
  currentTime: number;
  duration: number;
  playbackSpeed: number;
}

interface AudioContextType {
  audioState: AudioState;
  playBrief: (briefId: string, audioUrl: string) => void;
  pauseBrief: () => void;
  resumeBrief: () => void;
  seekTo: (time: number) => void;
  skipForward: () => void;
  skipBackward: () => void;
  setSpeed: (speed: number) => void;
  stopBrief: () => void;
}

const AudioContext = createContext<AudioContextType | undefined>(undefined);

export function AudioProvider({ children }: { children: ReactNode }) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  
  const [audioState, setAudioState] = useState<AudioState>({
    isPlaying: false,
    currentBriefId: null,
    currentTime: 0,
    duration: 0,
    playbackSpeed: 1.0
  });
  
  useEffect(() => {
    // Create audio element
    const audio = new Audio();
    audioRef.current = audio;
    
    // Event listeners
    const handleTimeUpdate = () => {
      setAudioState(prev => ({
        ...prev,
        currentTime: audio.currentTime
      }));
    };
    
    const handleDurationChange = () => {
      setAudioState(prev => ({
        ...prev,
        duration: audio.duration
      }));
    };
    
    const handleEnded = () => {
      setAudioState(prev => ({
        ...prev,
        isPlaying: false,
        currentTime: 0
      }));
    };
    
    const handlePlay = () => {
      setAudioState(prev => ({
        ...prev,
        isPlaying: true
      }));
    };
    
    const handlePause = () => {
      setAudioState(prev => ({
        ...prev,
        isPlaying: false
      }));
    };
    
    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('durationchange', handleDurationChange);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('play', handlePlay);
    audio.addEventListener('pause', handlePause);
    
    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('durationchange', handleDurationChange);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('play', handlePlay);
      audio.removeEventListener('pause', handlePause);
      audio.pause();
    };
  }, []);
  
  const playBrief = (briefId: string, audioUrl: string) => {
    if (!audioRef.current) return;
    
    // If playing a different brief, reset
    if (audioState.currentBriefId !== briefId) {
      audioRef.current.src = audioUrl;
      audioRef.current.load();
      setAudioState(prev => ({
        ...prev,
        currentBriefId: briefId,
        currentTime: 0
      }));
    }
    
    audioRef.current.play();
  };
  
  const pauseBrief = () => {
    if (!audioRef.current) return;
    audioRef.current.pause();
  };
  
  const resumeBrief = () => {
    if (!audioRef.current) return;
    audioRef.current.play();
  };
  
  const seekTo = (time: number) => {
    if (!audioRef.current) return;
    audioRef.current.currentTime = time;
  };
  
  const skipForward = () => {
    if (!audioRef.current) return;
    audioRef.current.currentTime = Math.min(
      audioRef.current.currentTime + 15,
      audioRef.current.duration
    );
  };
  
  const skipBackward = () => {
    if (!audioRef.current) return;
    audioRef.current.currentTime = Math.max(
      audioRef.current.currentTime - 15,
      0
    );
  };
  
  const setSpeed = (speed: number) => {
    if (!audioRef.current) return;
    audioRef.current.playbackRate = speed;
    setAudioState(prev => ({
      ...prev,
      playbackSpeed: speed
    }));
  };
  
  const stopBrief = () => {
    if (!audioRef.current) return;
    audioRef.current.pause();
    audioRef.current.currentTime = 0;
    setAudioState(prev => ({
      ...prev,
      isPlaying: false,
      currentBriefId: null,
      currentTime: 0
    }));
  };
  
  return (
    <AudioContext.Provider
      value={{
        audioState,
        playBrief,
        pauseBrief,
        resumeBrief,
        seekTo,
        skipForward,
        skipBackward,
        setSpeed,
        stopBrief
      }}
    >
      {children}
    </AudioContext.Provider>
  );
}

export function useAudio() {
  const context = useContext(AudioContext);
  if (context === undefined) {
    throw new Error('useAudio must be used within an AudioProvider');
  }
  return context;
}
