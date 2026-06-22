type StatsRefreshListener = () => void;

let statsRefreshListener: StatsRefreshListener | null = null;

export function registerReadingStatsRefresh(listener: StatsRefreshListener): () => void {
  statsRefreshListener = listener;
  return () => {
    if (statsRefreshListener === listener) {
      statsRefreshListener = null;
    }
  };
}

export function notifyReadingStatsRefresh(): void {
  statsRefreshListener?.();
}
