/** Django API base URL (no trailing slash). */
const PRODUCTION_API = "https://thecurator-production-1b47.up.railway.app";

export const LAUNCH_NOTIFY_API = (
  import.meta.env.VITE_API_URL ?? (import.meta.env.PROD ? PRODUCTION_API : "http://127.0.0.1:8000")
).replace(/\/$/, "");

export async function registerLaunchNotify(
  email: string,
): Promise<{ status: string; email: string }> {
  let response: Response;
  try {
    response = await fetch(`${LAUNCH_NOTIFY_API}/api/launch-notify`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({ email, source: "launch_site" }),
    });
  } catch {
    throw new Error(
      "Could not reach the server. Try again in a moment or email support@thecuratorgroup.org.",
    );
  }

  const payload = await response.json().catch(() => null);

  if (!response.ok) {
    const detail =
      payload && typeof payload === "object" && "detail" in payload
        ? String((payload as { detail: unknown }).detail)
        : "Could not save your email. Try again or contact support.";
    throw new Error(detail);
  }

  return payload as { status: string; email: string };
}
