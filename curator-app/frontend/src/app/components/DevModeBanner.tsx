import { isDevModeActive, isDevBypassAuth, isMockBackend, isMockPremium } from "../../lib/dev-mode";

export function DevModeBanner() {
  if (!isDevModeActive()) {
    return null;
  }

  const flags = [
    isDevBypassAuth && "auth bypass",
    isMockBackend && "mock API",
    isMockPremium && "premium",
  ].filter(Boolean);

  return (
    <div className="fixed left-0 right-0 top-0 z-[100] bg-amber-500 px-3 py-1 text-center text-[11px] font-semibold tracking-wide text-amber-950">
      DEV MODE — {flags.join(" · ")}
    </div>
  );
}
