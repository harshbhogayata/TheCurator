export const queryKeys = {
  articles: {
    all: ["articles"] as const,
    list: (filters?: Record<string, unknown>) =>
      ["articles", "list", filters] as const,
    infinite: (filters?: Record<string, unknown>) =>
      ["articles", "infinite", filters] as const,
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
  saved: {
    list: () => ["articles", "saved"] as const,
  },
} as const;

