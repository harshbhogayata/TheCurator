import { BookOpen, Heart, Zap } from "lucide-react";
import type { UserPreferences } from "../lib/types";
import { categoryOptions } from "../lib/types";

interface OnboardingPreviewProps {
  step: "account" | "categories" | "appearance" | "reading";
  displayName: string;
  selectedCategories: string[];
  preferences: UserPreferences;
}

const textSizeClass: Record<UserPreferences["textSize"], string> = {
  compact: "text-sm leading-relaxed",
  comfortable: "text-base leading-relaxed",
  large: "text-lg leading-relaxed",
};

export function OnboardingPreview({
  step,
  displayName,
  selectedCategories,
  preferences,
}: OnboardingPreviewProps) {
  const name = displayName.trim() || "Reader";
  const topics =
    selectedCategories.length > 0
      ? categoryOptions.filter((c) => selectedCategories.includes(c.key))
      : categoryOptions.slice(0, 3);

  return (
    <div className="flex h-full flex-col gap-5">
      <div>
        <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-outline">
          Live preview
        </p>
        <p className="mt-1 text-sm text-on-surface-variant">
          How your desk will feel once you&apos;re in.
        </p>
      </div>

      <div className="editorial-card flex flex-1 flex-col overflow-hidden p-0">
        {/* Mock masthead */}
        <div className="border-b border-outline-variant/10 px-5 py-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="font-[family-name:var(--font-headline)] text-sm italic text-on-surface-variant">
                The Curator
              </p>
              <p className="text-xs text-outline">Today&apos;s brief</p>
            </div>
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/15 text-sm font-semibold text-primary">
              {name.charAt(0).toUpperCase()}
            </div>
          </div>
        </div>

        <div className="flex flex-1 flex-col gap-4 p-5">
          {step === "account" && (
            <>
              <p className="font-[family-name:var(--font-headline)] text-2xl italic text-on-surface">
                Good morning, {name.split(" ")[0]}.
              </p>
              <p className="text-sm text-on-surface-variant">
                Your name appears in the masthead, saved items, and audio brief intros.
              </p>
            </>
          )}

          {(step === "categories" || step === "appearance" || step === "reading") && (
            <>
              <p className="font-[family-name:var(--font-headline)] text-xl italic text-on-surface">
                Your feed
              </p>
              <div className="flex flex-wrap gap-2">
                {topics.map((topic) => (
                  <span
                    key={topic.key}
                    className="rounded-full border border-outline-variant/15 bg-surface-container-low px-3 py-1 text-xs text-on-surface"
                  >
                    {topic.emoji} {topic.label}
                  </span>
                ))}
              </div>
            </>
          )}

          {(step === "appearance" || step === "reading") && (
            <div className="rounded-2xl border border-outline-variant/12 bg-surface-container-lowest p-4">
              <p className="mb-2 text-[11px] font-medium uppercase tracking-wider text-outline">
                Theme · {preferences.themePreference}
              </p>
              <p className="text-xs text-on-surface-variant">
                Alerts: {preferences.notificationFrequency.replace("_", " ")}
                {preferences.pushEnabled ? " · push on" : ""}
              </p>
            </div>
          )}

          {step === "reading" && (
            <div className="rounded-2xl border border-outline-variant/12 bg-surface-container-lowest p-4">
              <p className="mb-2 text-[11px] font-medium uppercase tracking-wider text-outline">
                Article preview
              </p>
              <p className={`text-on-surface ${textSizeClass[preferences.textSize]}`}>
                Markets steadied after central banks signaled patience. The Curator synthesizes
                reporting from ten global desks into one narrative you can read or hear.
              </p>
            </div>
          )}

          <div className="mt-auto grid grid-cols-3 gap-2">
            {[
              { Icon: BookOpen, label: "Briefs" },
              { Icon: Heart, label: "Saved" },
              { Icon: Zap, label: "Audio" },
            ].map(({ Icon, label }) => (
              <div
                key={label}
                className="flex flex-col items-center gap-1 rounded-xl border border-outline-variant/10 bg-surface-container-low px-2 py-3"
              >
                <Icon className="h-4 w-4 text-primary" />
                <span className="text-[10px] text-outline">{label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
