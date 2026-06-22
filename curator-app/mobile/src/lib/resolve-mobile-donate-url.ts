import Constants from "expo-constants";

import { resolveApiBaseUrl } from "./resolve-api-base-url";

/** Checkout page served by the API (production site /donate is not deployed yet). */
export function resolveMobileDonateBaseUrl(): string {
  const override = String(process.env.EXPO_PUBLIC_MOBILE_DONATE_URL ?? "").trim().replace(/\/$/, "");
  if (override) {
    return override;
  }

  const apiBase = resolveApiBaseUrl(
    String(Constants.expoConfig?.extra?.apiUrl ?? process.env.EXPO_PUBLIC_API_URL ?? ""),
  );
  return `${apiBase.replace(/\/$/, "")}/m/donate`;
}

export function buildMobileDonateUrl(params: Record<string, string>): string {
  const query = new URLSearchParams(params);
  return `${resolveMobileDonateBaseUrl()}?${query.toString()}`;
}
