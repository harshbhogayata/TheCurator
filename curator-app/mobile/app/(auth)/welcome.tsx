import { useRouter } from "expo-router";
import { StyleSheet, Text, useWindowDimensions, View } from "react-native";
import { Image } from "expo-image";
import { SafeAreaView } from "react-native-safe-area-context";
import { ArrowRight } from "lucide-react-native";

import { useAuth } from "../../src/providers/auth-provider";
import { useTheme } from "../../src/providers/theme-provider";
import { PrimaryButton } from "../../src/ui/primary-button";
import { StatusBanner } from "../../src/ui/status-banner";
import { IMAGES } from "../../src/data/images";
import { type } from "../../src/ui/tokens/typography";

const TRUST_BADGE_TEXT = "12k+ Readers";

export default function WelcomeScreen() {
  const router = useRouter();
  const { errorMessage } = useAuth();
  const { palette } = useTheme();
  const { width } = useWindowDimensions();
  // Scale mosaic to available width — caps at 320 on wide screens
  const mosaicScale = Math.min(width - 48, 320) / 300;

  return (
    <SafeAreaView style={[styles.root, { backgroundColor: palette.background }]}>
      {/* Background glows */}
      <View style={StyleSheet.absoluteFill} pointerEvents="none">
        <View style={[styles.glow, { backgroundColor: palette.secondary, top: -80, right: -60 }]} />
        <View style={[styles.glow, { backgroundColor: palette.tertiary, bottom: -100, left: -60 }]} />
      </View>

      {/* Hero + brand — flex fills remaining space */}
      <View style={styles.heroSection}>
        {/* Editorial mosaic — 3 overlapping article images, scales with screen */}
        <View style={[styles.mosaic, { transform: [{ scale: mosaicScale }] }]}>
          <View style={[styles.mosaicCard, {
            top: 0, left: 12, width: 148, height: 186,
            borderTopLeftRadius: 64, borderTopRightRadius: 24,
            borderBottomRightRadius: 48, borderBottomLeftRadius: 32,
            borderColor: palette.outlineVariant + "40",
            transform: [{ rotate: "-8deg" }],
          }]}>
            <Image source={{ uri: IMAGES.editorial.brief }} style={StyleSheet.absoluteFill} contentFit="cover" />
          </View>

          <View style={[styles.mosaicCard, {
            top: 20, right: 8, width: 136, height: 164,
            borderTopLeftRadius: 32, borderTopRightRadius: 56,
            borderBottomRightRadius: 32, borderBottomLeftRadius: 52,
            borderColor: palette.outlineVariant + "40",
            transform: [{ rotate: "6deg" }],
          }]}>
            <Image source={{ uri: IMAGES.editorial.technology }} style={StyleSheet.absoluteFill} contentFit="cover" />
          </View>

          <View style={[styles.mosaicCard, {
            bottom: 0, left: 56, width: 128, height: 88,
            borderTopLeftRadius: 24, borderTopRightRadius: 40,
            borderBottomRightRadius: 52, borderBottomLeftRadius: 24,
            borderColor: palette.outlineVariant + "40",
            transform: [{ rotate: "2deg" }],
          }]}>
            <Image source={{ uri: IMAGES.editorial.economy }} style={StyleSheet.absoluteFill} contentFit="cover" />
          </View>
        </View>

        {/* Brand */}
        <Text style={[styles.brandName, { color: palette.onSurfaceVariant }]}>
          The Curator
        </Text>
        <Text style={[styles.tagline, { color: palette.onSurface }]}>
          The World,{"\n"}Distilled.
        </Text>
        <Text style={[styles.subtitle, { color: palette.onSurfaceVariant }]}>
          Ten global perspectives, one essential narrative.
        </Text>
      </View>

      {/* CTAs — always visible at bottom */}
      <View style={styles.ctaSection}>
        {errorMessage ? <StatusBanner tone="error" message={errorMessage} /> : null}

          <PrimaryButton
            label="Get Started"
            testID="welcome-get-started"
          onPress={() => router.push("/sign-up")}
          icon={<ArrowRight size={18} color={palette.inversePrimary} />}
        />
        <PrimaryButton
          label="I already have an account"
          testID="welcome-sign-in"
          variant="secondary"
          onPress={() => router.push("/sign-in")}
        />

        {/* Trust badge */}
        <View style={styles.trustRow}>
          <View style={styles.avatarStack}>
            {[IMAGES.profile.main, IMAGES.profile.woman, IMAGES.profile.casual].map((uri, i) => (
              <View
                key={i}
                style={[styles.avatar, {
                  borderColor: palette.background,
                  marginLeft: i > 0 ? -10 : 0,
                }]}
              >
                <Image source={{ uri }} style={StyleSheet.absoluteFill} contentFit="cover" />
              </View>
            ))}
          </View>
          <Text style={[styles.trustText, { color: palette.outline }]}>
            {TRUST_BADGE_TEXT}
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  glow: {
    position: "absolute",
    width: 240,
    height: 240,
    borderRadius: 120,
    opacity: 0.08,
  },
  heroSection: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
    gap: 16,
  },
  mosaic: {
    width: 300,
    height: 220,
    position: "relative",
    marginBottom: 8,
  },
  mosaicCard: {
    position: "absolute",
    overflow: "hidden",
    borderWidth: 1.5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.18,
    shadowRadius: 20,
    elevation: 10,
  },
  brandName: {
    fontFamily: "Newsreader_400Regular_Italic",
    fontSize: 18,
    textAlign: "center",
  },
  tagline: {
    fontFamily: "Newsreader_400Regular_Italic",
    fontSize: 40,
    textAlign: "center",
    lineHeight: 46,
    letterSpacing: -0.5,
  },
  subtitle: {
    ...type.label,
    fontFamily: "Manrope_400Regular",
    textAlign: "center",
    lineHeight: 21,
  },
  ctaSection: {
    paddingHorizontal: 24,
    paddingBottom: 20,
    gap: 12,
  },
  trustRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    paddingTop: 4,
  },
  avatarStack: {
    flexDirection: "row",
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    overflow: "hidden",
    borderWidth: 2,
  },
  trustText: {
    ...type.caption,
  },
});
