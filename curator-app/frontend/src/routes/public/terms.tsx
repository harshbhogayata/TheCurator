import { PUBLIC_CACHE_CONTROL } from "../../lib/site";

export function headers() {
  return { "Cache-Control": PUBLIC_CACHE_CONTROL };
}

export { StoreTerms as default } from "../../store-site/pages/StoreTerms";
