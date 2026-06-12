import { fetchPublicArticles } from "../../lib/public-api.server";
import { SITE_URL } from "../../lib/site";

function xmlEscape(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export async function loader() {
  const articles = await fetchPublicArticles({ limit: 30 }).catch(() => ({
    items: [],
    nextCursor: null,
  }));

  const items = articles.items
    .map(
      (article) => `    <item>
      <title>${xmlEscape(article.title)}</title>
      <link>${SITE_URL}/article/${xmlEscape(article.slug)}</link>
      <guid isPermaLink="true">${SITE_URL}/article/${xmlEscape(article.slug)}</guid>
      <description>${xmlEscape(article.excerpt)}</description>
      <category>${xmlEscape(article.category)}</category>
      <pubDate>${new Date(article.publishedAt).toUTCString()}</pubDate>
    </item>`,
    )
    .join("\n");

  const body = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>The Curator</title>
    <link>${SITE_URL}</link>
    <description>Source-backed articles and daily briefings, synthesized from trusted reporting.</description>
    <language>en</language>
${items}
  </channel>
</rss>`;

  return new Response(body, {
    headers: {
      "Content-Type": "application/rss+xml; charset=utf-8",
      "Cache-Control": "public, max-age=600, s-maxage=1800",
    },
  });
}
