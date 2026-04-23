import { Link, useLocation } from 'react-router';
import { Sparkles, Compass, Bookmark, Settings } from 'lucide-react';

export function BottomNav() {
  const location = useLocation();

  const isBriefActive = location.pathname === '/brief';
  const isExploreActive =
    location.pathname === '/home' ||
    location.pathname === '/explore' ||
    location.pathname === '/search';
  const isSavedActive = location.pathname === '/saved';
  const isSettingsActive =
    location.pathname === '/settings' ||
    location.pathname === '/profile' ||
    location.pathname === '/account' ||
    location.pathname === '/connected-accounts' ||
    location.pathname === '/language-region';

  return (
    <nav className="fixed bottom-6 left-0 right-0 z-50 flex justify-center px-4">
      <div className="w-[90%] max-w-md rounded-[40px] border border-white/20 bg-white/60 px-4 shadow-[0_8px_32px_rgba(0,0,0,0.12)] backdrop-blur-2xl dark:border-zinc-700/30 dark:bg-zinc-900/60">
        <div className="flex h-20 items-center justify-between">
          <Link
            to="/brief"
            className={`flex flex-col items-center justify-center rounded-full px-5 py-2 transition-all ${
              isBriefActive
                ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900'
                : 'text-zinc-500 hover:bg-zinc-100/50 hover:text-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-800/50 dark:hover:text-zinc-200'
            }`}
          >
            <Sparkles className="mb-1 h-5 w-5" fill={isBriefActive ? 'currentColor' : 'none'} />
            <span className="text-[10px] uppercase tracking-widest">Brief</span>
          </Link>

          <Link
            to="/explore"
            className={`flex flex-col items-center justify-center rounded-full px-5 py-2 transition-all ${
              isExploreActive
                ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900'
                : 'text-zinc-500 hover:bg-zinc-100/50 hover:text-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-800/50 dark:hover:text-zinc-200'
            }`}
          >
            <Compass className="mb-1 h-5 w-5" fill={isExploreActive ? 'currentColor' : 'none'} />
            <span className="text-[10px] uppercase tracking-widest">Explore</span>
          </Link>

          <Link
            to="/saved"
            className={`flex flex-col items-center justify-center rounded-full px-5 py-2 transition-all ${
              isSavedActive
                ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900'
                : 'text-zinc-500 hover:bg-zinc-100/50 hover:text-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-800/50 dark:hover:text-zinc-200'
            }`}
          >
            <Bookmark className="mb-1 h-5 w-5" fill={isSavedActive ? 'currentColor' : 'none'} />
            <span className="text-[10px] uppercase tracking-widest">Saved</span>
          </Link>

          <Link
            to="/settings"
            className={`flex flex-col items-center justify-center rounded-full px-5 py-2 transition-all ${
              isSettingsActive
                ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900'
                : 'text-zinc-500 hover:bg-zinc-100/50 hover:text-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-800/50 dark:hover:text-zinc-200'
            }`}
          >
            <Settings className="mb-1 h-5 w-5" />
            <span className="text-[10px] uppercase tracking-widest">Settings</span>
          </Link>
        </div>
      </div>
    </nav>
  );
}
