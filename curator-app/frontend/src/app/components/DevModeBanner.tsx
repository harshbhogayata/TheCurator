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
    <div
      className="fixed bottom-3 left-3 z-[100] rounded-full border border-amber-400/30 bg-amber-500/90 px-3 py-1.5 text-[10px] font-semibold tracking-wide text-amber-950 shadow-lg backdrop-blur-sm"
      role="status"
    >
      DEV · {flags.join(" · ")}
    </div>
  );
}
