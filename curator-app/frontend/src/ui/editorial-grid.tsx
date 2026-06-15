import { Search as SearchIcon } from "lucide-react";

import type { Article } from "../data/articles";
import { ArticleCard } from "../app/components/ArticleCard";
import { FeedStack } from "./feed-stack";

interface EditorialGridProps {
  topArticles?: Article[];
  stories: Article[];
  emptyTitle?: string;
  emptyDescription?: string;
}

export function EditorialGrid({
  topArticles = [],
  stories,
  emptyTitle = "No narratives found",
  emptyDescription = "Try adjusting your filters.",
}: EditorialGridProps) {
  const featured = topArticles[0];
  const secondary = topArticles.slice(1, 3);

  if (!featured && stories.length === 0) {
    return (
      <div className="rounded-[40px] border border-outline-variant/15 bg-surface-container-lowest/70 py-20 text-center">
        <SearchIcon className="mx-auto h-12 w-12 text-outline-variant" />
        <h3 className="mt-4 text-xl text-on-surface">{emptyTitle}</h3>
        <p className="mt-2 text-on-surface-variant">{emptyDescription}</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {featured && (
        <section className="grid gap-6 xl:grid-cols-[minmax(0,1.6fr)_minmax(280px,1fr)]">
          <ArticleCard article={featured} variant="featured" />
          {secondary.length > 0 && (
            <div className="grid gap-6">
              {secondary.map((article) => (
                <ArticleCard key={article.id} article={article} variant="grid" />
              ))}
            </div>
          )}
        </section>
      )}

      {stories.length > 0 && (
        <FeedStack variant="grid">
          {stories.map((article) => (
            <ArticleCard key={article.id} article={article} variant="grid" />
          ))}
        </FeedStack>
      )}
    </div>
  );
}
