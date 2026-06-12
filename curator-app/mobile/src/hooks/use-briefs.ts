import { useQuery } from "@tanstack/react-query";

import type { BriefItem } from "../data/briefs";
import { queryKeys } from "../lib/query-keys";
import { fetchBriefs } from "../services/mobile-api";

async function fetchBriefsQuery(): Promise<BriefItem[]> {
  return fetchBriefs();
}

export function useBriefs() {
  return useQuery({
    queryKey: queryKeys.briefs.list(),
    queryFn: fetchBriefsQuery,
    staleTime: 30 * 60 * 1000,
  });
}
