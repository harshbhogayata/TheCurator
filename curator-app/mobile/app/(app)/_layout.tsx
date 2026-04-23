import { Redirect, Stack } from "expo-router";

import { useAuth } from "../../src/providers/auth-provider";
import { useTheme } from "../../src/providers/theme-provider";
import { AudioMiniPlayer } from "../../src/ui/audio-mini-player";
import { LoadingScreen } from "../../src/ui/loading-screen";

export default function AppLayout() {
  const { palette } = useTheme();
  const { session, status } = useAuth();

  if (status === "loading") {
    return (
      <LoadingScreen
        title="Restoring your session"
        message="We're syncing your account before opening the app."
      />
    );
  }

  if (status === "signed-out" || !session) {
    return <Redirect href="/(auth)/welcome" />;
  }

  if (!session.onboarding.isCompleted) {
    return <Redirect href="/(auth)/onboarding" />;
  }

  const modalOptions = {
    presentation: "modal",
    animation: "fade",
  } as const;

  return (
    <>
      <Stack
        screenOptions={{
          headerShown: false,
          animation: "fade",
          animationDuration: 260,
          contentStyle: { backgroundColor: palette.background },
        }}
      >
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="menu" options={modalOptions} />
        <Stack.Screen name="settings" options={modalOptions} />
        <Stack.Screen name="profile" options={modalOptions} />
        <Stack.Screen name="article/[id]" />
        <Stack.Screen name="collection/[id]" />
        <Stack.Screen name="account" options={modalOptions} />
        <Stack.Screen name="connected-accounts" options={modalOptions} />
        <Stack.Screen name="donate" options={modalOptions} />
        <Stack.Screen name="about" options={modalOptions} />
        <Stack.Screen name="privacy" options={modalOptions} />
        <Stack.Screen name="help" options={modalOptions} />
        <Stack.Screen name="reading-stats" options={modalOptions} />
        <Stack.Screen name="language-region" options={modalOptions} />
        <Stack.Screen name="collections" options={modalOptions} />
      </Stack>
      <AudioMiniPlayer />
    </>
  );
}
