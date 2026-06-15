import { Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useTheme } from "../../src/providers/theme-provider";
import { PRIVACY_EMAIL } from "../../src/constants/site";
import { PillPageHeader } from "../../src/ui/pill-page-header";

const sections = [
  {
    title: "Information We Collect",
    content: [
      {
        subtitle: "Account Information",
        text: "When you create an account, we collect your name, email address, and password (encrypted).",
      },
      {
        subtitle: "Usage Data",
        text: "We collect information about how you interact with The Curator, including articles read, time spent, and features used.",
      },
      {
        subtitle: "Payment Information",
        text: "If you subscribe, we collect payment information through our secure payment processor. We never store your full credit card details.",
      },
    ],
  },
  {
    title: "How We Use Your Information",
    bullets: [
      "To provide and improve our services",
      "To personalize your reading experience",
      "To process payments and manage subscriptions",
      "To send you updates about The Curator (you can opt out anytime)",
      "To analyze usage patterns and improve our platform",
    ],
  },
  {
    title: "Data Security",
    text: "We use industry-standard security measures to protect your data, including encryption, secure servers, and regular security audits. However, no method of transmission over the internet is 100% secure.",
  },
  {
    title: "Your Rights",
    bullets: [
      "Access your personal data",
      "Correct inaccurate information",
      "Request deletion of your account and data",
      "Opt out of marketing communications",
      "Export your data",
    ],
  },
  {
    title: "Third-Party Services",
    text: "We do not sell your personal information. We may share data with service providers who help us operate The Curator (e.g., payment processors, email services), legal authorities when required by law, and aggregated, anonymized data for research and analytics.",
  },
  {
    title: "Contact Us",
    text: `If you have questions about this Privacy Policy or your data, please contact us at ${PRIVACY_EMAIL}`,
  },
];

export default function PrivacyScreen() {
  const { palette } = useTheme();

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: palette.background }}>
      <PillPageHeader title="Privacy Policy" />

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
      >
        <Text
          style={{
            fontFamily: "Manrope_400Regular",
            fontSize: 13,
            color: palette.onSurfaceVariant,
            marginBottom: 24,
          }}
        >
          Last Updated: March 2026
        </Text>

        <Text
          style={{
            fontFamily: "Manrope_400Regular",
            fontSize: 14,
            color: palette.onSurfaceVariant,
            lineHeight: 22,
            marginBottom: 24,
          }}
        >
          At The Curator, we take your privacy seriously. This Privacy Policy explains how we collect, use, and protect
          your personal information when you use our service.
        </Text>

        {sections.map((section) => (
          <View
            key={section.title}
            style={{
              backgroundColor: palette.surfaceContainerLowest,
              borderRadius: 24,
              borderWidth: 1,
              borderColor: palette.outlineVariant + "26",
              padding: 20,
              marginBottom: 12,
            }}
          >
            <Text
              style={{
                fontFamily: "Newsreader_700Bold",
                fontSize: 20,
                color: palette.onSurface,
                marginBottom: 12,
              }}
            >
              {section.title}
            </Text>

            {section.content &&
              section.content.map((item) => (
                <View key={item.subtitle} style={{ marginBottom: 12 }}>
                  <Text
                    style={{
                      fontFamily: "Manrope_600SemiBold",
                      fontSize: 15,
                      color: palette.onSurface,
                      marginBottom: 4,
                    }}
                  >
                    {item.subtitle}
                  </Text>
                  <Text
                    style={{
                      fontFamily: "Manrope_400Regular",
                      fontSize: 14,
                      color: palette.onSurfaceVariant,
                      lineHeight: 20,
                    }}
                  >
                    {item.text}
                  </Text>
                </View>
              ))}

            {section.bullets && (
              <View style={{ gap: 8 }}>
                {section.bullets.map((bullet) => (
                  <View key={bullet} style={{ flexDirection: "row", gap: 8 }}>
                    <Text
                      style={{
                        fontFamily: "Manrope_400Regular",
                        fontSize: 14,
                        color: palette.onSurfaceVariant,
                      }}
                    >
                      {"\u2022"}
                    </Text>
                    <Text
                      style={{
                        flex: 1,
                        fontFamily: "Manrope_400Regular",
                        fontSize: 14,
                        color: palette.onSurfaceVariant,
                        lineHeight: 20,
                      }}
                    >
                      {bullet}
                    </Text>
                  </View>
                ))}
              </View>
            )}

            {section.text && (
              <Text
                style={{
                  fontFamily: "Manrope_400Regular",
                  fontSize: 14,
                  color: palette.onSurfaceVariant,
                  lineHeight: 20,
                }}
              >
                {section.text}
              </Text>
            )}
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}
