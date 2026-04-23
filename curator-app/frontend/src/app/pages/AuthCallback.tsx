import { useEffect, useRef, useState } from "react";
import { LoaderCircle } from "lucide-react";
import { useNavigate } from "react-router";
import { useAuth } from "../context/AuthContext";
import { handleEntraRedirectCallback } from "../lib/entraAuth";

export function AuthCallback() {
  const navigate = useNavigate();
  const { authStatus, exchangeEntraSession, linkIdentity } = useAuth();
  const [error, setError] = useState("");
  const [statusText, setStatusText] = useState("Securing your Curator session...");
  const hasStarted = useRef(false);

  useEffect(() => {
    if (authStatus === "loading" || hasStarted.current) {
      return;
    }

    hasStarted.current = true;

    const run = async () => {
      try {
        const { intent, result } = await handleEntraRedirectCallback();

        if (!result?.idToken) {
          throw new Error("We couldn't complete that Microsoft Entra sign-in. Please try again.");
        }

        if (intent?.mode === "link") {
          if (authStatus !== "authenticated") {
            throw new Error("Sign in to Curator before connecting another identity provider.");
          }

          setStatusText("Connecting your provider...");
          await linkIdentity(result.idToken, intent.provider);
          navigate("/connected-accounts", { replace: true });
          return;
        }

        setStatusText("Preparing your personalized session...");
        const session = await exchangeEntraSession(result.idToken, intent?.provider ?? "entra");
        navigate(session.onboarding.completed ? "/home" : "/onboarding", { replace: true });
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "We couldn't finish that Microsoft Entra sign-in right now.",
        );
      }
    };

    void run();
  }, [authStatus, exchangeEntraSession, linkIdentity, navigate]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-surface via-background to-surface-container-low flex items-center justify-center p-6">
      <div className="w-full max-w-md rounded-[48px] border border-outline-variant/15 bg-surface-container-lowest/80 p-10 text-center shadow-2xl backdrop-blur-2xl">
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
          <LoaderCircle className="h-8 w-8 animate-spin text-primary" />
        </div>
        <h1 className="mb-3 font-[family-name:var(--font-headline)] italic text-4xl text-on-surface">
          One Moment
        </h1>
        <p className="text-on-surface-variant">{statusText}</p>

        {error && (
          <div className="mt-6 rounded-[28px] border border-error/20 bg-error-container/60 px-5 py-4 text-sm text-on-error-container">
            {error}
          </div>
        )}
      </div>
    </div>
  );
}
