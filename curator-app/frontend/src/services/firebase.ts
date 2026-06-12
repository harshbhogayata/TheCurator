import { type Auth, getAuth, initializeAuth, browserLocalPersistence } from "firebase/auth";
import { getApp, getApps, initializeApp } from "firebase/app";

function readConfigValue(value: string | undefined): string {
  return String(value ?? "").trim().replace(/^['"]|['"]$/g, "");
}

const firebaseConfig = {
  apiKey: readConfigValue(import.meta.env.VITE_FIREBASE_API_KEY),
  authDomain: readConfigValue(import.meta.env.VITE_FIREBASE_AUTH_DOMAIN),
  projectId: readConfigValue(import.meta.env.VITE_FIREBASE_PROJECT_ID),
  storageBucket: readConfigValue(import.meta.env.VITE_FIREBASE_STORAGE_BUCKET),
  messagingSenderId: readConfigValue(import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID),
  appId: readConfigValue(import.meta.env.VITE_FIREBASE_APP_ID),
};

export const firebaseConfigured = Object.values(firebaseConfig).every(Boolean);

let authInstance: Auth | null = null;

export function getFirebaseAuth(): Auth {
  if (!firebaseConfigured) {
    throw new Error(
      "Firebase is not configured. Add VITE_FIREBASE_* keys in frontend/.env before testing auth.",
    );
  }

  if (!authInstance) {
    const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

    try {
      authInstance = initializeAuth(app, {
        persistence: browserLocalPersistence,
      });
    } catch {
      authInstance = getAuth(app);
    }
  }

  return authInstance;
}
