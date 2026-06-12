import { useState } from 'react';
import { BookOpen, Clock, Bookmark, Target } from 'lucide-react';

import { AppShell } from '../components/AppShell';
import { useReadingStats } from '../context/ReadingStatsContext';
import { useSavedArticles } from '../context/SavedArticlesContext';

function formatTime(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const mins = Math.floor((totalSeconds % 3600) / 60);
  if (hours > 0) return `${hours}h ${mins}m`;
  return `${mins}m`;
}

export function ReadingStats() {
  const { stats, averageReadTimeMs, thisWeekArticles } = useReadingStats();
  const { savedCount } = useSavedArticles();
  const [timeframe, setTimeframe] = useState<'week' | 'month'>('week');

  const dayLabels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const history = stats.dailyHistory || [];
  const barCount = timeframe === 'week' ? 7 : 30;
  const barData: { label: string; value: number }[] = [];

  for (let i = barCount - 1; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().slice(0, 10);
    const record = history.find((h) => h.date === dateStr);
    const label =
      timeframe === 'week'
        ? dayLabels[date.getDay() === 0 ? 6 : date.getDay() - 1]
        : `${date.getMonth() + 1}/${date.getDate()}`;
    barData.push({ label, value: record?.articlesRead || 0 });
  }

  const maxVal = Math.max(...barData.map((d) => d.value), 1);

  return (
    <AppShell title="Reading Stats">
      <div className="mx-auto max-w-3xl space-y-8">
        <div
          className="relative overflow-hidden bg-gradient-to-br from-primary via-secondary to-tertiary p-8 text-white shadow-xl"
          style={{ borderRadius: '60px 40px 80px 50px' }}
        >
          <div className="absolute -right-16 -top-16 h-32 w-32 rounded-full bg-white/10" />
          <div className="relative flex items-center gap-4">
            <span className="text-4xl">🔥</span>
            <div>
              <p className="text-sm text-white/80">Current streak</p>
              <p className="text-4xl font-bold">{stats.currentStreak} days</p>
            </div>
          </div>
          <div className="relative mt-6 flex justify-between border-t border-white/20 pt-4">
            <div>
              <p className="text-xs text-white/80">Longest streak</p>
              <p className="text-xl font-medium">{stats.longestStreak} days</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-white/80">This week</p>
              <p className="text-xl font-medium">{thisWeekArticles} articles</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          {[
            { icon: BookOpen, label: 'Articles read', value: String(stats.totalArticlesRead) },
            { icon: Clock, label: 'Time reading', value: formatTime(stats.totalReadTimeMs) },
            { icon: Bookmark, label: 'Saved', value: String(savedCount) },
            { icon: Target, label: 'Avg. read', value: formatTime(averageReadTimeMs) },
          ].map(({ icon: Icon, label, value }) => (
            <div
              key={label}
              className="rounded-[30px] border border-outline-variant/15 bg-surface-container-lowest/70 p-5 text-center"
            >
              <Icon className="mx-auto mb-2 h-5 w-5 text-primary" />
              <p className="text-2xl font-semibold text-on-surface">{value}</p>
              <p className="mt-1 text-xs text-outline">{label}</p>
            </div>
          ))}
        </div>

        <div>
          <div className="mb-4 flex gap-2">
            {(['week', 'month'] as const).map((tf) => (
              <button
                key={tf}
                type="button"
                onClick={() => setTimeframe(tf)}
                className={`rounded-full px-4 py-2 text-sm capitalize ${
                  timeframe === tf
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-surface-container text-on-surface-variant'
                }`}
              >
                {tf}
              </button>
            ))}
          </div>

          <div className="flex h-48 items-end justify-between gap-1 rounded-[30px] border border-outline-variant/15 bg-surface-container-lowest/70 p-6">
            {barData.map((bar) => (
              <div key={bar.label} className="flex flex-1 flex-col items-center gap-2">
                <div
                  className="w-full max-w-[24px] rounded-t-full bg-primary transition-all"
                  style={{ height: `${Math.max(8, (bar.value / maxVal) * 120)}px` }}
                />
                <span className="text-[10px] text-outline">{bar.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </AppShell>
  );
}
