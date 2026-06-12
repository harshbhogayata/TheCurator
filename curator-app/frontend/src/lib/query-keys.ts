export const queryKeys = {
  articles: {
    all: ["articles"] as const,
    list: (filters?: Record<string, unknown>) => ["articles", "list", filters] as const,
    detail: (id: string) => ["articles", id] as const,
  },
  briefs: {
    all: ["briefs"] as const,
    list: () => ["briefs", "list"] as const,
    detail: (id: string) => ["briefs", id] as const,
  },
  categories: {
    all: ["categories"] as const,
    list: () => ["categories", "list"] as const,
  },
  entitlements: {
    all: ["entitlements"] as const,
  },
  saves: {
    all: ["saves"] as const,
  },
  collections: {
    all: ["collections"] as const,
  },
  readingStats: {
    all: ["reading", "stats"] as const,
  },
} as const;
