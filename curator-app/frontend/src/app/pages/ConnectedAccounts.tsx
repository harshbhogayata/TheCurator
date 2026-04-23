import { useEffect, useState } from "react";
import { ArrowLeft, CheckCircle2, KeyRound, Link2, Mail, ShieldCheck } from "lucide-react";
import { useNavigate } from "react-router";
import { BottomNav } from "../components/BottomNav";
import { useAuth } from "../context/AuthContext";
import { beginEntraRedirect } from "../lib/entraAuth";

const providerCopy = {
  email: {
    title: "Email & Password",
    description: "Primary account access for password resets and sign-in recovery.",
    icon: Mail,
  },
  google: {
    title: "Google",
    description: "Sign in with Google and keep your onboarding and preferences in sync.",
    icon: Link2,
  },
  apple: {
    title: "Apple",
    description: "Sign in with Apple and keep access consistent across Apple devices.",
    icon: ShieldCheck,
  },
} as const;

export function ConnectedAccounts() {
  const navigate = useNavigate();
  const { authStatus, identities, isAuthenticated, providerAvailability, user } = useAuth();
  const [pendingProvider, setPendingProvider] = useState<"google" | "apple" | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (authStatus === "unauthenticated") {
      navigate("/", { replace: true });
    }
  }, [authStatus, navigate]);

  if (!isAuthenticated || !user) {
    return null;
  }

  const connectedProviders = new Set(identities.map((identity) => identity.provider));

  return (
    <div className="min-h-screen bg-gradient-to-br from-surface via-background to-surface-container-low pb-32">
      <header className="fixed top-0 w-full z-50 pt-6 px-6">
        <div className="flex items-center gap-3">
          <div className="rounded-full border-2 border-outline-variant/30 bg-surface-container-lowest/80 backdrop-blur-2xl shadow-[0_4px_16px_rgba(0,0,0,0.12)] p-0.5">
            <button
              onClick={() => navigate("/settings")}
              className="w-10 h-10 rounded-full hover:bg-surface-container/40 flex items-center justify-center transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-on-surface" />
            </button>
          </div>

          <div className="flex-1 rounded-full border-2 border-outline-variant/30 bg-surface-container-lowest/80 backdrop-blur-2xl shadow-[0_4px_16px_rgba(0,0,0,0.12)] px-6 py-2.5">
            <h1 className="text-2xl font-[family-name:var(--font-headline)] italic tracking-tight text-on-surface text-center">
              Connected Accounts
            </h1>
          </div>
        </div>
      </header>

      <main className="pt-32 px-6 max-w-3xl mx-auto">
        <p className="text-on-surface-variant text-center mb-8 px-4">
          Link the providers you want available at sign-in. Google and Apple now route through
          Microsoft Entra External ID, so onboarding and account state stay unified.
        </p>

        {error && (
          <div className="mb-6 rounded-[28px] border border-error/20 bg-error-container/60 px-5 py-4 text-sm text-on-error-container">
            {error}
          </div>
        )}

        <div className="space-y-4 mb-8">
          {(["email", "google", "apple"] as const).map((provider) => {
            const copy = providerCopy[provider];
            const Icon = copy.icon;
            const isConnected =
              provider === "email" ? true : connectedProviders.has(provider);
            const isConfigured =
              provider === "email"
                ? true
                : providerAvailability.entra && providerAvailability[provider] === true;

            const handleConnect = async () => {
              if (provider === "email" || !isConfigured || isConnected) {
                return;
              }

              setError("");
              setPendingProvider(provider);

              try {
                await beginEntraRedirect("link", provider);
              } catch (error) {
                console.error(error);
                setError(
                  error instanceof Error
                    ? error.message
                    : `We couldn't start ${copy.title} linking right now.`,
                );
                setPendingProvider(null);
              }
            };

            return (
              <div
                key={provider}
                className="bg-surface-container-lowest/70 backdrop-blur-xl border border-outline-variant/15 rounded-[30px] p-6"
              >
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-primary-container flex items-center justify-center shrink-0">
                    <Icon className="w-6 h-6 text-on-primary-container" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-1">
                      <h3 className="text-on-surface font-medium">{copy.title}</h3>
                      {isConnected && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          Connected
                        </span>
                      )}
                    </div>

                    <p className="text-outline text-sm mb-3">{copy.description}</p>

                    <div className="flex flex-wrap gap-2 text-xs">
                      {provider === "email" && (
                        <span className="rounded-full bg-surface-container px-3 py-1 text-on-surface">
                          {user.email}
                        </span>
                      )}

                      {provider !== "email" && (
                        <span
                          className={`rounded-full px-3 py-1 ${
                            isConfigured
                              ? "bg-surface-container text-on-surface"
                              : "bg-surface-container-low text-outline"
                          }`}
                        >
                          {isConfigured ? "Available in Entra" : "Enable in Entra tenant"}
                        </span>
                      )}
                    </div>
                  </div>

                  {provider === "email" ? (
                    <div className="shrink-0 rounded-full border border-outline-variant/20 px-4 py-2 text-sm text-on-surface-variant">
                      Primary
                    </div>
                  ) : (
                    <button
                      onClick={() => void handleConnect()}
                      disabled={!isConfigured || isConnected || pendingProvider !== null}
                      className="shrink-0 rounded-full border border-outline-variant/20 px-4 py-2 text-sm text-on-surface-variant transition-colors hover:bg-surface-container disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {isConnected
                        ? "Connected"
                        : pendingProvider === provider
                          ? "Connecting..."
                          : isConfigured
                            ? "Connect"
                            : "Setup"}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        <div className="bg-secondary-container/30 backdrop-blur-xl border border-outline-variant/15 rounded-[40px] p-6">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
              <KeyRound className="w-5 h-5 text-primary" />
            </div>
            <h3 className="font-[family-name:var(--font-headline)] text-lg text-on-surface">
              Security Posture
            </h3>
          </div>
          <p className="text-on-surface-variant text-sm leading-relaxed">
            Curator now uses account-level identity records and protected redirect callbacks. The
            remaining step before live verification is wiring your real Entra tenant, Google, and
            Apple credentials into the environment.
          </p>
        </div>
      </main>

      <BottomNav />
    </div>
  );
}
