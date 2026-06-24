import type { SessionPayload } from "./types";

/** Free article opens for email/password users before verify is required. */
export const UNVERIFIED_ARTICLE_READ_LIMIT = 3;

export function isEmailPasswordUser(session: SessionPayload | null): boolean {
  if (!session) return false;
  const providers = session.identities.map((identity) => identity.provider);
  if (providers.includes("google") || providers.includes("apple")) {
    return false;
  }
  return providers.includes("email");
}

export function needsEmailVerification(session: SessionPayload | null): boolean {
  if (!session) return false;
  return isEmailPasswordUser(session) && !session.user.emailVerified;
}

export function unverifiedArticleStorageKey(userId: string): string {
  return `curator.unverified-articles.${userId}`;
}
