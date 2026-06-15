import { Redirect } from "expo-router";
import { Text, View } from "react-native";

import { useAuth } from "../src/providers/auth-provider";
import { useTheme } from "../src/providers/theme-provider";
import { useUIStore } from "../src/lib/store";
import { LoadingScreen } from "../src/ui/loading-screen";
import { PrimaryButton } from "../src/ui/primary-button";
import { Screen } from "../src/ui/screen";

// Set EXPO_PUBLIC_DEV_BYPASS_AUTH=true in .env to skip auth locally.
const DEV_BYPASS_AUTH = __DEV__ && process.env.EXPO_PUBLIC_DEV_BYPASS_AUTH === "true";

export default function IndexScreen() {
  const { status, session, refreshSession, dismissSessionError } = useAuth();
  const { globalError: errorMessage } = useUIStore();
  const { palette } = useTheme();

  // Dev bypass — skip auth entirely
  if (DEV_BYPASS_AUTH) {
    return <Redirect href="/(app)/(tabs)" />;
  }

  if (status === "loading") {
    return (
      <LoadingScreen message="Restoring your session and preferences." />
    );
  }

  if (status === "error") {
    return (
      <Screen className="justify-center">
        <View
          className="gap-5 rounded-[28px] border p-6"
          style={{ backgroundColor: palette.surfaceContainerLowest, borderColor: palette.border }}
        >
          <View className="gap-2">
            <Text
              className="text-[30px]"
              style={{ color: palette.onSurface, fontFamily: "Newsreader_700Bold" }}
            >
              We hit a session snag
            </Text>
            <Text className="text-base leading-6" style={{ color: palette.onSurfaceVariant }}>
              {errorMessage ??
                "Your account is safe. We just need one more clean sync with the API."}
            </Text>
          </View>
          <PrimaryButton label="Try again" onPress={refreshSession} />
          <PrimaryButton
            label="Return to welcome"
            variant="ghost"
            onPress={dismissSessionError}
          />
        </View>
      </Screen>
    );
  }

  if (status === "signed-out" || !session) {
    return <Redirect href="/(auth)/welcome" />;
  }

  return session.onboarding.isCompleted ? (
    <Redirect href="/(app)/(tabs)" />
  ) : (
    <Redirect href="/(auth)/onboarding" />
  );
}
