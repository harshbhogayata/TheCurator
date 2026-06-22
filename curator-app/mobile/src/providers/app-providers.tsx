import { PersistQueryClientProvider } from "@tanstack/react-query-persist-client";
import { BottomSheetModalProvider } from "@gorhom/bottom-sheet";
import { type PropsWithChildren } from "react";

import { asyncStoragePersister, queryClient } from "../lib/query-client";
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
  return (
    <PersistQueryClientProvider
      client={queryClient}
      persistOptions={{ persister: asyncStoragePersister }}
    >
      <ThemeProvider>
        <AuthProvider>
          <ToastProvider>
            <BottomSheetModalProvider>
              <SubscriptionProvider>
                <SavedArticlesProvider>
                  <CollectionsProvider>
                    <ReadingPreferencesProvider>
                      <ReadingStatsProvider>
                        <AudioProvider>{children}</AudioProvider>
                      </ReadingStatsProvider>
                    </ReadingPreferencesProvider>
                  </CollectionsProvider>
                </SavedArticlesProvider>
              </SubscriptionProvider>
            </BottomSheetModalProvider>
          </ToastProvider>
        </AuthProvider>
      </ThemeProvider>
    </PersistQueryClientProvider>
  );
}

