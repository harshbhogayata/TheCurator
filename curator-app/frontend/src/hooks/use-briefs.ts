import { useQuery } from "@tanstack/react-query";

import type { BriefItem } from "../data/briefs";
import { mockBriefs } from "../data/mock-content";
import { isMockBackend } from "../lib/dev-mode";
import { queryKeys } from "../lib/query-keys";
import { fetchBriefs } from "../services/mobile-api";

export function useBriefs() {
  return useQuery({
    queryKey: queryKeys.briefs.list(),
    queryFn: (): Promise<BriefItem[]> =>
      isMockBackend ? Promise.resolve(mockBriefs) : fetchBriefs(),
    staleTime: 30 * 60 * 1000,
  });
}
