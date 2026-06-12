/** Image CDN URL rewriting (resizing/format negotiation at the edge).
 *
 * VITE_IMAGE_CDN_URL is a template with {url} and {width} placeholders, e.g.
 * a Cloudflare image-resizing worker (see docs/OPERATIONS.md):
 *   https://img.thecurator.app/cdn-cgi/image/width={width},format=auto/{url}
 * When unset, original URLs are used untouched.
 */

const IMAGE_CDN_TEMPLATE = (import.meta.env.VITE_IMAGE_CDN_URL as string | undefined) ?? "";

export function optimizedImageUrl(url: string | undefined | null, width = 800): string {
  if (!url) return "";
  if (!IMAGE_CDN_TEMPLATE || url.startsWith("data:") || url.startsWith("/")) {
    return url;
  }
  return IMAGE_CDN_TEMPLATE.replace("{width}", String(width)).replace(
    "{url}",
    encodeURIComponent(url),
  );
}
