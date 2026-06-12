/** Dev-only flags from Expo public env. */
export const mockBackendEnabled =
  __DEV__ && process.env.EXPO_PUBLIC_MOCK_BACKEND === "true";

export const mockPremiumEnabled =
  __DEV__ && process.env.EXPO_PUBLIC_MOCK_PREMIUM === "true";
