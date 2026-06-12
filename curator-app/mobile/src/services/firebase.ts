import { type Auth } from "firebase/auth";

function readConfigValue(value: string | undefined): string {
  return String(value ?? "").trim().replace(/^['"]|['"]$/g, "");
}

const firebaseConfig = {
  apiKey: readConfigValue(process.env.EXPO_PUBLIC_FIREBASE_API_KEY),
  authDomain: readConfigValue(process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN),
  projectId: readConfigValue(process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID),
  storageBucket: readConfigValue(process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET),
  messagingSenderId: readConfigValue(process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID),
  appId: readConfigValue(process.env.EXPO_PUBLIC_FIREBASE_APP_ID),
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
    } catch (e) {
      authInstance = getAuth(app);
    }
  }

  return authInstance as Auth;
}

export function getFirebaseApp() {
  return getFirebaseAuth().app;
}
