import "../global.css";

import { useFonts as useNewsreader } from "@expo-google-fonts/newsreader/useFonts";
import { useFonts as useManrope } from "@expo-google-fonts/manrope/useFonts";
import { Newsreader_400Regular } from "@expo-google-fonts/newsreader/400Regular";
import { Newsreader_400Regular_Italic } from "@expo-google-fonts/newsreader/400Regular_Italic";
import { Newsreader_500Medium } from "@expo-google-fonts/newsreader/500Medium";
import { Newsreader_500Medium_Italic } from "@expo-google-fonts/newsreader/500Medium_Italic";
import { Newsreader_700Bold } from "@expo-google-fonts/newsreader/700Bold";
import { Newsreader_700Bold_Italic } from "@expo-google-fonts/newsreader/700Bold_Italic";
import { Manrope_400Regular } from "@expo-google-fonts/manrope/400Regular";
import { Manrope_500Medium } from "@expo-google-fonts/manrope/500Medium";
import { Manrope_600SemiBold } from "@expo-google-fonts/manrope/600SemiBold";
import { Manrope_700Bold } from "@expo-google-fonts/manrope/700Bold";
import * as SplashScreen from "expo-splash-screen";
import { Stack, useNavigationContainerRef } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import * as Sentry from "@sentry/react-native";

import { AppProviders } from "../src/providers/app-providers";
import { useTheme } from "../src/providers/theme-provider";
import { ToastDisplay } from "../src/ui/toast";

const sentryDsn = process.env.EXPO_PUBLIC_SENTRY_DSN;
const sentryEnabled = Boolean(sentryDsn);
const navigationIntegration = sentryEnabled
  ? Sentry.reactNavigationIntegration({
      enableTimeToInitialDisplay: true,
    })
  : null;

if (sentryEnabled) {
  Sentry.init({
    dsn: sentryDsn,
    integrations: navigationIntegration ? [navigationIntegration] : [],
    tracesSampleRate: __DEV__ ? 1.0 : 0.2,
  });
}

SplashScreen.preventAutoHideAsync();

function RootNavigator() {
  const { resolvedTheme, palette, isThemeLoaded } = useTheme();

  useEffect(() => {
    if (isThemeLoaded) {
      SplashScreen.hideAsync();
    }
  }, [isThemeLoaded]);

  return (
    <>
      <StatusBar style={resolvedTheme === "dark" ? "light" : "dark"} />
      <Stack
        screenOptions={{
          headerShown: false,
          animation: "fade",
          animationDuration: 260,
          contentStyle: {
            backgroundColor: palette.background,
          },
        }}
      >
        <Stack.Screen name="index" />
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(app)" />
      </Stack>
      <ToastDisplay />
    </>
  );
}

function RootLayout() {
  const [newsreaderLoaded] = useNewsreader({
    Newsreader_400Regular,
    Newsreader_400Regular_Italic,
    Newsreader_500Medium,
    Newsreader_500Medium_Italic,
    Newsreader_700Bold,
    Newsreader_700Bold_Italic,
  });

  const [manropeLoaded] = useManrope({
    Manrope_400Regular,
    Manrope_500Medium,
    Manrope_600SemiBold,
    Manrope_700Bold,
  });

  const fontsLoaded = newsreaderLoaded && manropeLoaded;
  const ref = useNavigationContainerRef();

  useEffect(() => {
    if (ref && navigationIntegration) {
      navigationIntegration.registerNavigationContainer(ref);
    }
  }, [ref]);

  if (!fontsLoaded) {
    return null;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <AppProviders>
        <RootNavigator />
      </AppProviders>
    </GestureHandlerRootView>
  );
}

const Root = sentryEnabled ? Sentry.wrap(RootLayout) : RootLayout;

export default Root;
