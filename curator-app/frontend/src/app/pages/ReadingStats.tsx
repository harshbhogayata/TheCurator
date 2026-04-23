import { useState } from 'react';
import { BottomNav } from '../components/BottomNav';
import { ArrowLeft, TrendingUp, BookOpen, Clock, Flame, Award, Target } from 'lucide-react';
import { useNavigate } from 'react-router';
import { useReadingStats } from '../context/ReadingStatsContext';
import { useSavedArticles } from '../context/SavedArticlesContext';

export function ReadingStats() {
  const navigate = useNavigate();
  const { getTodayStats, getWeekStats, getMonthStats, getTotalStats, streak } = useReadingStats();
  const { savedArticles } = useSavedArticles();
  const [timeframe, setTimeframe] = useState<'week' | 'month'>('week');
  
  const todayStats = getTodayStats();
  const weekStats = getWeekStats();
  const monthStats = getMonthStats();
  const totalStats = getTotalStats();
  
  const displayStats = timeframe === 'week' ? weekStats : monthStats;
  
  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    if (hours > 0) return `${hours}h ${mins}m`;
    return `${mins}m`;
  };
  
  const maxArticles = Math.max(...displayStats.map(s => s.articlesRead), 1);
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-surface via-background to-surface-container-low pb-32">
      {/* Header */}
      <header className="pt-8 px-6 mb-8">
        <button
          onClick={() => navigate(-1)}
          className="mb-6 w-10 h-10 rounded-full bg-surface-container-lowest border border-outline-variant/20 hover:bg-surface-container flex items-center justify-center transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-on-surface" />
        </button>
        
        <h1 className="font-[family-name:var(--font-headline)] text-5xl text-on-surface mb-2">
          Reading Insights
        </h1>
        <p className="text-outline">
          Track your reading journey
        </p>
      </header>
      
      {/* Streak Card */}
      <div className="px-6 mb-8">
        <div 
          className="bg-gradient-to-br from-primary via-secondary to-tertiary p-8 shadow-xl relative overflow-hidden"
          style={{ borderRadius: '60px 40px 80px 50px' }}
        >
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16" />
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/10 rounded-full -ml-12 -mb-12" />
          
          <div className="relative">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center">
                <Flame className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-white/80 text-sm">Current Streak</p>
                <p className="text-white text-3xl font-bold">{streak.currentStreak} days</p>
              </div>
            </div>
            
            <div className="flex items-center justify-between pt-4 border-t border-white/20">
              <div>
                <p className="text-white/80 text-xs mb-1">Longest Streak</p>
                <p className="text-white text-xl font-medium">{streak.longestStreak} days</p>
              </div>
              <div className="text-right">
                <p className="text-white/80 text-xs mb-1">Today</p>
                <p className="text-white text-xl font-medium">{todayStats.articlesRead} articles</p>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Quick Stats Grid */}
      <div className="px-6 mb-8">
        <div className="grid grid-cols-2 gap-4">
          {/* Total Articles */}
          <div 
            className="bg-surface-container-lowest/70 backdrop-blur-xl border border-outline-variant/15 p-6"
            style={{ borderRadius: '30px 20px 40px 25px' }}
          >
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center mb-3">
              <BookOpen className="w-5 h-5 text-primary" />
            </div>
            <p className="text-outline text-xs mb-1">Total Articles</p>
            <p className="text-on-surface text-2xl font-bold">{totalStats.totalArticles}</p>
          </div>
          
          {/* Reading Time */}
          <div 
            className="bg-surface-container-lowest/70 backdrop-blur-xl border border-outline-variant/15 p-6"
            style={{ borderRadius: '40px 25px 30px 20px' }}
          >
            <div className="w-10 h-10 rounded-xl bg-secondary/10 flex items-center justify-center mb-3">
              <Clock className="w-5 h-5 text-secondary" />
            </div>
            <p className="text-outline text-xs mb-1">Reading Time</p>
            <p className="text-on-surface text-2xl font-bold">{formatTime(totalStats.totalTime)}</p>
          </div>
          
          {/* Saved Articles */}
          <div 
            className="bg-surface-container-lowest/70 backdrop-blur-xl border border-outline-variant/15 p-6"
            style={{ borderRadius: '35px 25px 45px 30px' }}
          >
            <div className="w-10 h-10 rounded-xl bg-tertiary/10 flex items-center justify-center mb-3">
              <Award className="w-5 h-5 text-tertiary" />
            </div>
            <p className="text-outline text-xs mb-1">Saved</p>
            <p className="text-on-surface text-2xl font-bold">{savedArticles.length}</p>
          </div>
          
          {/* Avg Reading Time */}
          <div 
            className="bg-surface-container-lowest/70 backdrop-blur-xl border border-outline-variant/15 p-6"
            style={{ borderRadius: '30px 20px 35px 25px' }}
          >
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center mb-3">
              <Target className="w-5 h-5 text-primary" />
            </div>
            <p className="text-outline text-xs mb-1">Avg per Article</p>
            <p className="text-on-surface text-2xl font-bold">{formatTime(totalStats.averageReadTime)}</p>
          </div>
        </div>
      </div>
      
      {/* Activity Chart */}
      <div className="px-6 mb-8">
        <div 
          className="bg-surface-container-lowest/70 backdrop-blur-xl border border-outline-variant/15 p-6"
          style={{ borderRadius: '40px 30px 50px 35px' }}
        >
          <div className="flex items-center justify-between mb-6">
            <h2 className="font-[family-name:var(--font-headline)] text-2xl text-on-surface">
              Activity
            </h2>
            
            <div className="flex gap-2">
              <button
                onClick={() => setTimeframe('week')}
                className={`px-4 py-2 rounded-full text-sm transition-all ${
                  timeframe === 'week'
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-surface-container text-on-surface hover:bg-surface-container-high'
                }`}
              >
                Week
              </button>
              <button
                onClick={() => setTimeframe('month')}
                className={`px-4 py-2 rounded-full text-sm transition-all ${
                  timeframe === 'month'
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-surface-container text-on-surface hover:bg-surface-container-high'
                }`}
              >
                Month
              </button>
            </div>
          </div>
          
          {/* Simple Bar Chart */}
          <div className="space-y-3">
            {displayStats.map((stat, index) => {
              const date = new Date(stat.date);
              const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });
              const heightPercent = maxArticles > 0 ? (stat.articlesRead / maxArticles) * 100 : 0;
              
              return (
                <div key={stat.date} className="flex items-center gap-3">
                  <span className="text-outline text-xs w-8">{dayName}</span>
                  <div className="flex-1 bg-surface-container rounded-full h-8 overflow-hidden relative">
                    <div 
                      className="absolute left-0 top-0 bottom-0 bg-gradient-to-r from-primary to-secondary rounded-full transition-all duration-500"
                      style={{ width: `${heightPercent}%` }}
                    />
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-medium z-10 text-on-surface">
                      {stat.articlesRead > 0 ? `${stat.articlesRead} ${stat.articlesRead === 1 ? 'article' : 'articles'}` : ''}
                    </span>
                  </div>
                  {stat.timeSpent > 0 && (
                    <span className="text-outline text-xs w-12 text-right">
                      {formatTime(stat.timeSpent)}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
      
      {/* Favorite Category */}
      <div className="px-6 mb-8">
        <div 
          className="bg-surface-container-lowest/70 backdrop-blur-xl border border-outline-variant/15 p-6"
          style={{ borderRadius: '35px 25px 45px 30px' }}
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-secondary/10 flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-secondary" />
            </div>
            <h3 className="text-on-surface font-medium">Favorite Category</h3>
          </div>
          
          <p className="text-on-surface text-2xl font-[family-name:var(--font-headline)] mb-2">
            {totalStats.favoriteCategory}
          </p>
          <p className="text-outline text-sm">
            Your most-read topic this month
          </p>
        </div>
      </div>
      
      <BottomNav />
    </div>
  );
}
