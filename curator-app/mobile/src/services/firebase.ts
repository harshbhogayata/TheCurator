import { type Auth } from "firebase/auth";

import { buildFirebaseConfig } from "../lib/firebase-config";

const firebaseConfig = buildFirebaseConfig();

export const firebaseConfigured = Object.values(firebaseConfig).every(Boolean);

let authInstance: Auth | null = null;

export function getFirebaseAuth(): Auth {
  if (!firebaseConfigured) {
    throw new Error(
      "Firebase is not configured yet. Add the Expo public Firebase keys in mobile/.env before testing auth.",
    );
  }

  if (!authInstance) {
    const { getApp, getApps, initializeApp } = require("firebase/app");
    const { getAuth, initializeAuth, browserLocalPersistence, getReactNativePersistence } = require("firebase/auth");
    const { Platform } = require("react-native");

    const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

    try {
      if (Platform.OS === "web") {
        authInstance = initializeAuth(app, {
          persistence: browserLocalPersistence,
        });
      } else {
        const AsyncStorage = require("@react-native-async-storage/async-storage").default;
        authInstance = initializeAuth(app, {
          persistence: getReactNativePersistence(AsyncStorage),
        });
      }
    } catch {
      authInstance = getAuth(app);
    }
  }

  return authInstance as Auth;
}

export function getFirebaseApp() {
  return getFirebaseAuth().app;
}
