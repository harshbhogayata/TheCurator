import { useEffect } from "react";
import { Platform } from "react-native";
import * as Device from "expo-device";
import * as Notifications from "expo-notifications";
import Constants from "expo-constants";
import AsyncStorage from "@react-native-async-storage/async-storage";

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

export function usePushNotifications() {
  const { status, session } = useAuth();
  const MOCK_BACKEND = __DEV__ && process.env.EXPO_PUBLIC_MOCK_BACKEND === "true";

  useEffect(() => {
    if (MOCK_BACKEND) {
      void AsyncStorage.removeItem(DEVICE_ID_KEY);
      return;
    }

    if (status !== "signed-in" || !session?.preferences.pushEnabled) {
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
          const { status } = await Notifications.requestPermissionsAsync();
          finalStatus = status;
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
  }, [status, session?.preferences.pushEnabled]);
}
