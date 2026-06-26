import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Check, Link2, Mail } from "lucide-react-native";

import { useTheme } from "../../src/providers/theme-provider";
import { useAuth } from "../../src/providers/auth-provider";
import { PillPageHeader } from "../../src/ui/pill-page-header";
import { useModalScrollPadding } from "../../src/lib/layout";

const providerCopy = {
  email: {
    title: "Email & Password",
    description: "Primary account access for sign-in recovery and security checks.",
    Icon: Mail,
  },
  google: {
    title: "Google",
    description: "Keep your reading state and preferences aligned across Google sign-ins.",
    Icon: Link2,
  },
} as const;

const VISIBLE_PROVIDERS = ["email", "google"] as const;

export default function ConnectedAccountsScreen() {
  const { palette } = useTheme();
  const { session } = useAuth();
  const modalScrollPadding = useModalScrollPadding();

  const connectedProviders = new Set(session?.identities.map((identity) => identity.provider) ?? []);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: palette.background }} edges={[]}>
      <PillPageHeader title="Connected Accounts" />

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={[styles.content, { paddingTop: modalScrollPadding }]}
        showsVerticalScrollIndicator={false}
      >
        <Text style={[styles.intro, { color: palette.onSurfaceVariant }]}>
          Link the providers you want available at sign-in so your account feels consistent wherever you open The Curator.
        </Text>

        <View style={styles.providerList}>
          {VISIBLE_PROVIDERS.map((provider) => {
            const { title, description, Icon } = providerCopy[provider];
            const isConnected = provider === "email" ? true : connectedProviders.has(provider);
            const badgeLabel = provider === "email" ? "Primary" : isConnected ? "Connected" : "Coming Soon";

            return (
              <View
                key={provider}
                style={[
                  styles.providerCard,
                  {
                    backgroundColor: palette.surfaceContainerLowest,
                    borderColor: palette.outlineVariant + "26",
                  },
                ]}
              >
                <View style={styles.providerHeader}>
                  <View
                    style={[
                      styles.providerIcon,
                      { backgroundColor: palette.primaryContainer },
                    ]}
                  >
                    <Icon size={20} color={palette.onPrimaryContainer} />
                  </View>

                  <View style={styles.providerCopy}>
                    <View style={styles.providerTitleRow}>
                      <Text numberOfLines={1} style={[styles.providerTitle, { color: palette.onSurface }]}>
                        {title}
                      </Text>
                      {isConnected ? (
                        <View
                          style={[
                            styles.connectedBadge,
                            { backgroundColor: palette.primary + "14" },
                          ]}
                        >
                          <Check size={12} color={palette.primary} />
                          <Text style={[styles.connectedLabel, { color: palette.primary }]}>
                            Connected
                          </Text>
                        </View>
                      ) : null}
                    </View>

                    <Text style={[styles.providerDescription, { color: palette.onSurfaceVariant }]}>
                      {description}
                    </Text>

                    <View style={styles.metaRow}>
                      <View
                        style={[
                          styles.metaPill,
                          { backgroundColor: palette.surfaceContainerLow },
                        ]}
                      >
                        <Text numberOfLines={1} style={[styles.metaText, { color: palette.onSurfaceVariant }]}>
                          {provider === "email" ? session?.user.email ?? "Primary email" : badgeLabel}
                        </Text>
                      </View>
                    </View>
                  </View>
                </View>

                {provider === "email" ? (
                  <View
                    style={[
                      styles.actionPill,
                      {
                        backgroundColor: palette.surfaceContainer,
                        borderColor: palette.outlineVariant + "26",
                      },
                    ]}
                  >
                    <Text style={[styles.actionText, { color: palette.onSurfaceVariant }]}>
                      Primary
                    </Text>
                  </View>
                ) : isConnected ? (
                  <View
                    style={[
                      styles.actionPill,
                      {
                        backgroundColor: palette.surfaceContainer,
                        borderColor: palette.outlineVariant + "26",
                      },
                    ]}
                  >
                    <Text style={[styles.actionText, { color: palette.onSurfaceVariant }]}>
                      Connected
                    </Text>
                  </View>
                ) : (
                  <View
                    style={[
                      styles.actionPill,
                      {
                        backgroundColor: palette.surfaceContainer,
                        borderColor: palette.outlineVariant + "26",
                        opacity: 0.7,
                      },
                    ]}
                  >
                    <Text style={[styles.actionText, { color: palette.onSurfaceVariant }]}>
                      Coming Soon
                    </Text>
                  </View>
                )}
              </View>
            );
          })}
        </View>

        <View
          style={[
            styles.infoCard,
            {
              backgroundColor: palette.primaryContainer + "80",
              borderColor: palette.outlineVariant + "26",
            },
          ]}
        >
          <Text style={[styles.infoTitle, { color: palette.onPrimaryContainer }]}>
            Account Security
          </Text>
          <Text style={[styles.infoText, { color: palette.onSurfaceVariant }]}>
            Your reading history, onboarding choices, and subscription state stay attached to one Curator account, even as we add more sign-in providers.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  intro: {
    fontFamily: "Manrope_400Regular",
    fontSize: 14,
    lineHeight: 20,
    textAlign: "center",
    marginBottom: 24,
  },
  providerList: {
    gap: 12,
    marginBottom: 24,
  },
  providerCard: {
    borderRadius: 28,
    borderWidth: 1,
    padding: 18,
    gap: 16,
  },
  providerHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 14,
  },
  providerIcon: {
    width: 46,
    height: 46,
    borderRadius: 23,
    alignItems: "center",
    justifyContent: "center",
  },
  providerCopy: {
    flex: 1,
    minWidth: 0,
    gap: 6,
  },
  providerTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flexWrap: "wrap",
  },
  providerTitle: {
    fontFamily: "Manrope_600SemiBold",
    fontSize: 16,
  },
  providerDescription: {
    fontFamily: "Manrope_400Regular",
    fontSize: 13,
    lineHeight: 19,
  },
  connectedBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 999,
  },
  connectedLabel: {
    fontFamily: "Manrope_600SemiBold",
    fontSize: 10,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  metaRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  metaPill: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
  },
  metaText: {
    fontFamily: "Manrope_500Medium",
    fontSize: 11,
  },
  actionPill: {
    minHeight: 48,
    borderRadius: 999,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 18,
  },
  actionText: {
    fontFamily: "Manrope_600SemiBold",
    fontSize: 13,
    letterSpacing: 0.2,
  },
  infoCard: {
    borderRadius: 28,
    borderWidth: 1,
    padding: 20,
    gap: 8,
  },
  infoTitle: {
    fontFamily: "Newsreader_500Medium",
    fontSize: 22,
  },
  infoText: {
    fontFamily: "Manrope_400Regular",
    fontSize: 14,
    lineHeight: 20,
  },
});
