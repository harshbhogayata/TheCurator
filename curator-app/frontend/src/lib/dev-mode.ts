const isDev = import.meta.env.DEV;

export const isMockBackend = isDev && import.meta.env.VITE_MOCK_BACKEND === "true";
export const isMockPremium = isDev && import.meta.env.VITE_MOCK_PREMIUM === "true";
export const isDevBypassAuth = isDev && import.meta.env.VITE_DEV_BYPASS_AUTH === "true";
export const isMobileLayout = isDev && import.meta.env.VITE_MOBILE_LAYOUT === "true";

export function isDevModeActive(): boolean {
  return isMockBackend || isMockPremium || isDevBypassAuth;
}
