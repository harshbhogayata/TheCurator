import type { ConfigContext, ExpoConfig } from "expo/config";

const appName = "Curator";
const appSlug = "curator-mobile";
const bundleId = process.env.EXPO_PUBLIC_APP_BUNDLE_ID ?? "com.curator.mobile";
const packageName = process.env.EXPO_PUBLIC_ANDROID_PACKAGE ?? "com.curator.mobile";
const firebaseAndroidPackage = process.env.EXPO_PUBLIC_FIREBASE_ANDROID_PACKAGE ?? packageName;
const firebaseIosBundleId = process.env.EXPO_PUBLIC_FIREBASE_IOS_BUNDLE_ID ?? bundleId;
const appEnv = process.env.APP_ENV ?? process.env.EXPO_PUBLIC_APP_ENV ?? "development";
const isProductionBuild = appEnv === "production" || process.env.EAS_BUILD_PROFILE === "production";
const buildPlatform = process.env.EAS_BUILD_PLATFORM;
const apiUrl = process.env.EXPO_PUBLIC_API_URL ?? "https://thecurator-production-1b47.up.railway.app";
const easProjectId = process.env.EXPO_PUBLIC_EAS_PROJECT_ID ?? "584dd577-0bcb-4201-bb11-6f81bc75cc00";

if (firebaseAndroidPackage !== packageName) {
  throw new Error(
    "EXPO_PUBLIC_FIREBASE_ANDROID_PACKAGE must match EXPO_PUBLIC_ANDROID_PACKAGE.",
  );
}

if (firebaseIosBundleId !== bundleId) {
  throw new Error(
    "EXPO_PUBLIC_FIREBASE_IOS_BUNDLE_ID must match EXPO_PUBLIC_APP_BUNDLE_ID.",
  );
}

if (isProductionBuild) {
  const isAndroidBuild = !buildPlatform || buildPlatform === "android";
  const isIosBuild = !buildPlatform || buildPlatform === "ios";
  const requiredEnv = [
    "EXPO_PUBLIC_API_URL",
    "EXPO_PUBLIC_EAS_PROJECT_ID",
    "EXPO_PUBLIC_FIREBASE_API_KEY",
    "EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN",
    "EXPO_PUBLIC_FIREBASE_PROJECT_ID",
    "EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET",
    "EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID",
    "EXPO_PUBLIC_FIREBASE_APP_ID",
    "EXPO_PUBLIC_SENTRY_DSN",
    "SENTRY_ORG",
    "SENTRY_PROJECT",
    "SENTRY_AUTH_TOKEN",
    "EXPO_PUBLIC_RC_BASIC_PRODUCT_ID",
    "EXPO_PUBLIC_RC_PREMIUM_PRODUCT_ID",
    "EXPO_PUBLIC_RC_LIFETIME_PRODUCT_ID",
  ].filter((key) => !process.env[key]);

  if (isAndroidBuild && !process.env.EXPO_PUBLIC_RC_ANDROID_KEY) {
    requiredEnv.push("EXPO_PUBLIC_RC_ANDROID_KEY");
  }

  if (isIosBuild && !process.env.EXPO_PUBLIC_RC_IOS_KEY) {
    requiredEnv.push("EXPO_PUBLIC_RC_IOS_KEY");
  }

  if (requiredEnv.length > 0) {
    throw new Error(`Production mobile build is missing required env: ${requiredEnv.join(", ")}`);
  }

  if (!apiUrl?.startsWith("https://")) {
    throw new Error("Production mobile build requires EXPO_PUBLIC_API_URL to use HTTPS.");
  }

  if (
    process.env.EXPO_PUBLIC_MOCK_BACKEND === "true" ||
    process.env.EXPO_PUBLIC_MOCK_PREMIUM === "true" ||
    process.env.EXPO_PUBLIC_DEV_BYPASS_AUTH === "true"
  ) {
    throw new Error("Production mobile build cannot enable mock backend, mock premium, or auth bypass flags.");
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
    permissions: [],
    blockedPermissions: ["android.permission.RECORD_AUDIO"],
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
    "expo-notifications",
    [
      "@sentry/react-native/expo",
      {
        autoUploadSourceMaps: isProductionBuild,
        organization: process.env.SENTRY_ORG,
        project: process.env.SENTRY_PROJECT,
      },
    ],
    "expo-web-browser",
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
