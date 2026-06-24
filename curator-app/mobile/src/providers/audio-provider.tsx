import { Audio, type AVPlaybackStatus } from "expo-av";
import * as Speech from "expo-speech";
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
type PlaybackSource = "file" | "speech";

export interface PlayBriefOptions {
  narrationText?: string;
}

interface AudioContextValue {
  state: PlaybackState;
  currentBriefId: string | null;
  playbackSource: PlaybackSource;
  positionMs: number;
  durationMs: number;
  playbackSpeed: PlaybackSpeed;
  playBrief: (id: string, uri: string, options?: PlayBriefOptions) => Promise<void>;
  pause: () => void;
  resume: () => void;
  seekTo: (ms: number) => void;
  skipForward: () => void;
  skipBackward: () => void;
  setSpeed: (speed: PlaybackSpeed) => void;
  stopBrief: () => void;
}

const AudioContext = createContext<AudioContextValue | null>(null);

function estimateSpeechDurationMs(text: string): number {
  const words = text.trim().split(/\s+/).filter(Boolean).length;
  return Math.max(30_000, words * 420);
}

export function AudioProvider({ children }: PropsWithChildren) {
  const [state, setState] = useState<PlaybackState>("idle");
  const [currentBriefId, setCurrentBriefId] = useState<string | null>(null);
  const [positionMs, setPositionMs] = useState(0);
  const [durationMs, setDurationMs] = useState(0);
  const [playbackSpeed, setPlaybackSpeed] = useState<PlaybackSpeed>(1);
  const [playbackSource, setPlaybackSource] = useState<PlaybackSource>("file");
  const soundRef = useRef<Audio.Sound | null>(null);
  const sourceRef = useRef<PlaybackSource>("file");
  const speechStartedAtRef = useRef<number | null>(null);
  const speechPausedAtRef = useRef(0);

  useEffect(() => {
    Audio.setAudioModeAsync({
      playsInSilentModeIOS: true,
      staysActiveInBackground: true,
      shouldDuckAndroid: true,
    });

    return () => {
      Speech.stop();
      if (soundRef.current) {
        soundRef.current.unloadAsync();
        soundRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (sourceRef.current !== "speech" || state !== "playing") {
      return;
    }
    const interval = setInterval(() => {
      if (speechStartedAtRef.current) {
        const elapsed = speechPausedAtRef.current + (Date.now() - speechStartedAtRef.current);
        setPositionMs(elapsed);
      }
    }, 250);
    return () => clearInterval(interval);
  }, [state, currentBriefId]);

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
      setState("paused");
    }
  }, []);

  const unloadCurrentSound = useCallback(async () => {
    if (sourceRef.current === "speech") {
      Speech.stop();
      sourceRef.current = "file";
      setPlaybackSource("file");
      speechStartedAtRef.current = null;
      speechPausedAtRef.current = 0;
    }

    if (soundRef.current) {
      soundRef.current.setOnPlaybackStatusUpdate(null);
      await soundRef.current.unloadAsync();
      soundRef.current = null;
    }
  }, []);

  const playSpeechNarration = useCallback(
    async (id: string, narrationText: string) => {
      await unloadCurrentSound();
      sourceRef.current = "speech";
      setPlaybackSource("speech");
      setState("loading");
      setCurrentBriefId(id);
      setPositionMs(0);
      const estimatedDuration = estimateSpeechDurationMs(narrationText);
      setDurationMs(estimatedDuration);
      speechStartedAtRef.current = Date.now();
      speechPausedAtRef.current = 0;

      Speech.speak(narrationText, {
        rate: 0.95,
        onStart: () => setState("playing"),
        onDone: () => {
          setState("idle");
          setCurrentBriefId(null);
          setPositionMs(0);
          setDurationMs(0);
          sourceRef.current = "file";
          setPlaybackSource("file");
        },
        onStopped: () => {
          setState("idle");
          setCurrentBriefId(null);
          setPositionMs(0);
          setDurationMs(0);
          sourceRef.current = "file";
          setPlaybackSource("file");
        },
      });
    },
    [unloadCurrentSound],
  );

  const playBrief = useCallback(
    async (id: string, uri: string, options?: PlayBriefOptions) => {
      if (state === "loading") return;

      const narrationText = options?.narrationText?.trim();
      if (!uri?.trim() && narrationText) {
        await playSpeechNarration(id, narrationText);
        return;
      }

      if (!uri?.trim()) {
        throw new Error("No narration is available for this story yet.");
      }

      await unloadCurrentSound();
      sourceRef.current = "file";
      setPlaybackSource("file");
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
        console.error("Failed to load/play audio:", error);
        setState("idle");
        setCurrentBriefId(null);
        throw error;
      }
    },
    [state, playbackSpeed, onPlaybackStatusUpdate, unloadCurrentSound, playSpeechNarration],
  );

  const pause = useCallback(() => {
    if (sourceRef.current === "speech") {
      if (speechStartedAtRef.current) {
        speechPausedAtRef.current += Date.now() - speechStartedAtRef.current;
        speechStartedAtRef.current = null;
      }
      Speech.pause();
      setState("paused");
      return;
    }

    if (soundRef.current) {
      soundRef.current.pauseAsync();
      setState("paused");
    }
  }, []);

  const resume = useCallback(() => {
    if (sourceRef.current === "speech") {
      speechStartedAtRef.current = Date.now();
      Speech.resume();
      setState("playing");
      return;
    }

    if (soundRef.current) {
      soundRef.current.playAsync();
      setState("playing");
    }
  }, []);

  const seekTo = useCallback((ms: number) => {
    if (sourceRef.current === "speech") {
      return;
    }

    if (soundRef.current) {
      soundRef.current.setPositionAsync(ms);
    }
  }, []);

  const skipForward = useCallback(() => {
    if (sourceRef.current === "speech") {
      return;
    }

    if (soundRef.current) {
      const target = Math.min(positionMs + 15000, durationMs);
      soundRef.current.setPositionAsync(target);
    }
  }, [positionMs, durationMs]);

  const skipBackward = useCallback(() => {
    if (sourceRef.current === "speech") {
      return;
    }

    if (soundRef.current) {
      const target = Math.max(positionMs - 15000, 0);
      soundRef.current.setPositionAsync(target);
    }
  }, [positionMs]);

  const setSpeed = useCallback((speed: PlaybackSpeed) => {
    setPlaybackSpeed(speed);
    if (soundRef.current) {
      soundRef.current.setRateAsync(speed, true);
    }
  }, []);

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
      playbackSource,
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
      playbackSource,
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

  return <AudioContext.Provider value={value}>{children}</AudioContext.Provider>;
}

export function useAudio(): AudioContextValue {
  const context = useContext(AudioContext);
  if (!context) {
    throw new Error("useAudio must be used within an AudioProvider");
  }
  return context;
}
