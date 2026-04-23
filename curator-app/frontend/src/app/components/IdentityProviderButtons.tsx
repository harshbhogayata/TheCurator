import { Apple, Chrome } from "lucide-react";
import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import {
  beginEntraRedirect,
  type EntraIntentMode,
  type EntraProvider,
} from "../lib/entraAuth";

const providers = [
  {
    icon: Chrome,
    id: "google" as const,
    label: "Google",
  },
  {
    icon: Apple,
    id: "apple" as const,
    label: "Apple",
  },
];

export function IdentityProviderButtons({ mode }: { mode: EntraIntentMode }) {
  const { providerAvailability } = useAuth();
  const [error, setError] = useState("");
  const [pendingProvider, setPendingProvider] = useState<EntraProvider | null>(null);

  if (!providerAvailability.entra) {
    return null;
  }

  const enabledProviders = providers.filter((provider) => providerAvailability[provider.id]);

  if (enabledProviders.length === 0) {
    return null;
  }

  const actionLabel = mode === "link" ? "Connect" : "Continue with";

  const handleClick = async (provider: EntraProvider) => {
    setError("");
    setPendingProvider(provider);

    try {
      await beginEntraRedirect(mode, provider);
    } catch (err) {
      setPendingProvider(null);
      setError(
        err instanceof Error
          ? err.message
          : "We couldn't start Microsoft Entra sign-in right now.",
      );
    }
  };

  return (
    <div className="space-y-3">
      {enabledProviders.map((provider) => {
        const Icon = provider.icon;
        const isBusy = pendingProvider === provider.id;

        return (
          <button
            key={provider.id}
            onClick={() => void handleClick(provider.id)}
            disabled={pendingProvider !== null}
            className="w-full rounded-full border border-outline-variant/20 bg-surface-container-lowest/70 px-6 py-4 text-on-surface shadow-sm transition-all duration-300 hover:bg-surface-container-low disabled:cursor-not-allowed disabled:opacity-60"
          >
            <span className="flex items-center justify-center gap-3 font-medium">
              <Icon className="h-5 w-5" />
              {isBusy ? `${actionLabel} ${provider.label}...` : `${actionLabel} ${provider.label}`}
            </span>
          </button>
        );
      })}

      <p className="px-2 text-center text-xs uppercase tracking-[0.18em] text-outline">
        Secured by Microsoft Entra External ID
      </p>

      {error && (
        <div className="rounded-[28px] border border-error/20 bg-error-container/60 px-4 py-3 text-sm text-on-error-container">
          {error}
        </div>
      )}
    </div>
  );
}
