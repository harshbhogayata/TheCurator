import { fetchSitemapEntries } from "../../lib/public-api.server";
import { SITE_URL } from "../../lib/site";

function xmlEscape(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export async function loader() {
  const entries = await fetchSitemapEntries().catch(() => []);

  const staticUrls = [
    "",
    "/briefs",
    "/about",
    "/support",
    "/privacy",
    "/terms",
    "/account-deletion",
  ]
    .map(
      (path) => `  <url><loc>${SITE_URL}${path || "/"}</loc><changefreq>hourly</changefreq></url>`,
    )
    .join("\n");

  const articleUrls = entries
    .map(
      (entry) =>
        `  <url><loc>${SITE_URL}/article/${xmlEscape(entry.slug)}</loc><lastmod>${entry.updatedAt.slice(0, 10)}</lastmod></url>`,
    )
    .join("\n");

  const body = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${staticUrls}
${articleUrls}
</urlset>`;

  return new Response(body, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, max-age=600, s-maxage=3600",
    },
  });
}
