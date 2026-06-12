/** Web Push subscription management (VAPID) for browser notifications. */

import { deactivateDevice, registerWebPushDevice } from "../services/mobile-api";

const DEVICE_ID_STORAGE_KEY = "curator.webPushDeviceId";

export function isWebPushSupported(): boolean {
  return (
    typeof window !== "undefined" &&
    "serviceWorker" in navigator &&
    "PushManager" in window &&
    "Notification" in window &&
    Boolean(import.meta.env.VITE_VAPID_PUBLIC_KEY)
  );
}

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  return Uint8Array.from(rawData, (char) => char.charCodeAt(0));
}

async function getRegistration(): Promise<ServiceWorkerRegistration> {
  const existing = await navigator.serviceWorker.getRegistration("/sw.js");
  if (existing) return existing;
  return navigator.serviceWorker.register("/sw.js");
}

export async function getWebPushSubscription(): Promise<PushSubscription | null> {
  if (!isWebPushSupported()) return null;
  const registration = await navigator.serviceWorker.getRegistration("/sw.js");
  if (!registration) return null;
  return registration.pushManager.getSubscription();
}

/** Asks permission, subscribes the browser, and registers the device with the API. */
export async function enableWebPush(): Promise<boolean> {
  if (!isWebPushSupported()) return false;

  const permission = await Notification.requestPermission();
  if (permission !== "granted") return false;

  const registration = await getRegistration();
  await navigator.serviceWorker.ready;

  const subscription =
    (await registration.pushManager.getSubscription()) ??
    (await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(
        import.meta.env.VITE_VAPID_PUBLIC_KEY as string,
      ) as unknown as BufferSource,
    }));

  const device = await registerWebPushDevice(subscription.toJSON());
  window.localStorage.setItem(DEVICE_ID_STORAGE_KEY, device.deviceId);
  return true;
}

/** Unsubscribes the browser and deactivates the device server-side. */
export async function disableWebPush(): Promise<void> {
  const subscription = await getWebPushSubscription();
  if (subscription) {
    await subscription.unsubscribe();
  }
  const deviceId = window.localStorage.getItem(DEVICE_ID_STORAGE_KEY);
  if (deviceId) {
    try {
      await deactivateDevice(deviceId);
    } catch {
      // Best-effort: the server prunes dead subscriptions on send failures too.
    }
    window.localStorage.removeItem(DEVICE_ID_STORAGE_KEY);
  }
}
