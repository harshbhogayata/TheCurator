/** Public web presence — matches thecuratorgroup.org coming soon site. */
export const SITE_URL = (
  process.env.EXPO_PUBLIC_SITE_URL ?? "https://thecuratorgroup.org"
).replace(/\/$/, "");

export const SUPPORT_EMAIL = "support@thecuratorgroup.org";
export const PRIVACY_EMAIL = "privacy@thecuratorgroup.org";
