import type { ReactNode } from "react";

export type OnboardingVisualStep = "account" | "categories" | "appearance" | "reading";

const STEPS: { key: OnboardingVisualStep; label: string; hint: string }[] = [
  { key: "account", label: "Profile", hint: "How we greet you" },
  { key: "categories", label: "Interests", hint: "Shape your feed" },
  { key: "appearance", label: "Experience", hint: "Theme & alerts" },
  { key: "reading", label: "Reading", hint: "Your ritual" },
];

function stepIndex(step: OnboardingVisualStep) {
  return STEPS.findIndex((s) => s.key === step);
}

interface OnboardingShellProps {
  activeStep: OnboardingVisualStep;
  title: string;
  description: string;
  children: ReactNode;
  preview?: ReactNode;
  footer?: ReactNode;
  banners?: ReactNode;
}

export function OnboardingShell({
  activeStep,
  title,
  description,
  children,
  preview,
  footer,
  banners,
}: OnboardingShellProps) {
  const activeIndex = stepIndex(activeStep);

  return (
    <div className="curator-shell mesh-gradient min-h-[100dvh]">
      <div className="mx-auto flex min-h-[100dvh] w-full max-w-[1440px] flex-col lg:grid lg:grid-cols-[minmax(220px,260px)_minmax(0,1fr)_minmax(0,340px)] lg:gap-0">
        {/* Left rail — desktop step navigator (app shows only a progress bar) */}
        <aside className="hidden border-r border-outline-variant/10 px-8 py-10 lg:flex lg:flex-col lg:justify-between">
          <div className="space-y-8">
            <div>
              <p className="font-[family-name:var(--font-headline)] text-base italic text-on-surface-variant">
                The Curator
              </p>
              <p className="mt-1 text-xs uppercase tracking-[0.2em] text-outline">
                Setup
              </p>
            </div>

            <nav className="space-y-1" aria-label="Onboarding progress">
              {STEPS.map((step, index) => {
                const isActive = index === activeIndex;
                const isComplete = index < activeIndex;

                return (
                  <div
                    key={step.key}
                    className={`flex items-start gap-3 rounded-2xl px-3 py-3 transition-colors ${
                      isActive ? "bg-surface-container-low" : ""
                    }`}
                  >
                    <div
                      className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${
                        isComplete
                          ? "bg-primary text-primary-foreground"
                          : isActive
                            ? "border-2 border-primary bg-surface text-primary"
                            : "border border-outline-variant/25 bg-surface-container-lowest text-outline"
                      }`}
                    >
                      {isComplete ? "✓" : index + 1}
                    </div>
                    <div className="min-w-0 pt-0.5">
                      <p
                        className={`text-sm font-medium ${
                          isActive ? "text-on-surface" : "text-on-surface-variant"
                        }`}
                      >
                        {step.label}
                      </p>
                      <p className="text-xs text-outline">{step.hint}</p>
                    </div>
                  </div>
                );
              })}
            </nav>
          </div>

          <p className="text-xs text-outline">
            Step {activeIndex + 1} of {STEPS.length}
          </p>
        </aside>

        {/* Main canvas */}
        <main className="flex min-h-0 flex-1 flex-col px-5 pb-6 pt-6 sm:px-8 lg:px-10 lg:py-10">
          {/* Mobile progress — compact version of app */}
          <div className="mb-6 lg:hidden">
            <div className="mb-2 flex gap-2">
              {STEPS.map((step, index) => (
                <div
                  key={step.key}
                  className={`h-1 flex-1 rounded-full transition-colors ${
                    index <= activeIndex ? "bg-primary" : "bg-surface-container-high"
                  }`}
                />
              ))}
            </div>
            <p className="text-right text-xs text-outline">
              Step {activeIndex + 1} of {STEPS.length}
            </p>
          </div>

          <header className="mb-6 max-w-3xl space-y-3 lg:mb-8">
            <h1 className="font-[family-name:var(--font-headline)] text-[clamp(1.75rem,4vw,2.75rem)] italic leading-[1.12] tracking-tight text-on-surface">
              {title}
            </h1>
            <p className="max-w-2xl text-base leading-relaxed text-on-surface-variant lg:text-lg">
              {description}
            </p>
          </header>

          {banners ? <div className="mb-5 max-w-3xl space-y-2">{banners}</div> : null}

          <div className="flex min-h-0 flex-1 flex-col">
            <div className="flex-1">{children}</div>
            {footer ? (
              <div className="sticky bottom-0 z-30 mt-8 border-t border-outline-variant/10 bg-background/80 pt-5 backdrop-blur-md lg:static lg:border-0 lg:bg-transparent lg:pt-6 lg:backdrop-blur-none">
                {footer}
              </div>
            ) : null}
          </div>
        </main>

        {/* Right preview panel — web-only richness */}
        <aside className="hidden border-l border-outline-variant/10 px-8 py-10 xl:block">
          {preview ?? (
            <div className="flex h-full items-center justify-center">
              <p className="text-center text-sm text-outline">Preview updates as you choose.</p>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}

interface OnboardingCompletionShellProps {
  children: ReactNode;
}

export function OnboardingCompletionShell({ children }: OnboardingCompletionShellProps) {
  return (
    <div className="curator-shell mesh-gradient flex min-h-[100dvh] items-center justify-center px-5 py-10 sm:px-8">
      <div className="w-full max-w-3xl">{children}</div>
    </div>
  );
}
