import { useState } from "react";
import { useNavigate } from "react-router";
import { ArrowLeft, CheckCircle, Mail } from "lucide-react";
import { useAuth } from "../context/AuthContext";

export function ForgotPassword() {
  const navigate = useNavigate();
  const { requestPasswordReset } = useAuth();
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [emailSent, setEmailSent] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const response = await requestPasswordReset(email);
      setPreviewUrl(response.previewUrl ?? null);
      setEmailSent(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to send reset instructions right now.");
    } finally {
      setIsLoading(false);
    }
  };

  if (emailSent) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-surface via-background to-surface-container-low flex items-center justify-center p-6">
        <div className="w-full max-w-md">
          <div className="bg-surface-container-lowest/70 backdrop-blur-xl border border-outline-variant/15 rounded-[60px] p-8 md:p-12 shadow-2xl text-center">
            <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-primary-container flex items-center justify-center">
              <CheckCircle className="w-10 h-10 text-on-primary-container" />
            </div>

            <h1 className="font-[family-name:var(--font-headline)] italic text-3xl text-on-surface mb-4">
              Check Your Email
            </h1>

            <p className="text-on-surface-variant mb-8 leading-relaxed">
              If an account exists for <strong className="text-on-surface">{email}</strong>, we
              have sent password reset instructions.
            </p>

            {previewUrl && (
              <div className="mb-8 rounded-[30px] border border-outline-variant/20 bg-surface-container-low p-5 text-left">
                <p className="text-sm text-on-surface mb-3">
                  Email delivery is not configured yet in this environment, so you can use the
                  preview reset link below.
                </p>
                <button
                  onClick={() => {
                    window.location.href = previewUrl;
                  }}
                  className="w-full bg-primary text-primary-foreground py-3 px-5 rounded-full font-medium transition-all hover:bg-primary-dim"
                >
                  Open Preview Reset Link
                </button>
              </div>
            )}

            <button
              onClick={() => navigate("/sign-in")}
              className="bg-inverse-surface text-white py-4 px-8 rounded-full font-medium tracking-wide hover:bg-zinc-800 transition-all active:scale-95"
            >
              Back to Sign In
            </button>

            <p className="mt-6 text-sm text-outline">
              Didn&apos;t receive the email?{" "}
              <button
                onClick={() => {
                  setEmailSent(false);
                  setPreviewUrl(null);
                }}
                className="text-primary hover:underline"
              >
                Try again
              </button>
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-surface via-background to-surface-container-low flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        <button
          onClick={() => navigate("/sign-in")}
          className="mb-8 flex items-center gap-2 text-on-surface-variant hover:text-on-surface transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>Back to Sign In</span>
        </button>

        <div className="bg-surface-container-lowest/70 backdrop-blur-xl border border-outline-variant/15 rounded-[60px] p-8 md:p-12 shadow-2xl">
          <div className="text-center mb-8">
            <h1 className="font-[family-name:var(--font-headline)] italic text-4xl md:text-5xl text-on-surface mb-3">
              Reset Password
            </h1>
            <p className="text-on-surface-variant">
              Enter your email and we&apos;ll send you a secure reset link.
            </p>
          </div>

          {error && (
            <div className="mb-6 bg-error-container/50 border border-error text-on-error-container rounded-[30px] p-4 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="bg-surface-container-low rounded-[30px] p-6 border border-outline-variant/15">
              <label className="flex items-center gap-3 mb-3 text-outline text-sm uppercase tracking-wider">
                <Mail className="w-4 h-4" />
                Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                required
                className="w-full bg-transparent text-on-surface text-lg focus:outline-none placeholder:text-outline/50"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-inverse-surface text-white py-5 px-10 rounded-full font-semibold tracking-wide shadow-xl hover:bg-zinc-800 transition-all duration-300 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? "Sending..." : "Send Reset Instructions"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
