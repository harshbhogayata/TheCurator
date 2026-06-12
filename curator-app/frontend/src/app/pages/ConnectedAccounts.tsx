import { useEffect } from "react";
import { CheckCircle2, Link2, Mail, ShieldCheck } from "lucide-react";
import { useNavigate } from "react-router";
import { AppShell } from "../components/AppShell";
import { useAuth } from "../context/AuthContext";

const providerCopy = {
  email: {
    title: "Email & Password",
    description: "Primary account access for password resets and sign-in recovery.",
    icon: Mail,
  },
  google: {
    title: "Google",
    description: "Sign in with Google via Firebase. Linked at registration or from the welcome screen.",
    icon: Link2,
  },
  apple: {
    title: "Apple",
    description: "Sign in with Apple is available on iOS. Web accounts use email or Google.",
    icon: ShieldCheck,
  },
} as const;

export function ConnectedAccounts() {
  const navigate = useNavigate();
  const { authStatus, identities, isAuthenticated, user } = useAuth();

  useEffect(() => {
    if (authStatus === "unauthenticated") {
      navigate("/welcome", { replace: true });
    }
  }, [authStatus, navigate]);

  if (!isAuthenticated || !user) {
    return null;
  }

  const connectedProviders = new Set(identities.map((identity) => identity.provider));

  return (
    <AppShell title="Connected Accounts">
      <div className="mx-auto max-w-2xl space-y-6">
        <p className="px-4 text-center text-on-surface-variant">
          These are the sign-in methods linked to your Curator account. To add Google, sign out and
          use &quot;Continue with Google&quot; on the welcome screen.
        </p>

        <div className="space-y-4">
          {(["email", "google", "apple"] as const).map((provider) => {
            const copy = providerCopy[provider];
            const Icon = copy.icon;
            const isConnected =
              provider === "email" ? true : connectedProviders.has(provider);

            return (
              <div
                key={provider}
                className="rounded-[30px] border border-outline-variant/15 bg-surface-container-lowest/70 p-6 backdrop-blur-xl"
              >
                <div className="flex items-start gap-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary-container">
                    <Icon className="h-6 w-6 text-on-primary-container" />
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="mb-1 flex items-center gap-2">
                      <h3 className="font-[family-name:var(--font-headline)] text-lg text-on-surface">
                        {copy.title}
                      </h3>
                      {isConnected && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-primary-container px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-on-primary-container">
                          <CheckCircle2 className="h-3 w-3" />
                          Connected
                        </span>
                      )}
                    </div>
                    <p className="text-sm leading-relaxed text-on-surface-variant">{copy.description}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </AppShell>
  );
}
