# Curator Play Store Release Guide

Last updated: 2026-06-01

This is the launch guide for publishing the Android app through Google Play with Expo EAS, Firebase Auth, RevenueCat, Sentry, and the Django API. Follow it in order. Do not ship production builds with mock backend, mock premium, auth bypass, HTTP API URLs, missing Sentry source maps, or placeholder store assets.

## 1. Current Release Posture

The repository is configured for an Android Play Store release:

- Mobile app: `mobile/`, Expo SDK 54, package default `com.curator.mobile`.
- Backend API: `api/`, Django + DRF, Firebase bearer-token auth.
- Release config: `mobile/eas.json` has `development`, `preview`, and `production` EAS environments, and Android submit targets the Play internal track first.
- Production guardrails: `mobile/app.config.ts` rejects production builds when required env vars are missing, API URL is not HTTPS, or mock/auth-bypass flags are enabled.
- Store target API: Expo SDK 54 / React Native 0.81 targets Android 16 / API 36, which clears the current Play requirement for new apps and updates to target Android 15 / API 35 or higher.

Official references:

- Expo EAS environment variables: https://docs.expo.dev/eas/environment-variables/
- Expo Android submit: https://docs.expo.dev/submit/android/
- Google Play target API requirement: https://developer.android.com/google/play/requirements/target-sdk
- Google Play preview assets: https://support.google.com/googleplay/android-developer/answer/9866151
- Google Play app review/app content: https://support.google.com/googleplay/android-developer/answer/9859455
- Google Play Data safety: https://support.google.com/googleplay/android-developer/answer/10787469
- RevenueCat Google Play credentials: https://www.revenuecat.com/docs/service-credentials/creating-play-service-credentials
- RevenueCat webhooks: https://www.revenuecat.com/docs/integrations/webhooks
- Sentry Expo setup: https://docs.sentry.io/platforms/react-native/manual-setup/expo/

## 2. Manual Accounts You Need

Create or verify these before building:

- Google Play Developer account, identity verified, payments profile complete.
- Expo account with access to the `curator-mobile` EAS project.
- Firebase project with Email/Password authentication enabled.
- RevenueCat project with an Android app connected to the same package name as Play Console.
- Sentry organization and React Native project.
- Production API hosting with HTTPS and a stable public domain.
- Public Privacy Policy and Terms URLs.

Use one legal developer name consistently across Play Console, privacy policy, terms, support email, and app metadata.

## 3. Backend Production Setup

Set production backend secrets in your host, not in Git.

Required backend variables:

```bash
DJANGO_SECRET_KEY=<strong-random-secret>
DJANGO_DEBUG=false
DJANGO_ALLOWED_HOSTS=<api-domain>,<host-platform-domain>
API_PUBLIC_BASE_URL=https://<api-domain>
DATABASE_URL=postgresql://...
CORS_ALLOWED_ORIGINS=https://<your-web-origin-if-any>
CSRF_TRUSTED_ORIGINS=https://<your-web-origin-if-any>
TRUST_PROXY=true
SECURE_SSL_REDIRECT=true
SECURE_HSTS_SECONDS=31536000
SECURE_HSTS_INCLUDE_SUBDOMAINS=true
SECURE_HSTS_PRELOAD=true
SESSION_COOKIE_SAMESITE=Lax
CSRF_COOKIE_SAMESITE=Lax
FIREBASE_PROJECT_ID=<firebase-project-id>
FIREBASE_CREDENTIALS_JSON=<single-line-service-account-json>
CELERY_BROKER_URL=redis://...
CELERY_RESULT_BACKEND=redis://...
REVENUECAT_WEBHOOK_SECRET=<bearer-token-you-create>
REVENUECAT_PRODUCT_TIER_MAP={"curator_basic_monthly":"basic","curator_premium_monthly":"premium","curator_lifetime":"lifetime"}
SENTRY_DSN=<django-sentry-dsn>
```

Optional content/audio tooling variables (only needed wherever you run the
`generate_article_audio` command — a maintenance box or worker, not the web app):

```bash
OPENAI_API_KEY=<openai-key>
OPENAI_TTS_MODEL=gpt-4o-mini-tts
OPENAI_TTS_VOICE=alloy
AUDIO_S3_ENDPOINT_URL=https://<account-id>.r2.cloudflarestorage.com
AUDIO_S3_BUCKET=<r2-bucket-name>
AUDIO_S3_ACCESS_KEY_ID=<r2-access-key-id>
AUDIO_S3_SECRET_ACCESS_KEY=<r2-secret-access-key>
AUDIO_S3_REGION=auto
AUDIO_PUBLIC_BASE_URL=https://<r2-public-or-custom-domain>
```

