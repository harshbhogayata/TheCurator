import { SITE_URL } from "../../lib/site";

export function loader() {
  const body = `User-agent: *
Allow: /
Disallow: /settings
Disallow: /account
Disallow: /menu
Disallow: /profile
Disallow: /saved
Disallow: /collections
Disallow: /reading-stats
Disallow: /data-export
Disallow: /connected-accounts

Sitemap: ${SITE_URL}/sitemap.xml
Sitemap: ${SITE_URL}/news-sitemap.xml
`;

  return new Response(body, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=86400",
    },
  });
}
