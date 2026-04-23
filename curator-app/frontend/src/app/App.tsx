import { RouterProvider } from 'react-router';
import { router } from './routes';
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

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <SubscriptionProvider>
          <SavedArticlesProvider>
            <CollectionsProvider>
              <ReadingPreferencesProvider>
                <ReadingStatsProvider>
                  <AudioProvider>
                    <ToastProvider>
                      <Layout>
                        <RouterProvider router={router} />
                      </Layout>
                    </ToastProvider>
                  </AudioProvider>
                </ReadingStatsProvider>
              </ReadingPreferencesProvider>
            </CollectionsProvider>
          </SavedArticlesProvider>
        </SubscriptionProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}