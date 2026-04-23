import { type Auth } from "firebase/auth";

const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
};

export const firebaseConfigured = Object.values(firebaseConfig).every(Boolean);

let authInstance: Auth | null = null;

export function getFirebaseAuth(): Auth {
  if (!firebaseConfigured) {
    throw new Error(
      "Firebase is not configured yet. Add the Expo public Firebase keys in mobile/.env before testing auth.",
    );
  }

  if (!authInstance) {
    // Lazy-import to avoid crashes when Firebase env vars are missing
    const { getApp, getApps, initializeApp } = require("firebase/app");
    const { getAuth, initializeAuth } = require("firebase/auth");
    const { getReactNativePersistence } = require("@firebase/auth/dist/rn/index.js");
    const AsyncStorage = require("@react-native-async-storage/async-storage").default;

    const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

    try {
      authInstance = initializeAuth(app, {
        persistence: getReactNativePersistence(AsyncStorage),
      });
    } catch {
      authInstance = getAuth(app);
    }
  }

  return authInstance as Auth;
}
