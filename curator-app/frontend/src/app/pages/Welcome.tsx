import { useEffect } from "react";
import { useNavigate } from "react-router";
import { ArrowRight } from "lucide-react";
import { ImageWithFallback } from "../components/figma/ImageWithFallback";
import { useAuth } from "../context/AuthContext";
import { isDevBypassAuth } from "../../lib/dev-mode";
import { IMAGES } from "../constants/images";
import { AuthScreenLayout } from "../../ui/auth-screen-layout";
import { PrimaryButton } from "../../ui/primary-button";

const TRUST_BADGE_TEXT = "12k+ Readers";

function WelcomeHero() {
  return (
    <div className="pointer-events-none flex w-full flex-col items-center gap-4 text-center lg:items-start lg:text-left">
        <div className="relative mx-auto h-[220px] w-[300px] max-w-full lg:mx-0">
        <div
          className="absolute left-3 top-0 h-[186px] w-[148px] overflow-hidden border-[1.5px] border-outline-variant/25 shadow-xl"
          style={{
            borderTopLeftRadius: 64,
            borderTopRightRadius: 24,
            borderBottomRightRadius: 48,
            borderBottomLeftRadius: 32,
            transform: "rotate(-8deg)",
          }}
        >
          <ImageWithFallback src={IMAGES.editorial.brief} alt="" className="h-full w-full object-cover" />
        </div>
        <div
          className="absolute right-2 top-5 h-[164px] w-[136px] overflow-hidden border-[1.5px] border-outline-variant/25 shadow-xl"
          style={{
            borderTopLeftRadius: 32,
            borderTopRightRadius: 56,
            borderBottomRightRadius: 32,
            borderBottomLeftRadius: 52,
            transform: "rotate(6deg)",
          }}
        >
          <ImageWithFallback src={IMAGES.editorial.technology} alt="" className="h-full w-full object-cover" />
        </div>
        <div
          className="absolute bottom-0 left-14 h-[88px] w-[128px] overflow-hidden border-[1.5px] border-outline-variant/25 shadow-xl"
          style={{
            borderTopLeftRadius: 24,
            borderTopRightRadius: 40,
            borderBottomRightRadius: 52,
            borderBottomLeftRadius: 24,
            transform: "rotate(2deg)",
          }}
        >
          <ImageWithFallback src={IMAGES.editorial.economy} alt="" className="h-full w-full object-cover" />
        </div>
      </div>

      <p className="font-[family-name:var(--font-headline)] text-lg italic text-on-surface-variant">
        The Curator
      </p>
      <h1 className="font-[family-name:var(--font-headline)] text-[2.5rem] italic leading-[1.15] tracking-tight text-on-surface lg:text-5xl">
        The World,
        <br />
        Distilled.
      </h1>
      <p className="max-w-sm text-base leading-relaxed text-on-surface-variant">
        Ten global perspectives, one essential narrative.
      </p>
    </div>
  );
}

export function Welcome() {
  const navigate = useNavigate();
  const { authStatus, onboarding } = useAuth();

  const onboardingComplete = onboarding?.completed ?? false;

  useEffect(() => {
    if (authStatus === "loading") return;

    if (isDevBypassAuth) {
      navigate("/brief", { replace: true });
      return;
    }

    if (authStatus === "authenticated") {
      navigate(onboardingComplete ? "/brief" : "/onboarding", { replace: true });
    }
  }, [authStatus, navigate, onboardingComplete]);

  return (
    <AuthScreenLayout hero={<WelcomeHero />}>
      <div className="flex flex-col gap-3 px-6 pb-8 pt-6 lg:px-0 lg:pb-0 lg:pt-0">
        <PrimaryButton
          label="Get Started"
          to="/sign-up"
          icon={<ArrowRight className="h-5 w-5" />}
        />
        <PrimaryButton label="I already have an account" variant="secondary" to="/sign-in" />

        <div className="flex items-center justify-center gap-2.5 pt-2 lg:justify-start">
          <div className="flex -space-x-2.5">
            {[IMAGES.profile.main, IMAGES.profile.woman, IMAGES.profile.casual].map((src, index) => (
              <div
                key={src}
                className="h-8 w-8 overflow-hidden rounded-full border-2 border-background"
                style={{ zIndex: 3 - index }}
              >
                <ImageWithFallback src={src} alt="" className="h-full w-full object-cover" />
              </div>
            ))}
          </div>
          <p className="text-xs text-outline">{TRUST_BADGE_TEXT}</p>
        </div>
      </div>
    </AuthScreenLayout>
  );
}
