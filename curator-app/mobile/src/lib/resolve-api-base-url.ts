import Constants from "expo-constants";

function devMachineHost(): string | null {
  const debuggerHost =
    Constants.expoGoConfig?.debuggerHost ??
    Constants.expoConfig?.hostUri?.replace(/^https?:\/\//, "");

  if (!debuggerHost) {
    return null;
  }

  return debuggerHost.split(":")[0] || null;
}

function isLoopbackHost(hostname: string): boolean {
  return hostname === "127.0.0.1" || hostname === "localhost";
}

/**
 * In Expo Go on a physical device, localhost points at the phone — not your dev machine.
 * When the configured API URL uses loopback, swap in the Metro bundler host instead.
 */
export function resolveApiBaseUrl(configured: string): string {
  const trimmed = configured.trim().replace(/\/$/, "");
  const fallback = trimmed || "http://127.0.0.1:8000";

  if (!__DEV__) {
    return fallback;
  }

  try {
    const url = new URL(fallback);
    if (!isLoopbackHost(url.hostname)) {
      return fallback;
    }

    const host = devMachineHost();
    if (!host) {
      return fallback;
    }

    url.hostname = host;
    return url.toString().replace(/\/$/, "");
  } catch {
    return fallback;
  }
}
