import { useEffect, useState, type ComponentType, type ReactNode } from "react";
import { Link, data, useLoaderData } from "react-router";
import type { LoaderFunctionArgs, MetaFunction } from "react-router";
import { fetchPublicArticle, fetchPublicCategories } from "../lib/public-api.server";
import { SITE_URL, type PublicArticle, type PublicCategory } from "../lib/site";
import { CategoryChip, PublicFooter, PublicHeader } from "../ui/public-site";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Anonymous readers get this many full articles per calendar month. */
const FREE_ARTICLES_PER_MONTH = 3;
const METER_COOKIE = "curator_meter";
/** Paragraphs shown before the wall for metered readers. */
const PREVIEW_PARAGRAPHS = 2;

interface LoaderData {
  mode: "app" | "public";
  article: PublicArticle | null;
  categories: PublicCategory[];
  walled: boolean;
  remaining: number;
}

function parseMeter(cookieHeader: string | null): { month: string; count: number } {
  const month = new Date().toISOString().slice(0, 7);
  const raw = cookieHeader
    ?.split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${METER_COOKIE}=`))
    ?.slice(METER_COOKIE.length + 1);
  if (raw) {
    const [cookieMonth, countStr] = decodeURIComponent(raw).split(":");
    const count = Number.parseInt(countStr ?? "", 10);
    if (cookieMonth === month && Number.isFinite(count) && count >= 0) {
      return { month, count };
    }
  }
  return { month, count: 0 };
}

export async function loader({ params, request }: LoaderFunctionArgs) {
  const slugOrId = params.slugOrId ?? "";

  if (UUID_RE.test(slugOrId)) {
    return data<LoaderData>({
      mode: "app",
      article: null,
      categories: [],
      walled: false,
      remaining: 0,
    });
  }

  const [article, categories] = await Promise.all([
    fetchPublicArticle(slugOrId),
    fetchPublicCategories().catch(() => [] as PublicCategory[]),
  ]);

  const meter = parseMeter(request.headers.get("Cookie"));
  const walled = meter.count >= FREE_ARTICLES_PER_MONTH;
  const nextCount = walled ? meter.count : meter.count + 1;

  if (walled && article.content) {
    const paragraphs = article.content.split("\n\n");
    article.content = paragraphs.slice(0, PREVIEW_PARAGRAPHS).join("\n\n");
  }

  return data<LoaderData>(
    {
      mode: "public",
      article,
      categories,
      walled,
      remaining: Math.max(0, FREE_ARTICLES_PER_MONTH - nextCount),
    },
    {
      headers: {
        "Set-Cookie": `${METER_COOKIE}=${encodeURIComponent(
          `${meter.month}:${nextCount}`,
        )}; Path=/; Max-Age=2678400; SameSite=Lax`,
      },
    },
  );
}

export const meta: MetaFunction<typeof loader> = ({ data: loaderData, params }) => {
  const article = loaderData?.article;
  if (!article) {
    return [{ title: "The Curator" }];
  }
  const canonical = `${SITE_URL}/article/${params.slugOrId}`;
  return [
    { title: `${article.title} — The Curator` },
    { name: "description", content: article.excerpt },
    { property: "og:title", content: article.title },
    { property: "og:description", content: article.excerpt },
    { property: "og:type", content: "article" },
    { property: "og:url", content: canonical },
    ...(article.imageUrl ? [{ property: "og:image", content: article.imageUrl }] : []),
    { name: "twitter:card", content: article.imageUrl ? "summary_large_image" : "summary" },
    { property: "article:published_time", content: article.publishedAt },
    { property: "article:section", content: article.category },
    { tagName: "link", rel: "canonical", href: canonical },
  ];
};

function articleJsonLd(article: PublicArticle, canonical: string) {
  return JSON.stringify({
    "@context": "https://schema.org",
    "@type": "NewsArticle",
    headline: article.title,
    description: article.excerpt,
    image: article.imageUrl ? [article.imageUrl] : undefined,
    datePublished: article.publishedAt,
    author: [{ "@type": "Organization", name: article.author || "Curator Editorial" }],
    publisher: {
      "@type": "Organization",
      name: "The Curator",
      url: SITE_URL,
    },
    mainEntityOfPage: canonical,
    isAccessibleForFree: false,
  });
}

function useFirebaseUser() {
  const [signedIn, setSignedIn] = useState(false);
  useEffect(() => {
    let unsubscribe: (() => void) | undefined;
    import("../services/firebase")
      .then(({ firebaseConfigured, getFirebaseAuth }) => {
        if (!firebaseConfigured) return;
        unsubscribe = getFirebaseAuth().onAuthStateChanged((user) => {
          setSignedIn(Boolean(user));
        });
      })
      .catch(() => {});
    return () => unsubscribe?.();
  }, []);
  return signedIn;
}

function AppArticle({ articleId }: { articleId?: string }) {
  const [mounted, setMounted] = useState(false);
  const [modules, setModules] = useState<{
    AppProviders: ComponentType<{ children: ReactNode }>;
    Article: ComponentType<{ articleId?: string }>;
  } | null>(null);

  useEffect(() => {
    setMounted(true);
    Promise.all([
      import("../app/AppProviders"),
      import("../app/pages/Article"),
    ]).then(([providers, article]) => {
      setModules({ AppProviders: providers.AppProviders, Article: article.Article });
    });
  }, []);

  if (!mounted || !modules) {
    return <div className="min-h-screen bg-background" aria-busy="true" />;
  }
  const { AppProviders, Article } = modules;
  return (
    <AppProviders>
      <Article articleId={articleId} />
    </AppProviders>
  );
}

export default function ArticleRoute() {
  const { mode, article, categories, walled, remaining } =
    useLoaderData<typeof loader>();
  const signedIn = useFirebaseUser();

  if (mode === "app") {
    return <AppArticle />;
  }

  // Signed-in readers get the full in-app experience (audio, saves, progress).
  if (signedIn && article) {
    return <AppArticle articleId={article.id} />;
  }

  if (!article) return null;
  const canonical = `${SITE_URL}/article/${article.slug}`;
  const paragraphs = (article.content ?? "").split("\n\n").filter(Boolean);

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <PublicHeader categories={categories} />
      <main className="flex-1">
        <article className="mx-auto max-w-[720px] px-5 py-10">
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: articleJsonLd(article, canonical) }}
          />
          <CategoryChip name={article.category} />
          <h1
            className="mt-4 text-4xl leading-tight text-foreground md:text-5xl"
            style={{ fontFamily: "var(--font-headline)" }}
          >
            {article.title}
          </h1>
          <p className="mt-4 text-lg leading-relaxed text-on-surface-variant">
            {article.excerpt}
          </p>
          <p className="mt-4 text-xs uppercase tracking-wide text-on-surface-variant">
            {article.author} · {article.publishedDate} · {article.readTime}
          </p>

          {article.imageUrl && (
            <figure className="mt-8">
              <img
                src={article.imageUrl}
                alt={article.title}
                className="aspect-[16/9] w-full rounded-2xl object-cover"
              />
              {article.imageAttribution && (
                <figcaption className="mt-2 text-xs text-on-surface-variant">
                  {article.imageAttribution}
                </figcaption>
              )}
            </figure>
          )}

          <div className="relative mt-10">
            <div className="space-y-6 text-[1.0625rem] leading-[1.85] text-foreground">
              {paragraphs.map((paragraph, index) => (
                <p key={index}>{paragraph}</p>
              ))}
            </div>
            {walled && (
              <div className="pointer-events-none absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-background to-transparent" />
            )}
          </div>

          {walled ? (
            <div className="mt-8 rounded-2xl bg-surface-container p-8 text-center">
              <p
                className="text-2xl text-foreground"
                style={{ fontFamily: "var(--font-headline)" }}
              >
                You've reached your free articles for this month
              </p>
              <p className="mx-auto mt-2 max-w-sm text-sm text-on-surface-variant">
                Create a free account to keep reading, save stories, and listen
                to daily briefings.
              </p>
              <div className="mt-6 flex justify-center gap-3">
                <Link
                  to="/onboarding"
                  className="rounded-full bg-primary px-6 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary-dim"
                >
                  Create free account
                </Link>
                <Link
                  to="/welcome"
                  className="rounded-full border border-outline-variant px-6 py-2.5 text-sm text-foreground hover:bg-surface-container-high"
                >
                  Sign in
                </Link>
              </div>
            </div>
          ) : (
            <p className="mt-10 rounded-xl bg-surface-container-low px-5 py-3 text-center text-sm text-on-surface-variant">
              {remaining === 0
                ? "This is your last free article this month."
                : `${remaining} free article${remaining === 1 ? "" : "s"} remaining this month.`}{" "}
              <Link to="/onboarding" className="font-medium text-foreground underline">
                Read without limits
              </Link>
            </p>
          )}

          {(article.sourceLinks?.length ?? 0) > 0 && (
            <section className="mt-12 border-t border-outline-variant/40 pt-6">
              <h2 className="text-xs font-semibold uppercase tracking-widest text-on-surface-variant">
                Sources
              </h2>
              <ul className="mt-3 space-y-2 text-sm">
                {article.sourceLinks!.map((source, index) => (
                  <li key={index}>
                    {source.url ? (
                      <a
                        href={source.url}
                        rel="noopener noreferrer nofollow"
                        target="_blank"
                        className="text-foreground underline decoration-outline-variant underline-offset-4 hover:decoration-foreground"
                      >
                        {source.name}
                      </a>
                    ) : (
                      <span className="text-on-surface-variant">{source.name}</span>
                    )}
                  </li>
                ))}
              </ul>
            </section>
          )}
        </article>
      </main>
      <PublicFooter />
    </div>
  );
}
