import { Link } from "react-router";
import type { PublicArticle, PublicCategory } from "../lib/site";
import { optimizedImageUrl } from "../lib/images";

const headline = { fontFamily: "var(--font-headline)" } as const;

export function PublicHeader({ categories }: { categories: PublicCategory[] }) {
  return (
    <header className="border-b border-outline-variant/40 bg-background/95 sticky top-0 z-40 backdrop-blur">
      <div className="mx-auto max-w-[1200px] px-5">
        <div className="flex items-center justify-between py-4">
          <Link to="/" className="text-3xl tracking-tight text-foreground" style={headline}>
            The Curator
          </Link>
          <nav className="flex items-center gap-3">
            <Link
              to="/welcome"
              className="rounded-full border border-outline-variant px-4 py-1.5 text-sm text-foreground hover:bg-surface-container"
            >
              Sign in
            </Link>
            <Link
              to="/onboarding"
              className="rounded-full bg-primary px-4 py-1.5 text-sm font-medium text-primary-foreground hover:bg-primary-dim"
            >
              Start reading free
            </Link>
          </nav>
        </div>
        <nav
          aria-label="Sections"
          className="-mx-5 flex gap-1 overflow-x-auto px-5 pb-3 text-sm"
        >
          <Link
            to="/briefs"
            className="whitespace-nowrap rounded-full px-3 py-1 font-medium text-foreground hover:bg-surface-container"
          >
            Daily Brief
          </Link>
          {categories.map((category) => (
            <Link
              key={category.slug}
              to={`/category/${category.slug}`}
              className="whitespace-nowrap rounded-full px-3 py-1 text-on-surface-variant hover:bg-surface-container hover:text-foreground"
            >
              {category.name}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}

export function PublicFooter() {
  return (
    <footer className="border-t border-outline-variant/40 bg-surface-container-low">
      <div className="mx-auto max-w-[1200px] px-5 py-10">
        <p className="text-2xl text-foreground" style={headline}>
          The Curator
        </p>
        <p className="mt-2 max-w-md text-sm text-on-surface-variant">
          Source-backed articles and daily audio briefings, synthesized from
          trusted reporting around the world.
        </p>
        <nav className="mt-6 flex flex-wrap gap-x-6 gap-y-2 text-sm text-on-surface-variant">
          <Link to="/about" className="hover:text-foreground">About</Link>
          <Link to="/support" className="hover:text-foreground">Support</Link>
          <Link to="/privacy" className="hover:text-foreground">Privacy</Link>
          <Link to="/terms" className="hover:text-foreground">Terms</Link>
          <Link to="/rss.xml" reloadDocument className="hover:text-foreground">RSS</Link>
        </nav>
        <p className="mt-8 text-xs text-on-surface-variant">
          © {new Date().getFullYear()} The Curator. All rights reserved.
        </p>
      </div>
    </footer>
  );
}

export function CategoryChip({ name }: { name: string }) {
  return (
    <span className="inline-block rounded-full bg-secondary-container px-2.5 py-0.5 text-xs font-medium uppercase tracking-wide text-on-secondary-container">
      {name}
    </span>
  );
}

export function StoryImage({
  article,
  className,
}: {
  article: PublicArticle;
  className?: string;
}) {
  if (!article.imageUrl) {
    return (
      <div
        className={`bg-surface-container-high ${className ?? ""}`}
        aria-hidden="true"
      />
    );
  }
  return (
    <img
      src={optimizedImageUrl(article.imageUrl, 1000)}
      alt={article.title}
      loading="lazy"
      decoding="async"
      className={`object-cover ${className ?? ""}`}
    />
  );
}

export function LeadStory({ article }: { article: PublicArticle }) {
  return (
    <Link
      to={`/article/${article.slug}`}
      className="group grid gap-6 md:grid-cols-2 md:items-center"
    >
      <StoryImage
        article={article}
        className="aspect-[16/10] w-full rounded-2xl"
      />
      <div>
        <CategoryChip name={article.category} />
        <h2
          className="mt-3 text-3xl leading-tight text-foreground group-hover:underline md:text-4xl"
          style={headline}
        >
          {article.title}
        </h2>
        <p className="mt-3 text-on-surface-variant leading-relaxed">{article.excerpt}</p>
        <p className="mt-4 text-xs uppercase tracking-wide text-on-surface-variant">
          {article.publishedDate} · {article.readTime}
        </p>
      </div>
    </Link>
  );
}

export function StoryCard({ article }: { article: PublicArticle }) {
  return (
    <Link to={`/article/${article.slug}`} className="group flex flex-col">
      <StoryImage article={article} className="aspect-[16/10] w-full rounded-xl" />
      <CategoryChip name={article.category} />
      <h3
        className="mt-2 text-xl leading-snug text-foreground group-hover:underline"
        style={headline}
      >
        {article.title}
      </h3>
      <p className="mt-2 line-clamp-3 text-sm text-on-surface-variant leading-relaxed">
        {article.excerpt}
      </p>
      <p className="mt-3 text-xs uppercase tracking-wide text-on-surface-variant">
        {article.publishedDate} · {article.readTime}
      </p>
    </Link>
  );
}

export function StoryRow({ article }: { article: PublicArticle }) {
  return (
    <Link
      to={`/article/${article.slug}`}
      className="group flex gap-5 border-b border-outline-variant/30 py-6 last:border-b-0"
    >
      <div className="min-w-0 flex-1">
        <CategoryChip name={article.category} />
        <h3
          className="mt-2 text-2xl leading-snug text-foreground group-hover:underline"
          style={headline}
        >
          {article.title}
        </h3>
        <p className="mt-2 line-clamp-2 text-sm text-on-surface-variant leading-relaxed">
          {article.excerpt}
        </p>
        <p className="mt-3 text-xs uppercase tracking-wide text-on-surface-variant">
          {article.publishedDate} · {article.readTime} · {article.author}
        </p>
      </div>
      <StoryImage
        article={article}
        className="hidden h-28 w-44 shrink-0 rounded-xl sm:block"
      />
    </Link>
  );
}
