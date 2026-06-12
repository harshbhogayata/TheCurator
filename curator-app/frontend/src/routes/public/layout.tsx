import { Outlet, useLoaderData } from "react-router";
import { fetchPublicCategories } from "../../lib/public-api.server";
import type { PublicCategory } from "../../lib/site";
import { PublicFooter, PublicHeader } from "../../ui/public-site";

export async function loader() {
  let categories: PublicCategory[] = [];
  try {
    categories = await fetchPublicCategories();
  } catch {
    // Header degrades gracefully when the API is unreachable.
  }
  return { categories };
}

export default function PublicLayout() {
  const { categories } = useLoaderData<typeof loader>();
  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <PublicHeader categories={categories} />
      <main className="flex-1">
        <Outlet />
      </main>
      <PublicFooter />
    </div>
  );
}
