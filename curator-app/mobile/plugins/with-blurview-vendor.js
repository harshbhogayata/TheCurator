const { withSettingsGradle } = require("@expo/config-plugins");

/**
 * Vendors Dimezis BlurView as a local Gradle module so expo-blur never hits JitPack
 * (Cloudflare blocks EAS/datacenter downloads with HTTP 403).
 */
function withBlurViewVendor(config) {
  return withSettingsGradle(config, (config) => {
    const marker = "blurview-vendor";
    if (config.modResults.contents.includes(marker)) {
      return config;
    }

    config.modResults.contents += `
// ${marker}
include ':blurview-vendor'
project(':blurview-vendor').projectDir = new File(rootProject.projectDir, '../vendor/blurview-library')
`;

    return config;
  });
}

module.exports = withBlurViewVendor;
