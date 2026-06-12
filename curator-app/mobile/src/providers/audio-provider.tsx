import { Audio, type AVPlaybackStatus } from "expo-av";
import {
  createContext,
  type PropsWithChildren,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

type PlaybackState = "idle" | "loading" | "playing" | "paused";
type PlaybackSpeed = 1 | 1.25 | 1.5 | 1.75 | 2;

interface AudioContextValue {
  state: PlaybackState;
  currentBriefId: string | null;
  positionMs: number;
  durationMs: number;
  playbackSpeed: PlaybackSpeed;
  playBrief: (id: string, uri: string) => Promise<void>;
  pause: () => void;
  resume: () => void;
  seekTo: (ms: number) => void;
  skipForward: () => void;
  skipBackward: () => void;
  setSpeed: (speed: PlaybackSpeed) => void;
  stopBrief: () => void;
}

const AudioContext = createContext<AudioContextValue | null>(null);

export function AudioProvider({ children }: PropsWithChildren) {
  const [state, setState] = useState<PlaybackState>("idle");
  const [currentBriefId, setCurrentBriefId] = useState<string | null>(null);
  const [positionMs, setPositionMs] = useState(0);
  const [durationMs, setDurationMs] = useState(0);
  const [playbackSpeed, setPlaybackSpeed] = useState<PlaybackSpeed>(1);
  const soundRef = useRef<Audio.Sound | null>(null);

  useEffect(() => {
    Audio.setAudioModeAsync({
      playsInSilentModeIOS: true,
      staysActiveInBackground: true,
      shouldDuckAndroid: true,
    });

    return () => {
      if (soundRef.current) {
        soundRef.current.unloadAsync();
        soundRef.current = null;
      }
    };
  }, []);

  const onPlaybackStatusUpdate = useCallback((status: AVPlaybackStatus) => {
    if (!status.isLoaded) return;

    setPositionMs(status.positionMillis);
    setDurationMs(status.durationMillis ?? 0);

    if (status.didJustFinish) {
      setState("idle");
      setCurrentBriefId(null);
      setPositionMs(0);
      setDurationMs(0);
    } else if (status.isPlaying) {
      setState("playing");
    } else {
      // OS interrupted (phone call, headphone unplug, etc.)
      setState("paused");
    }
  }, []);

  const unloadCurrentSound = useCallback(async () => {
    if (soundRef.current) {
      soundRef.current.setOnPlaybackStatusUpdate(null);
      await soundRef.current.unloadAsync();
      soundRef.current = null;
    }
  }, []);

  const playBrief = useCallback(
    async (id: string, uri: string) => {
      if (state === "loading") return;
      await unloadCurrentSound();

      setState("loading");
      setCurrentBriefId(id);
      setPositionMs(0);
      setDurationMs(0);

      try {
        const { sound } = await Audio.Sound.createAsync(
          { uri },
          {
            shouldPlay: true,
            rate: playbackSpeed,
            progressUpdateIntervalMillis: 250,
          },
          onPlaybackStatusUpdate,
        );

        soundRef.current = sound;
        setState("playing");
      } catch (error) {
        console.error("Failed to load/play audio brief:", error);
        setState("idle");
        setCurrentBriefId(null);
        throw error;
      }
    },
    [state, playbackSpeed, onPlaybackStatusUpdate, unloadCurrentSound],
  );

  const pause = useCallback(() => {
    if (soundRef.current) {
      soundRef.current.pauseAsync();
      setState("paused");
    }
  }, []);

  const resume = useCallback(() => {
    if (soundRef.current) {
      soundRef.current.playAsync();
      setState("playing");
    }
  }, []);

  const seekTo = useCallback((ms: number) => {
    if (soundRef.current) {
      soundRef.current.setPositionAsync(ms);
    }
  }, []);

  const skipForward = useCallback(() => {
    if (soundRef.current) {
      const target = Math.min(positionMs + 15000, durationMs);
      soundRef.current.setPositionAsync(target);
    }
  }, [positionMs, durationMs]);

  const skipBackward = useCallback(() => {
    if (soundRef.current) {
      const target = Math.max(positionMs - 15000, 0);
      soundRef.current.setPositionAsync(target);
    }
  }, [positionMs]);

  const setSpeed = useCallback(
    (speed: PlaybackSpeed) => {
      setPlaybackSpeed(speed);
      if (soundRef.current) {
        soundRef.current.setRateAsync(speed, true);
      }
    },
    [],
  );

  const stopBrief = useCallback(async () => {
    await unloadCurrentSound();
    setState("idle");
    setCurrentBriefId(null);
    setPositionMs(0);
    setDurationMs(0);
  }, [unloadCurrentSound]);

  const value = useMemo<AudioContextValue>(
    () => ({
      state,
      currentBriefId,
      positionMs,
      durationMs,
      playbackSpeed,
      playBrief,
      pause,
      resume,
      seekTo,
      skipForward,
      skipBackward,
      setSpeed,
      stopBrief,
    }),
    [
      state,
      currentBriefId,
      positionMs,
      durationMs,
      playbackSpeed,
      playBrief,
      pause,
      resume,
      seekTo,
      skipForward,
      skipBackward,
      setSpeed,
      stopBrief,
    ],
  );

  return (
    <AudioContext.Provider value={value}>{children}</AudioContext.Provider>
  );
}

export function useAudio(): AudioContextValue {
  const context = useContext(AudioContext);
  if (!context) {
    throw new Error("useAudio must be used within an AudioProvider");
  }
  return context;
}