Production deploy sequence:

```powershell
cd C:\Users\harsh\Desktop\Curator\curator-app\api
python manage.py migrate
python manage.py check --deploy
python manage.py collectstatic --noinput
```

Verify the live API:

```powershell
curl https://<api-domain>/health/
curl https://<api-domain>/api/mobile/v1/categories
```

The health endpoint must be green before building the app. The mobile production build now refuses non-HTTPS API URLs.

## 3.1 Content And Audio Population

Articles, briefs, and categories are database rows served read-only through the
API. There is no public write API for content; populate it with the seed
command, Django admin, or the audio command below.

Seed the baseline catalog (idempotent, safe to re-run):

```powershell
cd C:\Users\harsh\Desktop\Curator\curator-app\api
python manage.py seed_mobile_content
```

This upserts the editorial articles and briefs and ensures the curated category
set exists. After launch, manage new content in Django admin at `/admin/`
(Article and Brief are registered there).

Audio is intentionally empty in seed data. Do not ship third-party sample audio
(SoundHelix, university WAVs, etc.); migration `0007_clear_demo_audio_urls`
deliberately strips those demo URLs. Generate real, owned narration with the
`generate_article_audio` command, which uses OpenAI TTS and uploads to
S3-compatible storage (Cloudflare R2 recommended for zero egress fees):

```powershell
# Preview scope and chunking without spending anything or uploading
python manage.py generate_article_audio --all-missing --dry-run

# Generate narration + upload + write audio_url/audio_duration_sec
python manage.py generate_article_audio --all-missing

# Single article, or force regeneration
python manage.py generate_article_audio --article-id <uuid>
python manage.py generate_article_audio --all-missing --overwrite
```

Requirements:

- Set the optional content tooling variables from section 3 before a real run.
- The R2 bucket must serve the uploaded objects over a public bucket URL or
  custom domain; set `AUDIO_PUBLIC_BASE_URL` to that origin. The command uploads
  objects but does not configure bucket public-access policy.
- Generated audio lives at your own `AUDIO_PUBLIC_BASE_URL`, so it is never
  treated as demo audio and is not stripped by audits.

Audio stays entitlement-gated end to end: `audio_url` is never included in
article list/detail responses, free users see a locked player, and paid users
fetch the URL through `/api/mobile/v1/articles/{id}/audio`. Setting a real
`audio_url` does not change that gating.

## 4. Firebase Setup

Firebase Console:

- Enable Authentication -> Sign-in method -> Email/Password.
- Add an Android app with package name `com.curator.mobile` or your final package name.
- Copy the Android client values into EAS env vars.
- Generate a service account JSON for the backend and store it in backend `FIREBASE_CREDENTIALS_JSON`.
- Add SHA-1/SHA-256 signing fingerprints once EAS creates Android credentials, especially before adding Google Sign-In later.

Mobile variables from Firebase:

```bash
EXPO_PUBLIC_FIREBASE_API_KEY=
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=
EXPO_PUBLIC_FIREBASE_PROJECT_ID=
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
EXPO_PUBLIC_FIREBASE_APP_ID=
EXPO_PUBLIC_FIREBASE_ANDROID_PACKAGE=com.curator.mobile
```

## 5. RevenueCat And Play Billing Setup

Google Play Console:

- Create the app with the same package name used by Expo.
- Upload a signed AAB once before relying on the Play Developer API for automated submit.
- Create subscriptions / products with stable IDs.
- Recommended IDs for the current code:
  - `curator_basic_monthly`
  - `curator_premium_monthly`
  - `curator_lifetime`

RevenueCat:

- Add Android app with package name `com.curator.mobile`.
- Upload Play service credentials JSON to RevenueCat.
- Grant the RevenueCat service account Play permissions for app information, financial/order data, and managing orders/subscriptions.
- Create entitlements exactly matching the app config defaults unless you intentionally override them:
  - `Basic`
  - `Premium`
  - `Lifetime`
- Attach the Google Play products to RevenueCat offerings.
- Configure webhook URL:

```text
https://<api-domain>/api/mobile/v1/webhooks/revenuecat
```

Webhook auth:

```text
Authorization: Bearer <REVENUECAT_WEBHOOK_SECRET>
```

