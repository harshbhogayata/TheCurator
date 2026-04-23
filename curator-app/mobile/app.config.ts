import type { ConfigContext, ExpoConfig } from "expo/config";

const appName = "Curator";
const appSlug = "curator-mobile";
const bundleId = process.env.EXPO_PUBLIC_APP_BUNDLE_ID ?? "com.curator.mobile";
const packageName = process.env.EXPO_PUBLIC_ANDROID_PACKAGE ?? "com.curator.mobile";

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
    supportsTablet: false,
    infoPlist: {
      CFBundleDisplayName: appName,
      UIBackgroundModes: ["audio"],
    },
  },
  android: {
    package: packageName,
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
    apiUrl: process.env.EXPO_PUBLIC_API_URL ?? "http://127.0.0.1:8000",
    eas: {
      projectId: process.env.EXPO_PUBLIC_EAS_PROJECT_ID,
    },
  },
});
