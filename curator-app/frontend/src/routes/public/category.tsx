import { useLoaderData } from "react-router";
import type { LoaderFunctionArgs, MetaFunction } from "react-router";
import { fetchPublicArticles, fetchPublicCategories } from "../../lib/public-api.server";
import { PUBLIC_CACHE_CONTROL, SITE_URL } from "../../lib/site";
import { StoryRow } from "../../ui/public-site";

export function headers() {
  return { "Cache-Control": PUBLIC_CACHE_CONTROL };
}

export async function loader({ params }: LoaderFunctionArgs) {
  const slug = params.slug ?? "";
  const categories = await fetchPublicCategories();
  const category = categories.find((c) => c.slug === slug);
  if (!category) {
    throw new Response("Not Found", { status: 404 });
  }
  const articles = await fetchPublicArticles({ category: slug, limit: 30 });
  return { category, articles: articles.items };
}

export const meta: MetaFunction<typeof loader> = ({ data, params }) => {
  const name = data?.category.name ?? "Section";
  return [
    { title: `${name} — The Curator` },
    {
      name: "description",
      content: `The latest ${name.toLowerCase()} coverage, synthesized from trusted reporting by The Curator.`,
    },
    { tagName: "link", rel: "canonical", href: `${SITE_URL}/category/${params.slug}` },
  ];
};

export default function CategoryPage() {
  const { category, articles } = useLoaderData<typeof loader>();

  return (
    <div className="mx-auto max-w-[900px] px-5 py-8">
      <h1
        className="text-4xl text-foreground"
        style={{ fontFamily: "var(--font-headline)" }}
      >
        {category.name}
      </h1>
      <div className="mt-4">
        {articles.length === 0 ? (
          <p className="py-16 text-center text-on-surface-variant">
            No stories in this section yet.
          </p>
        ) : (
          articles.map((article) => <StoryRow key={article.id} article={article} />)
        )}
      </div>
    </div>
  );
}
