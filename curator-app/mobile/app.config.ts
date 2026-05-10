import type { ConfigContext, ExpoConfig } from "expo/config";

const appName = "Curator";
const appSlug = "curator-mobile";
const bundleId = process.env.EXPO_PUBLIC_APP_BUNDLE_ID ?? "com.curator.mobile";
const packageName = process.env.EXPO_PUBLIC_ANDROID_PACKAGE ?? "com.curator.mobile";
const appEnv = process.env.APP_ENV ?? process.env.EXPO_PUBLIC_APP_ENV ?? "development";
const isProductionBuild = appEnv === "production" || process.env.EAS_BUILD_PROFILE === "production";
const apiUrl = process.env.EXPO_PUBLIC_API_URL ?? (isProductionBuild ? undefined : "http://127.0.0.1:8000");
const easProjectId = process.env.EXPO_PUBLIC_EAS_PROJECT_ID;

if (isProductionBuild) {
  const requiredEnv = [
    "EXPO_PUBLIC_API_URL",
    "EXPO_PUBLIC_EAS_PROJECT_ID",
    "EXPO_PUBLIC_FIREBASE_API_KEY",
    "EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN",
    "EXPO_PUBLIC_FIREBASE_PROJECT_ID",
    "EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET",
    "EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID",
    "EXPO_PUBLIC_FIREBASE_APP_ID",
    "EXPO_PUBLIC_RC_IOS_KEY",
    "EXPO_PUBLIC_RC_ANDROID_KEY",
  ].filter((key) => !process.env[key]);

  if (requiredEnv.length > 0) {
    throw new Error(`Production mobile build is missing required env: ${requiredEnv.join(", ")}`);
  }

  if (!apiUrl?.startsWith("https://")) {
    throw new Error("Production mobile build requires EXPO_PUBLIC_API_URL to use HTTPS.");
  }

  if (process.env.EXPO_PUBLIC_MOCK_BACKEND === "true" || process.env.EXPO_PUBLIC_MOCK_PREMIUM === "true") {
    throw new Error("Production mobile build cannot enable mock backend or mock premium flags.");
  }
}

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: appName,
  slug: appSlug,
  version: "1.0.0",
  orientation: "portrait",
  scheme: "curator",
  userInterfaceStyle: "automatic",
  newArchEnabled: true,
  icon: "./assets/icon.png",
  splash: {
    image: "./assets/splash-icon.png",
    resizeMode: "contain",
    backgroundColor: "#fbf9f3",
  },
  ios: {
    bundleIdentifier: bundleId,
    buildNumber: "1",
    supportsTablet: false,
    infoPlist: {
      CFBundleDisplayName: appName,
      UIBackgroundModes: ["audio"],
    },
  },
  android: {
    package: packageName,
    versionCode: 1,
    adaptiveIcon: {
      foregroundImage: "./assets/adaptive-icon.png",
      backgroundColor: "#fbf9f3",
    },
    edgeToEdgeEnabled: true,
    predictiveBackGestureEnabled: true,
  },
  web: {
    favicon: "./assets/favicon.png",
    bundler: "metro",
  },
  plugins: [
    "expo-router",
    "expo-font",
    "expo-secure-store",
    [
      "expo-av",
      {
        microphonePermission: false,
      },
    ],
  ],
  experiments: {
    typedRoutes: true,
  },
  extra: {
    apiUrl,
    eas: {
      projectId: easProjectId,
    },
  },
});
