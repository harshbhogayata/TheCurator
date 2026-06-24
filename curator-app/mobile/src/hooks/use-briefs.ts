import { useQuery } from "@tanstack/react-query";

import type { BriefItem } from "../data/briefs";
import { queryKeys } from "../lib/query-keys";
import { fetchAllBriefs } from "../services/mobile-api";

async function fetchBriefsQuery(): Promise<BriefItem[]> {
  return fetchAllBriefs();
}

export function useBriefs() {
  return useQuery({
    queryKey: queryKeys.briefs.list(),
    queryFn: fetchBriefsQuery,
    staleTime: 5 * 60 * 1000,
    gcTime: 60 * 60 * 1000,
  });
}
