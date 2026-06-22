import type { ActionCodeSettings } from "firebase/auth";

import { SITE_URL } from "../constants/site";

/** Opens in the browser after verify; link in email goes to /verify-email (click-to-verify). */
export function buildEmailVerificationSettings(): ActionCodeSettings {
  return {
    url: `${SITE_URL}/verify-email.html?status=done`,
    handleCodeInApp: false,
  };
}
