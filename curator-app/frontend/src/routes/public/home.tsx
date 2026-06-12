import { PUBLIC_CACHE_CONTROL, SITE_URL } from "../../lib/site";
import { StoreLanding } from "../../store-site/pages/StoreLanding";

export function headers() {
  return { "Cache-Control": PUBLIC_CACHE_CONTROL };
}

export function meta() {
  return [
    { title: "The Curator - Coming soon on iOS and Android" },
    {
      name: "description",
      content:
        "A calmer way to read the news. Daily briefings and source-backed articles you can read or hear, launching on the App Store and Google Play.",
    },
    { tagName: "link", rel: "canonical", href: `${SITE_URL}/` },
  ];
}

export default function HomePage() {
  return <StoreLanding />;
}