Production purchase rule: the client may start the purchase, but the backend entitlement is granted by verified RevenueCat webhook state. Do not manually write premium tiers for real users.

## 6. Sentry Setup

Create:

- One Sentry project for React Native mobile.
- One Sentry project for Django backend.
- A Sentry auth token for source map upload. Keep it private.

Mobile EAS variables:

```bash
EXPO_PUBLIC_SENTRY_DSN=<mobile-public-dsn>
SENTRY_ORG=<sentry-org-slug>
SENTRY_PROJECT=<sentry-mobile-project-slug>
SENTRY_AUTH_TOKEN=<token>
```

Use `sensitive` visibility for `SENTRY_AUTH_TOKEN` in EAS so it works with config resolution and source map upload, while remaining masked in build logs. The app config already passes `organization` and `project` to the Sentry Expo plugin.

Backend variable:

```bash
SENTRY_DSN=<backend-dsn>
```

Before release, trigger one handled test error in staging and confirm it lands in Sentry with the correct release/environment.

## 7. EAS Environment Variables

Work from the mobile directory:

```powershell
cd C:\Users\harsh\Desktop\Curator\curator-app\mobile
npm install
npx eas login
npx eas whoami
```

The recommended path is Expo Dashboard -> Project settings -> Environment variables, because it makes visibility and environment mistakes obvious. CLI examples:

```powershell
npx eas env:create --name EXPO_PUBLIC_API_URL --value https://<api-domain> --environment production --visibility plaintext
npx eas env:create --name SENTRY_AUTH_TOKEN --value <token> --environment production --visibility sensitive
npx eas env:list --environment production
```

Production mobile env checklist:

```bash
APP_ENV=production
EXPO_PUBLIC_API_URL=https://<api-domain>
EXPO_PUBLIC_EAS_PROJECT_ID=<expo-project-id>
EXPO_PUBLIC_APP_BUNDLE_ID=com.curator.mobile
EXPO_PUBLIC_ANDROID_PACKAGE=com.curator.mobile
EXPO_PUBLIC_FIREBASE_API_KEY=
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=
EXPO_PUBLIC_FIREBASE_PROJECT_ID=
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
EXPO_PUBLIC_FIREBASE_APP_ID=
EXPO_PUBLIC_FIREBASE_ANDROID_PACKAGE=com.curator.mobile
EXPO_PUBLIC_RC_ANDROID_KEY=<revenuecat-android-public-sdk-key>
EXPO_PUBLIC_RC_BASIC_PRODUCT_ID=curator_basic_monthly
EXPO_PUBLIC_RC_PREMIUM_PRODUCT_ID=curator_premium_monthly
EXPO_PUBLIC_RC_LIFETIME_PRODUCT_ID=curator_lifetime
EXPO_PUBLIC_RC_BASIC_ENTITLEMENT_ID=Basic
EXPO_PUBLIC_RC_PREMIUM_ENTITLEMENT_ID=Premium
EXPO_PUBLIC_RC_LIFETIME_ENTITLEMENT_ID=Lifetime
EXPO_PUBLIC_SENTRY_DSN=<mobile-public-dsn>
SENTRY_ORG=<sentry-org-slug>
SENTRY_PROJECT=<sentry-mobile-project-slug>
SENTRY_AUTH_TOKEN=<sentry-auth-token>
EXPO_PUBLIC_MOCK_BACKEND=false
EXPO_PUBLIC_MOCK_PREMIUM=false
EXPO_PUBLIC_DEV_BYPASS_AUTH=false
```

Visibility guidance:

- `EXPO_PUBLIC_*`: plaintext or sensitive. These values are bundled into the app and are not secret.
- `SENTRY_AUTH_TOKEN`: sensitive.
- Play service account key: local file `mobile/google-play-key.json` for manual submit or uploaded to EAS credentials. This file is ignored by Git.
- Never put private backend secrets in `EXPO_PUBLIC_*`.

## 8. Local Release Validation

Run this before every AAB:

```powershell
cd C:\Users\harsh\Desktop\Curator\curator-app\mobile
npm run typecheck
npx expo-doctor
npm audit --omit=dev --audit-level=high
```

Then validate backend:

```powershell
cd C:\Users\harsh\Desktop\Curator\curator-app\api
python manage.py makemigrations --check --dry-run
python manage.py check
python manage.py check --deploy
python manage.py test
.\.venv\Scripts\python.exe -m pip install pip-audit
.\.venv\Scripts\python.exe -m pip_audit -r requirements.txt
```

