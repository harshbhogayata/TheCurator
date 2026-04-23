import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BottomSheetModalProvider } from "@gorhom/bottom-sheet";
import { type PropsWithChildren, useState } from "react";

import { AudioProvider } from "./audio-provider";
import { AuthProvider } from "./auth-provider";
import { CollectionsProvider } from "./collections-provider";
import { ReadingPreferencesProvider } from "./reading-preferences-provider";
import { ReadingStatsProvider } from "./reading-stats-provider";
import { SavedArticlesProvider } from "./saved-articles-provider";
import { SubscriptionProvider } from "./subscription-provider";
import { ThemeProvider } from "./theme-provider";
import { ToastProvider } from "./toast-provider";

export function AppProviders({ children }: PropsWithChildren) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            retry: 1,
            refetchOnWindowFocus: false,
          },
        },
      }),
  );

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <AuthProvider>
          <BottomSheetModalProvider>
            <SubscriptionProvider>
              <SavedArticlesProvider>
                <CollectionsProvider>
                  <ReadingPreferencesProvider>
                    <ReadingStatsProvider>
                      <AudioProvider>
                        <ToastProvider>{children}</ToastProvider>
                      </AudioProvider>
                    </ReadingStatsProvider>
                  </ReadingPreferencesProvider>
                </CollectionsProvider>
              </SavedArticlesProvider>
            </SubscriptionProvider>
          </BottomSheetModalProvider>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
