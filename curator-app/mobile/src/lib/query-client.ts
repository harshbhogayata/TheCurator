import { QueryClient } from "@tanstack/react-query";
import { createAsyncStoragePersister } from "@tanstack/query-async-storage-persister";
import AsyncStorage from "@react-native-async-storage/async-storage";

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2, // Slightly more retries for network resilience
      refetchOnWindowFocus: false,
      staleTime: 1000 * 60 * 60 * 24, // 24 hours stale time to prefer offline cache
      gcTime: 1000 * 60 * 60 * 24 * 7, // Keep in garbage collection for 7 days
    },
  },
});

export const asyncStoragePersister = createAsyncStoragePersister({
  storage: AsyncStorage,
});

export async function resetQueryCache(): Promise<void> {
  try {
    await asyncStoragePersister.removeClient();
  } catch {
    // Ignore persistence errors; fall through to in-memory clear.
  }
  queryClient.clear();
}