Production config smoke test:

```powershell
cd C:\Users\harsh\Desktop\Curator\curator-app\mobile
$env:APP_ENV="production"
$env:EAS_BUILD_PROFILE="production"
$env:EAS_BUILD_PLATFORM="android"
$env:EXPO_PUBLIC_API_URL="https://<api-domain>"
$env:EXPO_PUBLIC_EAS_PROJECT_ID="<expo-project-id>"
$env:EXPO_PUBLIC_FIREBASE_API_KEY="<firebase-api-key>"
$env:EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN="<firebase-auth-domain>"
$env:EXPO_PUBLIC_FIREBASE_PROJECT_ID="<firebase-project-id>"
$env:EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET="<firebase-storage-bucket>"
$env:EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID="<firebase-sender-id>"
$env:EXPO_PUBLIC_FIREBASE_APP_ID="<firebase-app-id>"
$env:EXPO_PUBLIC_RC_ANDROID_KEY="<revenuecat-android-key>"
$env:EXPO_PUBLIC_RC_BASIC_PRODUCT_ID="curator_basic_monthly"
$env:EXPO_PUBLIC_RC_PREMIUM_PRODUCT_ID="curator_premium_monthly"
$env:EXPO_PUBLIC_RC_LIFETIME_PRODUCT_ID="curator_lifetime"
$env:EXPO_PUBLIC_SENTRY_DSN="<mobile-sentry-dsn>"
$env:SENTRY_ORG="<sentry-org>"
$env:SENTRY_PROJECT="<sentry-project>"
$env:SENTRY_AUTH_TOKEN="<sentry-token>"
$env:EXPO_PUBLIC_MOCK_BACKEND="false"
$env:EXPO_PUBLIC_MOCK_PREMIUM="false"
$env:EXPO_PUBLIC_DEV_BYPASS_AUTH="false"
npx expo config --type public --json | Out-Null
```

## 9. Build And Submit

Internal test build first:

```powershell
cd C:\Users\harsh\Desktop\Curator\curator-app\mobile
npx eas build --profile production --platform android
```

If this is the first ever app upload, Google requires at least one manual upload before API-based submit works reliably. Download the AAB from EAS and upload it in Play Console -> Release -> Testing -> Internal testing.

Automated submit after the first upload:

```powershell
cd C:\Users\harsh\Desktop\Curator\curator-app\mobile
npx eas submit --platform android --profile production --latest
```

The repo's `mobile/eas.json` submits to `internal` first. After internal testing is clean, promote the same build to closed testing, then production from Play Console.

## 10. Play Console App Content

Complete App content before production:

- Privacy Policy: required, public URL, not blocked by login.
- App access: provide test credentials if any meaningful app area needs sign-in.
- Ads: answer `No` unless you add a real ad SDK or paid promotional ads. The current in-app subscription/donation CTA is not a third-party ad network.
- Data safety: complete based on the worksheet below.
- Content rating: News / reference app style questionnaire. Be honest about news/current-events content.
- Target audience: adults/general audience unless you intentionally design for children. Do not mark it as child-directed.
- News policy: if listed as News or primarily current-affairs, be prepared to provide publisher/developer contact details, editorial ownership, and source transparency.
- Financial features: only answer yes if you add financial advice/trading/account features. Curated news about markets is not the same as trading functionality.
- Health content: if you cover health news, avoid medical-advice claims in app metadata and screenshots.

Play review needs a working login. Create a reviewer account in Firebase and backend:

```text
Email: reviewer@<your-domain>
Password: <strong temporary password>
Instructions: Sign in, complete onboarding, open Today, Explore, Saved, Settings, and subscription screen. Purchases are available only through Play test billing on internal/closed tracks.
```

## 11. Data Safety Worksheet

Use this as a starting point, then verify against the live SDK list in Play Console.

Data collected by the app:

- Personal info: email address, display name.
- App activity: viewed/read articles, saved articles, collections, preferences, feedback reports.
- App info and performance: crash logs, diagnostics, app version, OS version.
- Device or other IDs: Firebase UID, RevenueCat app user ID, Expo push token, Sentry event identifiers.
- Purchases: subscription/product identifiers and entitlement state through RevenueCat; payment card data is handled by Google Play, not your app.

Likely purposes:

- Account management.
- App functionality.
- Analytics/product improvement.
- Developer communications for support/feedback.
- Fraud prevention, security, and compliance.

