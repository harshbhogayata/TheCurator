import { useEffect, useRef } from "react";
import { Platform } from "react-native";
import * as Device from "expo-device";
import * as Notifications from "expo-notifications";
import Constants from "expo-constants";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";

import { useAuth } from "../providers/auth-provider";
import { registerDevice, unregisterDevice } from "../services/mobile-api";

const DEVICE_ID_KEY = "curator.device-id";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldShowBanner: true,
    shouldShowList: true,
    shouldSetBadge: false,
  }),
});

function routeFromNotificationUrl(router: ReturnType<typeof useRouter>, url: unknown) {
  if (typeof url !== "string" || !url.trim()) {
    return;
  }

  const path = url.trim();
  const articleMatch = path.match(/\/article\/([^/?#]+)/i);
  if (articleMatch?.[1]) {
    router.push(`/(app)/article/${articleMatch[1]}`);
    return;
  }

  if (path.startsWith("/brief") || path.includes("/brief/")) {
    router.push("/(app)/(tabs)");
  }
}

export function usePushNotifications() {
  const router = useRouter();
  const { status, session } = useAuth();
  const handledColdStart = useRef(false);
  const MOCK_BACKEND = __DEV__ && process.env.EXPO_PUBLIC_MOCK_BACKEND === "true";

  useEffect(() => {
    if (MOCK_BACKEND || status !== "signed-in" || !session) {
      return;
    }

    const responseSub = Notifications.addNotificationResponseReceivedListener((response) => {
      const url = response.notification.request.content.data?.url;
      routeFromNotificationUrl(router, url);
    });

    if (!handledColdStart.current) {
      handledColdStart.current = true;
      void Notifications.getLastNotificationResponseAsync().then((response) => {
        if (!response) return;
        const url = response.notification.request.content.data?.url;
        routeFromNotificationUrl(router, url);
      });
    }

    return () => {
      responseSub.remove();
    };
  }, [MOCK_BACKEND, router, session, status]);

  useEffect(() => {
    if (MOCK_BACKEND) {
      void AsyncStorage.removeItem(DEVICE_ID_KEY);
      return;
    }

    if (status === "signed-out" || !session) {
      let cancelled = false;
      AsyncStorage.getItem(DEVICE_ID_KEY)
        .then((deviceId) => {
          if (!deviceId || cancelled) {
            return;
          }
          return unregisterDevice(deviceId)
            .catch(() => {})
            .finally(() => AsyncStorage.removeItem(DEVICE_ID_KEY));
        });
      return () => {
        cancelled = true;
      };
    }

    if (!session.preferences.pushEnabled) {
      let cancelled = false;
      AsyncStorage.getItem(DEVICE_ID_KEY)
        .then((deviceId) => {
          if (!deviceId || cancelled) {
            return;
          }
          return unregisterDevice(deviceId)
            .catch(() => {})
            .finally(() => AsyncStorage.removeItem(DEVICE_ID_KEY));
        });
      return () => {
        cancelled = true;
      };
    }

    let isMounted = true;

    async function registerForPushNotificationsAsync() {
      if (Platform.OS === "android") {
        await Notifications.setNotificationChannelAsync("default", {
          name: "default",
          importance: Notifications.AndroidImportance.MAX,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: "#FF231F7C",
        });
      }

      if (Device.isDevice) {
        const { status: existingStatus } = await Notifications.getPermissionsAsync();
        let finalStatus = existingStatus;

        if (existingStatus !== "granted") {
          const { status: permissionStatus } = await Notifications.requestPermissionsAsync();
          finalStatus = permissionStatus;
        }

        if (finalStatus !== "granted") {
          return;
        }

        const projectId =
          Constants?.expoConfig?.extra?.eas?.projectId ?? Constants?.easConfig?.projectId;

        if (!projectId) {
          console.warn("Project ID not found in app.json. Push notifications need an EAS project ID.");
          return;
        }

        try {
          const token = (
            await Notifications.getExpoPushTokenAsync({
              projectId,
            })
          ).data;

          if (isMounted && token) {
            const storedDeviceId = await AsyncStorage.getItem(DEVICE_ID_KEY);
            const payload = await registerDevice({
              expoPushToken: token,
              platform: Platform.OS === "ios" ? "ios" : Platform.OS === "android" ? "android" : "web",
              appVersion: Constants.expoConfig?.version || "1.0.0",
              deviceId: storedDeviceId ?? undefined,
            });
            const nextDeviceId = payload?.deviceId ?? payload?.id;
            if (nextDeviceId) {
              await AsyncStorage.setItem(DEVICE_ID_KEY, nextDeviceId);
            }
          }
        } catch (error) {
          console.error("Error getting push token:", error);
        }
      }
    }

    void registerForPushNotificationsAsync();

    return () => {
      isMounted = false;
    };
  }, [status, session, session?.preferences.pushEnabled]);
}
