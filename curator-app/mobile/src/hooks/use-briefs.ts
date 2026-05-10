import { useQuery } from "@tanstack/react-query";

import { dailyBriefs } from "../data/briefs";
import type { BriefItem } from "../data/briefs";
import { queryKeys } from "../lib/query-keys";
import { fetchBriefs } from "../services/mobile-api";

const MOCK_BACKEND = __DEV__ && process.env.EXPO_PUBLIC_MOCK_BACKEND === "true";

async function fetchBriefsQuery(): Promise<BriefItem[]> {
  if (MOCK_BACKEND) {
    return dailyBriefs;
  }

  return fetchBriefs();
}

export function useBriefs() {
  return useQuery({
    queryKey: queryKeys.briefs.list(),
    queryFn: fetchBriefsQuery,
    staleTime: 5 * 60 * 1000,
  });
}