Likely sharing:

- Firebase/Google for authentication and push infrastructure.
- RevenueCat for subscription processing.
- Sentry for crash diagnostics.
- Hosting/database providers for backend operation.

Not currently collected from app code:

- Precise location.
- Contacts.
- Photos/videos/files.
- Microphone recordings.
- SMS/call logs.
- Advertising ID.

Security declarations:

- Data is encrypted in transit via HTTPS/TLS.
- Users can request data export and delete account in app.
- You must disclose third-party SDK behavior, even when the data is sent directly by the SDK.

Privacy policy must explicitly cover account deletion, data export, support contact, subscriptions, crash reporting, push tokens, and data retention.

## 12. Store Listing Assets

Required:

- App icon: 512 x 512, 32-bit PNG with alpha, max 1024 KB.
- Feature graphic: 1024 x 500, JPEG or 24-bit PNG, no alpha.
- Screenshots: at least two total, but submit at least four phone screenshots at 1080 x 1920 or higher for better Play placement.

Recommended screenshot set:

1. Welcome/onboarding brand screen.
2. Today feed with real production articles.
3. Explore/category view.
4. Article detail with typography and audio module visible.
5. Saved articles / collections.
6. Settings or subscription screen showing account controls and upgrade path.

Capture from an Android emulator or physical Android device with the internal build installed:

```powershell
mkdir C:\Users\harsh\Desktop\Curator\store-assets\screenshots\phone
adb shell screencap -p /sdcard/curator-home.png
adb pull /sdcard/curator-home.png C:\Users\harsh\Desktop\Curator\store-assets\screenshots\phone\01-home.png
adb shell rm /sdcard/curator-home.png
```

Repeat after navigating to each key screen. Use screenshots from the real app, with real production/staging content that you have rights to show. Avoid tiny text overlays, ranking claims, "best app" claims, fake awards, and "download now" calls to action.

Feature graphic direction:

- Use actual Curator UI or editorial reading context, not a generic gradient.
- Keep key text/logo in the central safe area.
- Do not duplicate the icon as the main visual.
- Export at exactly `1024x500`.

Store text draft:

```text
App name: Curator
Short description: Read sharper daily briefings across world, tech, markets, and culture

Full description:
Curator helps you keep up with the stories that matter without drowning in noise. Follow a focused daily feed across world affairs, technology, business, science, culture, health, climate, and sports. Save articles, build collections, tune your reading experience, and unlock deeper audio briefings with a paid plan.

Built for readers who want context, clarity, and a calmer news ritual.
```

Before submitting, remove any claim you cannot prove. Do not use "best", "#1", "top", "new", "discount", or time-sensitive launch language in listing assets.

## 13. Real Device QA

Run this on an internal Play build, not Expo Go:

- Fresh install opens welcome screen.
- Sign up with email/password.
- Sign in/out and password reset.
- Onboarding requires display name and category selection.
- Today feed loads real backend articles and briefs.
- Explore filters by category.
- Search returns expected results.
- Article detail opens and reading event is tracked.
- Free user cannot fetch article audio URL.
- Premium/lifetime test user can fetch and play audio.
- Save/unsave works while signed in.
- Saved limit behavior matches tier.
- Collections create/edit/delete and add/remove article.
- Push permission prompt only appears when enabled by user flow.
- Push token registers and unregisters on sign-out/preference change.
- Subscription screen loads RevenueCat offerings.
- Play test purchase updates RevenueCat, backend entitlement, and app UI.
- Cancel/expire sandbox subscription reverts entitlement after expiry.
- Feedback sends without leaking secrets.
- Data export creates a request.
- Delete account requires recent auth and removes backend/Firebase account.
- Offline/slow network shows graceful UI, not crashes.
- Rotation/large font/small device layouts do not overlap.
- Sentry receives a test error with release/source maps.

## 14. Go / No-Go Gate

Ship only if every item is true:

- `npm run typecheck` passes.
- `npx expo-doctor` passes.
- `npm audit --omit=dev --audit-level=high` exits 0.
- `python manage.py makemigrations --check --dry-run` says no changes.
- `python manage.py check --deploy` passes with production-like env.
- `python manage.py test` passes.
- Internal Play build installs on at least one real Android device.
- RevenueCat sandbox purchase flow works end to end.
- Sentry receives mobile and backend events.
- Privacy policy, terms, screenshots, feature graphic, content rating, app access, data safety, and store listing are complete.
- No mock flags are true in production EAS env.
- No sample audio/image URLs from seed data are used for production articles unless you have rights to use them.

