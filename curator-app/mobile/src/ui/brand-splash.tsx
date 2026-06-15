import { Image } from "expo-image";
import { StyleSheet, Text, View, type ViewStyle } from "react-native";

export const BRAND_SPLASH_BACKGROUND = "#fbf9f3";
export const BRAND_SPLASH_BACKGROUND_DARK = "#14140f";

const LOGO_MARK = require("../../assets/images/logo-icon.png");

interface BrandSplashProps {
  backgroundColor?: string;
  subtitle?: string;
  showTagline?: boolean;
  fontsReady?: boolean;
  style?: ViewStyle;
}

export function BrandSplash({
  backgroundColor = BRAND_SPLASH_BACKGROUND,
  subtitle,
  showTagline = true,
  fontsReady = false,
  style,
}: BrandSplashProps) {
  return (
    <View style={[styles.root, { backgroundColor }, style]}>
      <View style={styles.glowTop} />
      <View style={styles.glowBottom} />

      <View style={styles.lockup}>
        <View style={styles.markFrame}>
          <Image
            source={LOGO_MARK}
            style={styles.mark}
            contentFit="contain"
            accessibilityLabel="The Curator"
          />
        </View>

        <Text
          style={[
            styles.wordmark,
            fontsReady
              ? { fontFamily: "Newsreader_500Medium_Italic" }
              : styles.wordmarkFallback,
          ]}
        >
          The Curator
        </Text>

        {showTagline ? (
          <Text
            style={[
              styles.tagline,
              fontsReady ? { fontFamily: "Manrope_500Medium" } : styles.taglineFallback,
            ]}
          >
            The World, Distilled.
          </Text>
        ) : null}

        {subtitle ? (
          <Text
            style={[
              styles.subtitle,
              fontsReady ? { fontFamily: "Manrope_400Regular" } : styles.subtitleFallback,
            ]}
          >
            {subtitle}
          </Text>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  glowTop: {
    position: "absolute",
    top: -120,
    right: -80,
    width: 280,
    height: 280,
    borderRadius: 140,
    backgroundColor: "rgba(196, 164, 132, 0.22)",
  },
  glowBottom: {
    position: "absolute",
    bottom: -140,
    left: -100,
    width: 320,
    height: 320,
    borderRadius: 160,
    backgroundColor: "rgba(176, 132, 92, 0.16)",
  },
  lockup: {
    alignItems: "center",
    paddingHorizontal: 32,
    marginTop: -24,
  },
  markFrame: {
    width: 132,
    height: 132,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
    shadowColor: "#2a241c",
    shadowOffset: { width: 0, height: 14 },
    shadowOpacity: 0.08,
    shadowRadius: 24,
    elevation: 6,
  },
  mark: {
    width: 132,
    height: 132,
  },
  wordmark: {
    fontSize: 34,
    lineHeight: 40,
    color: "#2f2b26",
    letterSpacing: -0.5,
  },
  wordmarkFallback: {
    fontWeight: "500",
    fontStyle: "italic",
  },
  tagline: {
    marginTop: 8,
    fontSize: 12,
    lineHeight: 18,
    letterSpacing: 2.4,
    textTransform: "uppercase",
    color: "#7a7167",
  },
  taglineFallback: {
    fontWeight: "500",
    letterSpacing: 2,
  },
  subtitle: {
    marginTop: 18,
    maxWidth: 280,
    textAlign: "center",
    fontSize: 15,
    lineHeight: 22,
    color: "#7a7167",
  },
  subtitleFallback: {
    fontWeight: "400",
  },
});
