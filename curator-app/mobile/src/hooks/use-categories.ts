import { useQuery } from "@tanstack/react-query";

import { queryKeys } from "../lib/query-keys";
import { fetchCategories } from "../services/mobile-api";

export interface CategoryItem {
  slug: string;
  name: string;
  color: string;
  icon: string;
  rank: number;
}

async function fetchCategoriesQuery(): Promise<CategoryItem[]> {
  return fetchCategories();
}

/**
 * Returns the list of active categories from the backend.
 */
export function useCategories() {
  return useQuery({
    queryKey: queryKeys.categories.list(),
    queryFn: fetchCategoriesQuery,
    staleTime: 60 * 60 * 1000, // 1 hour — categories rarely change
  });
}