## 15. Production Rollout

Recommended rollout:

1. Internal testing: you plus 2-5 trusted testers.
2. Closed testing: 20+ testers if Google requires it for the account/app category.
3. Production release: staged rollout at 5%.
4. Watch Sentry, backend logs, RevenueCat events, Play vitals, and Play reviews for 24 hours.
5. Increase to 25%, 50%, then 100% only if crash-free sessions and purchase flows are clean.

Rollback levers:

- Mobile binary: halt staged rollout in Play Console and promote previous stable release if available.
- JS-only hotfix: use EAS Update only for compatible JS changes that do not require native dependencies/config changes.
- Backend: rollback host deployment and run backward-compatible migrations only.
- Entitlements: RevenueCat is source of truth; replay webhooks after backend incidents.

## 16. What I Fixed In This Audit

Code/config fixes completed:

- Generated missing Django migrations for article/feed indexes and onboarding category choices.
- Tightened production Expo env validation, including platform-aware RevenueCat keys and Sentry source-map variables.
- Updated `.env.example` to default mocks/auth bypass off and include Sentry variables.
- Enforced HTTPS API URL in production mobile builds.
- Ignored Play service account JSON files in Git.
- Fixed expired non-lifetime entitlements so expired users do not keep premium access.
- Cleared React Query persisted cache when the signed-in user changes.
- Prevented unsigned users from locally saving articles before backend auth.
- Removed bundled mock article/brief content from production data modules.
- Changed article cards to prefer backend image URLs.
- Stopped list/detail article payloads from leaking gated audio URLs.
- Added entitlement-gated audio URL fetch for paid playback.
- Cleared demo/sample audio URLs from seed content and existing databases via migration.
- Removed stale FlashList v1 prop usage that broke FlashList v2 TypeScript.
- Updated Expo SDK patch packages to versions expected by Expo Doctor.
- Removed blank iOS submit placeholders from Android Play release config.
- Bumped backend `requests` to the fixed 2.33 line after `pip-audit` flagged CVE-2026-25645 in 2.32.5.

Validation run during audit:

```text
mobile: npm run typecheck
mobile: npx expo-doctor
mobile: npm audit --omit=dev --audit-level=high
mobile: production Android expo config evaluation
api: python manage.py makemigrations --check --dry-run
api: python manage.py check
api: python manage.py check --deploy
api: python manage.py test
api: .\.venv\Scripts\python.exe -m pip_audit -r requirements.txt
```

Known residual item:

- `npm audit --omit=dev --audit-level=high` is clean for high/critical issues. NPM still reports moderate Expo-transitive advisories whose automated fix requires a force upgrade to a newer Expo major. Do not force-upgrade immediately before launch; keep Expo patch-current, watch Expo advisories, and upgrade major versions in a dedicated QA cycle.

## 17. Follow-up Audit Changes (2026-06-01)

Deep re-audit of the release path. The codebase was already in strong shape; the
following real issues were fixed:

- Hardened Firebase provisioning: an existing account is now only linked to a new
  Firebase credential when the token email is verified, preventing unverified
  sign-ins from taking over an account created with a verified provider. Added
  provisioning unit tests.
- Fixed `seed_mobile_content`: it assigned the category as a string to a
  ForeignKey and crashed (rolling back the whole atomic seed), so content could
  not be populated. Categories now resolve to real `Category` instances with
  alias mapping (for example `geopolitics` to `politics`).
- Added the `generate_article_audio` management command (OpenAI TTS to
  S3/R2 upload) plus `boto3` and `mutagen` backend dependencies and the related
  content tooling settings. See section 3.1.

Validation after these changes:

```text
api: python manage.py makemigrations --check --dry-run  (no changes)
api: python manage.py check                              (no issues)
api: python manage.py test                               (24 passed)
api: python manage.py seed_mobile_content                (10 articles, 2 briefs)
api: python manage.py generate_article_audio --all-missing --dry-run  (ok)
mobile: npm run typecheck                                (clean)
mobile: npx expo-doctor                                  (18/18)
```

Documented audio distribution decision: subscriptions require Google Play
Billing through RevenueCat, so a website-only APK download cannot use the
current in-app purchase flow. If you distribute outside Google Play, plan a
web-checkout entitlement path (for example Stripe or RevenueCat Web Billing)
that grants `UserEntitlement` via webhook, mirroring the existing model.
