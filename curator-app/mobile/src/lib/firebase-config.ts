import Constants from "expo-constants";

function readConfigValue(value: string | undefined): string {
  return String(value ?? "").trim().replace(/^['"]|['"]$/g, "");
}

/** True when running inside the Expo Go host app (not a standalone/dev-client build). */
export function isExpoGo(): boolean {
  return Constants.appOwnership === "expo";
}

/**
 * Production builds and dev clients use the restricted Android key.
 * Expo Go cannot satisfy Android app restrictions — use EXPO_PUBLIC_FIREBASE_API_KEY_DEV locally.
 */
export function resolveFirebaseApiKey(): string {
  const productionKey = readConfigValue(process.env.EXPO_PUBLIC_FIREBASE_API_KEY);
  const devKey = readConfigValue(process.env.EXPO_PUBLIC_FIREBASE_API_KEY_DEV);

  if (__DEV__ && isExpoGo() && devKey) {
    return devKey;
  }

  return productionKey;
}

export function buildFirebaseConfig() {
  return {
    apiKey: resolveFirebaseApiKey(),
    authDomain: readConfigValue(process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN),
    projectId: readConfigValue(process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID),
    storageBucket: readConfigValue(process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET),
    messagingSenderId: readConfigValue(process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID),
    appId: readConfigValue(process.env.EXPO_PUBLIC_FIREBASE_APP_ID),
  };
}

/** Last 6 chars of the API key baked into this build — safe to show for support. */
export function firebaseApiKeyFingerprint(): string {
  const key = resolveFirebaseApiKey();
  return key.length >= 6 ? key.slice(-6) : key || "missing";
}

export function firebaseRuntimeHint(): string | null {
  if (!__DEV__ || !isExpoGo()) {
    return null;
  }

  if (readConfigValue(process.env.EXPO_PUBLIC_FIREBASE_API_KEY_DEV)) {
    return null;
  }

  if (readConfigValue(process.env.EXPO_PUBLIC_MOCK_BACKEND) === "true") {
    return null;
  }

  return (
    "Expo Go cannot use the production Firebase API key when it is restricted to com.curator.mobile. " +
    "Install the EAS preview APK, run npx expo run:android, set EXPO_PUBLIC_FIREBASE_API_KEY_DEV in mobile/.env, " +
    "or enable EXPO_PUBLIC_MOCK_BACKEND=true for offline UI demos."
  );
}
