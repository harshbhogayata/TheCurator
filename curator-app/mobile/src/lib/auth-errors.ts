import { ApiError } from "../services/api-client";
import { firebaseApiKeyFingerprint, firebaseRuntimeHint, isExpoGo } from "./firebase-config";

type AuthAction = "sign-in" | "sign-up" | "password-reset" | "session";

const EXPO_GO_BLOCKED_CODES = new Set([
  "auth/app-not-authorized",
  "auth/invalid-api-key",
  "auth/missing-client-identifier",
  "auth/requests-from-refused-android-client",
]);

const FIREBASE_MESSAGES: Record<string, string> = {
  "auth/email-already-in-use": "An account already exists for this email. Sign in instead.",
  "auth/invalid-credential": "The email or password is incorrect.",
  "auth/invalid-email": "Enter a valid email address.",
  "auth/network-request-failed": "We could not reach Firebase. Check your connection and try again.",
  "auth/operation-not-allowed":
    "Email sign-in is not enabled. In Firebase Console → Authentication → Sign-in method, turn on Email/Password.",
  "auth/too-many-requests": "Too many attempts. Wait a moment, then try again.",
  "auth/user-disabled": "This account has been disabled. Please contact support.",
  "auth/weak-password": "Use a stronger password with at least 8 characters.",
  "auth/invalid-api-key":
    "Firebase rejected this app build. Add your EAS Android SHA-1 to the API key in Google Cloud (see expo.dev → Credentials).",
  "auth/app-not-authorized":
    "This app is not authorized for Firebase. Add package com.curator.mobile and your EAS SHA-1 fingerprint in Google Cloud.",
  "auth/requests-from-referer-<empty>-are-blocked.":
    "This API key is set to HTTP referrers (websites), but the mobile app has no referrer. In Google Cloud, open the key ending …{fingerprint} and set Application restrictions to Android apps — or None to test.",
  "auth/unauthorized-domain": "This domain is not authorized in Firebase. Add it under Authentication → Settings → Authorized domains.",
  "auth/missing-android-pkg-name":
    "Firebase Android package mismatch. Confirm com.curator.mobile is registered in Firebase project settings.",
  "auth/internal-error": "Firebase had an internal error. Try again in a few minutes.",
};

function readFirebaseCode(error: unknown): string | null {
  if (!error || typeof error !== "object" || !("code" in error)) return null;
  const code = (error as { code?: unknown }).code;
  return typeof code === "string" ? code : null;
}

function readFirebaseCodeFromMessage(message: string): string | null {
  const match = message.match(/\(auth\/[^)]+\)/);
  if (match) return match[0].slice(1, -1);
  if (/auth\/requests-from-referer/i.test(message)) {
    return "auth/requests-from-referer-<empty>-are-blocked.";
  }
  return null;
}

function messageForFirebaseCode(code: string, action: AuthAction): string {
  if (__DEV__ && isExpoGo() && EXPO_GO_BLOCKED_CODES.has(code)) {
    return firebaseRuntimeHint() ?? FIREBASE_MESSAGES[code] ?? messageForFirebaseCode("", action);
  }
  if (code && FIREBASE_MESSAGES[code]) {
    const message = FIREBASE_MESSAGES[code];
    return message.includes("{fingerprint}")
      ? message.replace("{fingerprint}", firebaseApiKeyFingerprint())
      : message;
  }
  if (code.startsWith("auth/")) {
    return `Authentication failed (${code}). Check Firebase Email/Password sign-in and API key SHA-1 restrictions.`;
  }
  if (action === "sign-up") return "We could not create your account. Please try again.";
  if (action === "password-reset") return "We could not send the reset email. Please try again.";
  if (action === "session") return "We could not restore your Curator session.";
  return "We could not sign you in. Check your details and try again.";
}

function logAuthFailure(error: unknown, action: AuthAction): void {
  if (!__DEV__) return;
  const code = readFirebaseCode(error);
  console.warn(`[Curator auth:${action}]`, code ?? error);
  const hint = firebaseRuntimeHint();
  if (hint) {
    console.warn(`[Curator auth] ${hint}`);
  }
}

export function getAuthErrorMessage(error: unknown, action: AuthAction): string {
  const firebaseCode =
    readFirebaseCode(error) ??
    (error instanceof Error ? readFirebaseCodeFromMessage(error.message) : null);
  if (firebaseCode) {
    logAuthFailure(error, action);
    return messageForFirebaseCode(firebaseCode, action);
  }

  if (error instanceof ApiError) {
    if (error.status === 0) {
      return "Curator could not reach the account service. Check your connection and try again.";
    }
    const apiCode =
      error.details && typeof error.details === "object" && "code" in error.details
        ? String((error.details as { code?: string }).code ?? "")
        : "";
    if (action === "password-reset") {
      if (apiCode === "email_unavailable" || /email delivery is not configured/i.test(error.message)) {
        return "Password reset email is not configured on the server yet. Try again later or contact support.";
      }
      if (error.status === 503 || error.status >= 500) {
        return error.message || "We could not send the reset email. Please try again.";
      }
    }
    if (error.status === 503 && /email delivery|reset email|couldn't send/i.test(error.message)) {
      return error.message;
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

  if (error instanceof Error && error.message.trim()) {
    const cleaned = error.message.replace(/^Firebase:\s*/i, "").trim();
    if (cleaned && !/^Error\s*\(auth\//i.test(cleaned)) {
      return cleaned;
    }
  }

  return messageForFirebaseCode("", action);
}
