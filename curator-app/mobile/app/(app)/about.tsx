import { Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  Sparkles,
  Globe,
  Shield,
  Users,
} from "lucide-react-native";

import { useTheme } from "../../src/providers/theme-provider";
import { PillPageHeader } from "../../src/ui/pill-page-header";

export default function AboutScreen() {
  const { palette } = useTheme();

  const values = [
    {
      Icon: Globe,
      title: "Global Perspective",
      description: "We source from diverse international outlets to give you the full picture, not just one angle.",
      bg: palette.primaryContainer,
      fg: palette.onPrimaryContainer,
    },
    {
      Icon: Shield,
      title: "Independent",
      description: "Reader-funded and corporate-free. Our only allegiance is to the truth.",
      bg: palette.secondaryContainer,
      fg: palette.onSecondaryContainer,
    },
    {
      Icon: Users,
      title: "Community Driven",
      description: "Built for curious minds who value depth, nuance, and thoughtful analysis.",
      bg: palette.tertiaryContainer,
      fg: palette.onTertiaryContainer,
    },
  ];

  const steps = [
    {
      number: "1",
      title: "Source Collection",
      description: "Our AI scans 100+ trusted global news sources daily across multiple languages and perspectives.",
    },
    {
      number: "2",
      title: "Synthesis",
      description:
        "Our proprietary algorithm identifies key narratives and synthesizes diverse viewpoints into cohesive stories.",
    },
    {
      number: "3",
      title: "Editorial Review",
      description:
        "Our team of experienced journalists reviews and refines each narrative for accuracy and clarity.",
    },
  ];

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: palette.background }}>
      <PillPageHeader title="About" />

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero */}
        <View style={{ alignItems: "center", marginBottom: 32 }}>
          <View
            style={{
              width: 80,
              height: 80,
              borderRadius: 40,
              backgroundColor: palette.primaryContainer,
              alignItems: "center",
              justifyContent: "center",
              marginBottom: 20,
            }}
          >
            <Sparkles size={40} color={palette.onPrimaryContainer} />
          </View>

          <Text
            style={{
              fontFamily: "Newsreader_700Bold_Italic",
              fontSize: 36,
              color: palette.onSurface,
              textAlign: "center",
              marginBottom: 12,
            }}
          >
            The Curator
          </Text>

          <Text
            style={{
              fontFamily: "Manrope_400Regular",
              fontSize: 16,
              color: palette.onSurfaceVariant,
              textAlign: "center",
              lineHeight: 24,
              paddingHorizontal: 12,
            }}
          >
            We synthesize ten global perspectives into one essential narrative, delivering journalism beyond the noise.
          </Text>
        </View>

        {/* Mission */}
        <View
          style={{
            backgroundColor: palette.surfaceContainerLowest,
            borderRadius: 24,
            borderWidth: 1,
            borderColor: palette.outlineVariant + "26",
            padding: 20,
            marginBottom: 24,
          }}
        >
          <Text
            style={{
              fontFamily: "Newsreader_700Bold",
              fontSize: 22,
              color: palette.onSurface,
              marginBottom: 12,
            }}
          >
            Our Mission
          </Text>
          <Text
            style={{
              fontFamily: "Manrope_400Regular",
              fontSize: 14,
              color: palette.onSurfaceVariant,
              lineHeight: 22,
              marginBottom: 10,
            }}
          >
            In an age of information overload, The Curator offers clarity. We don't just report the news -- we distill
            it. Our proprietary synthesis process weaves together diverse global sources to give you a complete, unbiased
            picture.
          </Text>
          <Text
            style={{
              fontFamily: "Manrope_400Regular",
              fontSize: 14,
              color: palette.onSurfaceVariant,
              lineHeight: 22,
            }}
          >
            Every narrative you read has been carefully curated from at least ten different perspectives, ensuring you
            understand not just what happened, but why it matters and how the world is responding.
          </Text>
        </View>

        {/* Values */}
        <Text
          style={{
            fontFamily: "Manrope_600SemiBold",
            fontSize: 11,
            textTransform: "uppercase",
            letterSpacing: 2,
            color: palette.onSurfaceVariant,
            marginBottom: 12,
          }}
        >
          Our Values
        </Text>

        <View style={{ gap: 12, marginBottom: 24 }}>
          {values.map((value) => {
            const Icon = value.Icon;
            return (
              <View
                key={value.title}
                style={{
                  backgroundColor: palette.surfaceContainerLowest,
                  borderRadius: 24,
                  borderWidth: 1,
                  borderColor: palette.outlineVariant + "26",
                  padding: 20,
                  alignItems: "center",
                }}
              >
                <View
                  style={{
                    width: 52,
                    height: 52,
                    borderRadius: 26,
                    backgroundColor: value.bg,
                    alignItems: "center",
                    justifyContent: "center",
                    marginBottom: 12,
                  }}
                >
                  <Icon size={26} color={value.fg} />
                </View>
                <Text
                  style={{
                    fontFamily: "Newsreader_700Bold",
                    fontSize: 18,
                    color: palette.onSurface,
                    marginBottom: 6,
                  }}
                >
                  {value.title}
                </Text>
                <Text
                  style={{
                    fontFamily: "Manrope_400Regular",
                    fontSize: 14,
                    color: palette.onSurfaceVariant,
                    lineHeight: 20,
                    textAlign: "center",
                  }}
                >
                  {value.description}
                </Text>
              </View>
            );
          })}
        </View>

        {/* How It Works */}
        <View
          style={{
            backgroundColor: palette.surfaceContainerLowest,
            borderRadius: 24,
            borderWidth: 1,
            borderColor: palette.outlineVariant + "26",
            padding: 20,
          }}
        >
          <Text
            style={{
              fontFamily: "Newsreader_700Bold",
              fontSize: 22,
              color: palette.onSurface,
              marginBottom: 20,
            }}
          >
            How It Works
          </Text>

          <View style={{ gap: 20 }}>
            {steps.map((step) => (
              <View key={step.number} style={{ flexDirection: "row", gap: 14 }}>
                <View
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 18,
                    backgroundColor: palette.primary,
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}
                >
                  <Text
                    style={{
                      fontFamily: "Manrope_700Bold",
                      fontSize: 16,
                      color: palette.primaryForeground,
                    }}
                  >
                    {step.number}
                  </Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text
                    style={{
                      fontFamily: "Manrope_600SemiBold",
                      fontSize: 16,
                      color: palette.onSurface,
                      marginBottom: 4,
                    }}
                  >
                    {step.title}
                  </Text>
                  <Text
                    style={{
                      fontFamily: "Manrope_400Regular",
                      fontSize: 14,
                      color: palette.onSurfaceVariant,
                      lineHeight: 20,
                    }}
                  >
                    {step.description}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
