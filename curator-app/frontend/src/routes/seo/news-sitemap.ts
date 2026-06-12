import { fetchSitemapEntries } from "../../lib/public-api.server";
import { SITE_URL } from "../../lib/site";

function xmlEscape(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** Google News sitemap: only articles published within the last 48 hours. */
export async function loader() {
  const entries = await fetchSitemapEntries().catch(() => []);
  const cutoff = Date.now() - 48 * 60 * 60 * 1000;

  const urls = entries
    .filter((entry) => new Date(entry.publishedAt).getTime() >= cutoff)
    .map(
      (entry) => `  <url>
    <loc>${SITE_URL}/article/${xmlEscape(entry.slug)}</loc>
    <news:news>
      <news:publication>
        <news:name>The Curator</news:name>
        <news:language>en</news:language>
      </news:publication>
      <news:publication_date>${entry.publishedAt}</news:publication_date>
      <news:title>${xmlEscape(entry.title)}</news:title>
    </news:news>
  </url>`,
    )
    .join("\n");

  const body = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:news="http://www.google.com/schemas/sitemap-news/0.9">
${urls}
</urlset>`;

  return new Response(body, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, max-age=300, s-maxage=900",
    },
  });
}
