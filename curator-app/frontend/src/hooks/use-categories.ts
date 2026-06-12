import { useQuery } from "@tanstack/react-query";

import { mockCategories } from "../data/mock-content";
import { isMockBackend } from "../lib/dev-mode";
import { queryKeys } from "../lib/query-keys";
import { fetchCategories } from "../services/mobile-api";

export interface CategoryItem {
  slug: string;
  name: string;
  color: string;
  icon: string;
  rank: number;
}

export function useCategories() {
  return useQuery({
    queryKey: queryKeys.categories.list(),
    queryFn: (): Promise<CategoryItem[]> =>
      isMockBackend ? Promise.resolve(mockCategories) : fetchCategories(),
    staleTime: 60 * 60 * 1000,
  });
}
