import { useFocusEffect, useRouter } from "expo-router";
import { useCallback } from "react";
import { BackHandler, Platform } from "react-native";

/**
 * On Android, map the system back gesture to in-app navigation when possible
 * instead of exiting the app from auth/onboarding stacks.
 */
export function useAndroidBackNavigation(fallbackHref?: string) {
  const router = useRouter();

  useFocusEffect(
    useCallback(() => {
      if (Platform.OS !== "android") {
        return;
      }

      const onBackPress = () => {
        if (router.canGoBack()) {
          router.back();
          return true;
        }
        if (fallbackHref) {
          router.replace(fallbackHref as never);
          return true;
        }
        return false;
      };

      const subscription = BackHandler.addEventListener("hardwareBackPress", onBackPress);
      return () => subscription.remove();
    }, [fallbackHref, router]),
  );
}
