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
import { UpgradeGateProvider } from "./upgrade-gate-provider";
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
                <UpgradeGateProvider>
                  <SavedArticlesProvider>
                    <CollectionsProvider>
                      <ReadingPreferencesProvider>
                        <ReadingStatsProvider>
                          <AudioProvider>{children}</AudioProvider>
                        </ReadingStatsProvider>
                      </ReadingPreferencesProvider>
                    </CollectionsProvider>
                  </SavedArticlesProvider>
                </UpgradeGateProvider>
              </SubscriptionProvider>
            </BottomSheetModalProvider>
          </ToastProvider>
        </AuthProvider>
      </ThemeProvider>
    </PersistQueryClientProvider>
  );
}

