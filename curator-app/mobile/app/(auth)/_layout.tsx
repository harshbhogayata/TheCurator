import { Redirect, Stack, useSegments } from "expo-router";

import { useAuth } from "../../src/providers/auth-provider";
import { useTheme } from "../../src/providers/theme-provider";

export default function AuthLayout() {
  const { palette } = useTheme();
  const { status, session } = useAuth();
  const segments = useSegments();
  const currentScreen = segments[segments.length - 1];

  if (status === "signed-in" && session) {
    if (!session.onboarding.isCompleted && currentScreen !== "onboarding") {
      return <Redirect href="/(auth)/onboarding" />;
    }
    if (session.onboarding.isCompleted) {
      return <Redirect href="/(app)/(tabs)" />;
    }
  }

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: "fade",
        animationDuration: 260,
        contentStyle: { backgroundColor: palette.background },
      }}
    />
  );
}
