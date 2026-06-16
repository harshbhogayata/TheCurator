# Maestro E2E — Curator mobile
#
# Prerequisites:
#   1. Install Maestro: https://maestro.mobile.dev/getting-started/installing-maestro
#   2. Preview/dev build on device or emulator (com.curator.mobile)
#   3. Set test credentials (free-tier account for paywall tests):
#
#        export MAESTRO_TEST_EMAIL=reader@example.com
#        export MAESTRO_TEST_PASSWORD=your-test-password
#
# Run all flows:
#   cd curator-app/mobile && npm run test:e2e
#
# Run individually:
#   maestro test .maestro/flows/auth.yaml
#   maestro test .maestro/flows/brief-audio-paywall.yaml
#   maestro test .maestro/flows/article-audio-paywall.yaml
