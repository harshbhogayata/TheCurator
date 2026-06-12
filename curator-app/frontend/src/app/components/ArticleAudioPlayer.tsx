import { useCallback, useState } from 'react';
import { Headphones, Lock, Pause, Play, SkipBack, SkipForward } from 'lucide-react';
import { useNavigate } from 'react-router';

import { useAudio } from '../context/AudioContext';
import { useSubscription } from '../context/SubscriptionContext';
import { fetchArticleAudio } from '../../services/mobile-api';

interface ArticleAudioPlayerProps {
  articleId: string;
  audioUrl?: string;
  durationSec?: number | null;
  title: string;
}

function formatTime(seconds: number): string {
  const totalSeconds = Math.floor(seconds);
  const minutes = Math.floor(totalSeconds / 60);
  const secs = totalSeconds % 60;
  return `${minutes}:${secs.toString().padStart(2, '0')}`;
}

export function ArticleAudioPlayer({
  articleId,
  audioUrl,
  durationSec,
  title,
}: ArticleAudioPlayerProps) {
  const navigate = useNavigate();
  const { hasAudioAccess } = useSubscription();
  const { audioState, playBrief, pauseBrief, resumeBrief, skipForward, skipBackward } = useAudio();
  const [isResolving, setIsResolving] = useState(false);

  const hasAudio = Boolean(audioUrl || durationSec);
  if (!hasAudio) return null;

  const isThisArticle = audioState.currentBriefId === articleId;
  const isPlaying = isThisArticle && audioState.isPlaying;
  const currentTime = isThisArticle ? audioState.currentTime : 0;
  const duration =
    isThisArticle && audioState.duration > 0
      ? audioState.duration
      : durationSec ?? 0;
  const progress = duration > 0 ? Math.min((currentTime / duration) * 100, 100) : 0;

  const handlePlayPause = useCallback(async () => {
    if (!hasAudioAccess) {
      navigate('/donate');
      return;
    }

    if (!isThisArticle) {
      setIsResolving(true);
      try {
        const playableUrl = audioUrl || (await fetchArticleAudio(articleId)).audioUrl;
        playBrief(articleId, playableUrl);
      } catch {
        navigate('/donate');
      } finally {
        setIsResolving(false);
      }
      return;
    }

    if (isPlaying) {
      pauseBrief();
    } else {
      resumeBrief();
    }
  }, [
    articleId,
    audioUrl,
    hasAudioAccess,
    isPlaying,
    isThisArticle,
    navigate,
    pauseBrief,
    playBrief,
    resumeBrief,
  ]);

  return (
    <div className="mb-10 rounded-[32px] border border-outline-variant/20 bg-surface-container-low p-5">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary-container">
            <Headphones className="h-5 w-5 text-on-primary-container" />
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-outline">Listen</p>
            <p className="line-clamp-1 text-sm font-medium text-on-surface">{title}</p>
          </div>
        </div>
        {!hasAudioAccess && <Lock className="h-4 w-4 text-outline" />}
      </div>

      <div className="mb-4 h-1.5 overflow-hidden rounded-full bg-outline-variant/20">
        <div
          className="h-full rounded-full bg-primary transition-all"
          style={{ width: `${progress}%` }}
        />
      </div>

      <div className="flex items-center justify-between">
        <span className="text-xs text-outline">{formatTime(currentTime)}</span>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={skipBackward}
            disabled={!isThisArticle}
            className="flex h-10 w-10 items-center justify-center rounded-full hover:bg-surface-container disabled:opacity-40"
            aria-label="Skip back 15 seconds"
          >
            <SkipBack className="h-5 w-5 text-on-surface" />
          </button>
          <button
            type="button"
            onClick={() => void handlePlayPause()}
            disabled={isResolving}
            className="flex h-12 w-12 items-center justify-center rounded-full bg-inverse-surface text-white hover:bg-primary disabled:opacity-60"
            aria-label={isPlaying ? 'Pause' : 'Play'}
          >
            {isPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
          </button>
          <button
            type="button"
            onClick={skipForward}
            disabled={!isThisArticle}
            className="flex h-10 w-10 items-center justify-center rounded-full hover:bg-surface-container disabled:opacity-40"
            aria-label="Skip forward 15 seconds"
          >
            <SkipForward className="h-5 w-5 text-on-surface" />
          </button>
        </div>
        <span className="text-xs text-outline">{formatTime(duration)}</span>
      </div>
    </div>
  );
}
