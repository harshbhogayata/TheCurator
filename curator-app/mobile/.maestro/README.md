# Maestro E2E — Curator mobile
#
# Prerequisites:
#   1. Install Maestro: https://maestro.mobile.dev/getting-started/installing-maestro
#   2. Preview APK on device or emulator (com.curator.mobile):
#        cd curator-app/mobile
#        npx eas-cli build --profile preview --platform android
#   3. Install APK, then set test credentials (free-tier account for paywall tests):
#
#        $env:MAESTRO_TEST_EMAIL="reader@example.com"
#        $env:MAESTRO_TEST_PASSWORD="your-test-password"
#
# Run all flows:
#   cd curator-app/mobile && npm run test:e2e
#
# Run individually:
#   maestro test .maestro/flows/auth.yaml
#   maestro test .maestro/flows/brief-audio-paywall.yaml
#   maestro test .maestro/flows/article-audio-paywall.yaml
#
# ─── Manual device pass (pre-launch, ~15 min) ─────────────────────────────
#   1. Sign in (email/password Firebase)
#   2. Home → tap article → play audio (hosted MP3 from audio.thecuratorgroup.org)
#   3. Brief tab → tap play → confirm paywall for free tier
#   4. Menu → Donate / Subscribe → Razorpay checkout opens (test key in preview)
#   5. Complete or cancel payment → app returns without crash
