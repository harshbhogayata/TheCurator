import { useQuery } from "@tanstack/react-query";

import { categories as staticCategories } from "../data/articles";
import { queryKeys } from "../lib/query-keys";
import { fetchCategories } from "../services/mobile-api";

const MOCK_BACKEND = __DEV__ && process.env.EXPO_PUBLIC_MOCK_BACKEND === "true";

export interface CategoryItem {
  slug: string;
  name: string;
  color: string;
  icon: string;
  rank: number;
}

async function fetchCategoriesQuery(): Promise<CategoryItem[]> {
  if (MOCK_BACKEND) {
    return staticCategories.slice(1).map((name, i) => ({
      slug: name.toLowerCase(),
      name,
      color: "#64748b",
      icon: "layers",
      rank: i,
    }));
  }

  return fetchCategories();
}

/**
 * Returns the list of active categories from the backend.
 * Falls back to local static data when MOCK_BACKEND=true.
 */
export function useCategories() {
  return useQuery({
    queryKey: queryKeys.categories.list(),
    queryFn: fetchCategoriesQuery,
    staleTime: 60 * 60 * 1000, // 1 hour — categories rarely change
  });
}
