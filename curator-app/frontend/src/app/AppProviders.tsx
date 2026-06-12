import { useEffect, type ReactNode } from 'react';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from '../lib/query-client';
import { AuthProvider } from './context/AuthContext';
import { SubscriptionProvider } from './context/SubscriptionContext';
import { SavedArticlesProvider } from './context/SavedArticlesContext';
import { CollectionsProvider } from './context/CollectionsContext';
import { ToastProvider } from './components/Toast';
import { ThemeProvider } from './context/ThemeContext';
import { ReadingPreferencesProvider } from './context/ReadingPreferencesContext';
import { ReadingStatsProvider } from './context/ReadingStatsContext';
import { AudioProvider } from './context/AudioContext';
import { Layout } from './components/Layout';
import { LayoutProvider } from '../providers/layout-provider';

/** Full provider stack for the authenticated app surface (client-only). */
export function AppProviders({ children }: { children: ReactNode }) {
  // PWA: offline caching of assets + saved articles (push subscription is
  // opt-in via Settings; registering the worker alone shows no prompts).
  useEffect(() => {
    if ('serviceWorker' in navigator && !import.meta.env.DEV) {
      void navigator.serviceWorker
        .register('/sw.js')
        .then((registration) => registration.update())
        .catch(() => {});
    }
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <LayoutProvider>
        <ThemeProvider>
          <AuthProvider>
            <SubscriptionProvider>
              <SavedArticlesProvider>
                <CollectionsProvider>
                  <ReadingPreferencesProvider>
                    <ReadingStatsProvider>
                      <AudioProvider>
                        <ToastProvider>
                          <Layout>{children}</Layout>
                        </ToastProvider>
                      </AudioProvider>
                    </ReadingStatsProvider>
                  </ReadingPreferencesProvider>
                </CollectionsProvider>
              </SavedArticlesProvider>
            </SubscriptionProvider>
          </AuthProvider>
        </ThemeProvider>
      </LayoutProvider>
    </QueryClientProvider>
  );
}
