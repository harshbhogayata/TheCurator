import { Link } from "react-router";

export function loader() {
  throw new Response("Not Found", { status: 404 });
}

export default function NotFoundRoute() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background px-6 text-center text-foreground">
      <p className="text-6xl" style={{ fontFamily: "var(--font-headline)" }}>
        404
      </p>
      <p className="max-w-md text-on-surface-variant">
        The page you are looking for has moved or never existed.
      </p>
      <Link
        to="/"
        className="mt-2 rounded-full bg-primary px-6 py-2.5 text-sm font-medium text-primary-foreground"
      >
        Back to the front page
      </Link>
    </main>
  );
}
