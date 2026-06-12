import { Link, useLoaderData } from "react-router";
import { fetchPublicBriefs } from "../../lib/public-api.server";
import { PUBLIC_CACHE_CONTROL, SITE_URL } from "../../lib/site";

export function headers() {
  return { "Cache-Control": PUBLIC_CACHE_CONTROL };
}

export async function loader() {
  const briefs = await fetchPublicBriefs(20);
  return { briefs: briefs.items };
}

export function meta() {
  return [
    { title: "Daily Briefs — The Curator" },
    {
      name: "description",
      content:
        "Curator's daily audio briefings: the day's most important stories in a calm, listenable summary.",
    },
    { tagName: "link", rel: "canonical", href: `${SITE_URL}/briefs` },
  ];
}

export default function BriefsPage() {
  const { briefs } = useLoaderData<typeof loader>();

  return (
    <div className="mx-auto max-w-[760px] px-5 py-8">
      <h1
        className="text-4xl text-foreground"
        style={{ fontFamily: "var(--font-headline)" }}
      >
        Daily Briefs
      </h1>
      <p className="mt-2 text-on-surface-variant">
        The day's most important stories, narrated. Listening requires a free
        Curator account.
      </p>

      <div className="mt-8 space-y-6">
        {briefs.length === 0 ? (
          <p className="py-16 text-center text-on-surface-variant">
            Today's brief is being prepared.
          </p>
        ) : (
          briefs.map((brief) => (
            <article
              key={brief.id}
              className="rounded-2xl bg-surface-container-low p-6"
            >
              <div className="flex items-center gap-2 text-xs uppercase tracking-wide text-on-surface-variant">
                {brief.isBreaking && (
                  <span className="rounded-full bg-error px-2 py-0.5 font-semibold text-on-error">
                    Breaking
                  </span>
                )}
                <span>{brief.publishedDate}</span>
                <span>· {brief.duration} listen</span>
              </div>
              <h2
                className="mt-2 text-2xl text-foreground"
                style={{ fontFamily: "var(--font-headline)" }}
              >
                {brief.title}
              </h2>
              <p className="mt-2 line-clamp-4 text-sm leading-relaxed text-on-surface-variant">
                {brief.summary}
              </p>
              <Link
                to="/welcome"
                className="mt-4 inline-block rounded-full bg-primary px-5 py-2 text-sm font-medium text-primary-foreground hover:bg-primary-dim"
              >
                Sign in to listen
              </Link>
            </article>
          ))
        )}
      </div>
    </div>
  );
}
