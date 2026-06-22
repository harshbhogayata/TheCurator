/** Dev-only flags from Expo public env. */
export const mockBackendEnabled =
  __DEV__ && process.env.EXPO_PUBLIC_MOCK_BACKEND === "true";

export const mockPremiumEnabled =
  __DEV__ && process.env.EXPO_PUBLIC_MOCK_PREMIUM === "true";

export const devBypassAuthEnabled =
  __DEV__ && process.env.EXPO_PUBLIC_DEV_BYPASS_AUTH === "true";

/** Skip auth gates in the router — requires mock backend so API calls use local data. */
export const skipAuthGate = devBypassAuthEnabled && mockBackendEnabled;
