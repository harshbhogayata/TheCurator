import { ApiError } from "../services/api-client";

type AuthAction = "sign-in" | "sign-up" | "password-reset" | "session";

const FIREBASE_MESSAGES: Record<string, string> = {
  "auth/email-already-in-use": "An account already exists for this email. Sign in instead.",
  "auth/invalid-credential": "The email or password is incorrect.",
  "auth/invalid-email": "Enter a valid email address.",
  "auth/network-request-failed": "We could not reach Firebase. Check your connection and try again.",
  "auth/operation-not-allowed": "Email sign-in is temporarily unavailable. Please contact support.",
  "auth/too-many-requests": "Too many attempts. Wait a moment, then try again.",
  "auth/user-disabled": "This account has been disabled. Please contact support.",
  "auth/weak-password": "Use a stronger password with at least 8 characters.",
};

function readFirebaseCode(error: unknown): string | null {
  if (!error || typeof error !== "object" || !("code" in error)) return null;
  const code = (error as { code?: unknown }).code;
  return typeof code === "string" ? code : null;
}

export function getAuthErrorMessage(error: unknown, action: AuthAction): string {
  const firebaseCode = readFirebaseCode(error);
  if (firebaseCode && FIREBASE_MESSAGES[firebaseCode]) {
    return FIREBASE_MESSAGES[firebaseCode];
  }

  if (error instanceof ApiError) {
    if (error.status === 0) {
      return "Curator could not reach the account service. Check your connection and try again.";
    }
    if (error.status === 404 && (action === "sign-up" || action === "sign-in" || action === "session")) {
      return "The account service on this API is out of date. Redeploy the backend or point the app at a current API URL.";
    }
    if (/clock is out of sync/i.test(error.message)) {
      return "This device or server clock is out of sync. Enable automatic date and time, then try again.";
    }
    if (error.status >= 500) {
      return "The account service is temporarily unavailable. Please try again shortly.";
    }
    return error.message;
  }

  if (error instanceof Error && !/^Firebase:/i.test(error.message)) {
    return error.message;
  }

  if (action === "sign-up") return "We could not create your account. Please try again.";
  if (action === "password-reset") return "We could not send the reset email. Please try again.";
  if (action === "session") return "We could not restore your Curator session.";
  return "We could not sign you in. Check your details and try again.";
}
