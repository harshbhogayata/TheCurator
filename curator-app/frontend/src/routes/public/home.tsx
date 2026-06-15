import { redirect } from "react-router";

import { SITE_URL } from "../../lib/site";

export function meta() {
  return [
    { title: "The Curator — daily news briefings you can read or hear" },
    {
      name: "description",
      content:
        "A calmer way to read the news. Daily briefings and source-backed articles with AI narration, saves, and collections.",
    },
    { tagName: "link", rel: "canonical", href: `${SITE_URL}/` },
  ];
}

/** Root URL opens the web app — not a marketing / coming-soon page. */
export function loader() {
  return redirect("/welcome");
}

export default function HomePage() {
  return null;
}
