import { useState } from "react";
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { BlurView } from "expo-blur";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { pickProfileImageUri } from "../../src/lib/pick-profile-image";
import { AvatarUploadError, isAvatarUploadAvailable } from "../../src/services/avatar-upload";
import {
  ChevronRight,
  CreditCard,
  Shield,
  Trash2,
  Link2,
  Camera,
} from "lucide-react-native";

import { useTheme } from "../../src/providers/theme-provider";
import { useAuth } from "../../src/providers/auth-provider";
import { useSubscription } from "../../src/providers/subscription-provider";
import { useSavedArticles } from "../../src/providers/saved-articles-provider";
import { useReadingStats } from "../../src/providers/reading-stats-provider";
import { SubscriptionBadge } from "../../src/ui/subscription-badge";
import { ProfileAvatar } from "../../src/ui/profile-avatar";
import { EmailVerificationBanner } from "../../src/ui/email-verification-banner";
import { Header } from "../../src/ui/header";
import { userDisplayName } from "../../src/lib/user-display-name";
import { type } from "../../src/ui/tokens/typography";
import { ApiError } from "../../src/services/api-client";
import { useToast } from "../../src/providers/toast-provider";

const profileActions = [
  { icon: CreditCard, label: "Manage Subscription", path: "/(app)/donate" as const },
  { icon: Link2, label: "Connected Accounts", path: "/(app)/connected-accounts" as const },
  { icon: Shield, label: "Privacy Settings", path: "/(app)/privacy" as const },
];

export default function ProfileScreen() {
  const { palette, resolvedTheme } = useTheme();
  const { session, deleteAccount, signOut, updateProfileAvatar } = useAuth();
  const { tier } = useSubscription();
  const { savedCount } = useSavedArticles();
  const { stats } = useReadingStats();
  const router = useRouter();
  const { showToast } = useToast();
  
  const handlePickImage = async () => {
    if (!isAvatarUploadAvailable()) {
      showToast(
        "info",
        "Profile photo upload will be available once Firebase Storage is enabled. Your initials avatar looks great for now.",
      );
      return;
    }

    try {
      const uri = await pickProfileImageUri();
      if (!uri) {
        return;
      }

      await updateProfileAvatar(uri);
      showToast("success", "Profile picture updated");
    } catch (error) {
      if (error instanceof AvatarUploadError) {
        showToast(error.code === "storage_unavailable" ? "info" : "error", error.message);
        return;
      }
      console.error("Image pick error", error);
      showToast("error", "Failed to update profile picture");
    }
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      "Delete Account?",
      "This will permanently delete your account, saved articles, and preferences. This cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () =>
            void deleteAccount().catch((error) => {
              const code =
                error instanceof ApiError &&
                typeof error.details === "object" &&
                error.details !== null &&
                "code" in error.details
                  ? error.details.code
                  : null;

              if (code === "reauth_required") {
                Alert.alert(
                  "Sign In Again",
                  "For security, sign out and sign back in before deleting your account.",
                  [
                    { text: "Not Now", style: "cancel" },
                    {
                      text: "Sign Out",
                      style: "destructive",
                      onPress: () => {
                        void signOut().finally(() => router.replace("/(auth)/welcome"));
                      },
                    },
                  ],
                );
                return;
              }

              showToast("error", "Couldn't delete your account right now. Please try again.");
            }),
        },
      ]
    );
  };

  const displayName = userDisplayName(session?.user);
  const tint = resolvedTheme === "dark" ? "dark" : "light";
  const memberLabel =
    tier === "lifetime"
      ? "Lifetime Member"
      : tier === "premium"
      ? "Premium Member"
      : tier === "basic"
      ? "Basic Member"
      : "Free Member";

  return (
    <View style={{ flex: 1, backgroundColor: palette.background }}>
      <LinearGradient
        colors={[palette.surface, palette.background, palette.surfaceContainerLow]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />

      <View
        pointerEvents="none"
        style={[
          styles.ambientOrb,
          {
            backgroundColor: palette.primary + "14",
            top: -40,
            left: -30,
          },
        ]}
      />
      <View
        pointerEvents="none"
        style={[
          styles.ambientOrb,
          styles.secondaryOrb,
          {
            backgroundColor: palette.secondary + "12",
            top: 170,
            right: -70,
          },
        ]}
      />

      <SafeAreaView style={{ flex: 1 }} edges={[]}>
        <Header title="The Curator" showBadge={false} />

        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <EmailVerificationBanner />
          <View style={styles.heroSection}>
            <View style={[styles.avatarGlow, { backgroundColor: palette.surfaceContainerLowest + "B3" }]} />
            <Pressable onPress={handlePickImage} style={{ marginBottom: 20 }}>
              <View
                style={[
                  styles.heroAvatarRing,
                  {
                    borderColor: palette.outlineVariant + "40",
                    shadowColor: "#000",
                    marginBottom: 0,
                  },
                ]}
              >
                <ProfileAvatar
                  avatarUrl={session?.user?.avatarUrl}
                  displayName={session?.user?.displayName}
                  email={session?.user?.email}
                  size={108}
                />
              </View>
              <View
                style={{
                  position: "absolute",
                  bottom: 0,
                  right: 0,
                  backgroundColor: palette.primary,
                  width: 34,
                  height: 34,
                  borderRadius: 17,
                  alignItems: "center",
                  justifyContent: "center",
                  borderWidth: 3,
                  borderColor: palette.background,
                }}
              >
                <Camera size={16} color={palette.primaryForeground} />
              </View>
            </Pressable>

            <Text style={[styles.name, { color: palette.onSurface }]}>
              {displayName}
            </Text>

            <View
              style={[
                styles.memberPill,
                {
                  backgroundColor: palette.surfaceContainerLowest + "B3",
                  borderColor: palette.outlineVariant + "30",
                },
              ]}
            >
              <SubscriptionBadge size="sm" />
              <Text style={[styles.memberText, { color: palette.onSurfaceVariant }]}>
                {memberLabel}
              </Text>
            </View>
          </View>

          <View style={styles.statsGrid}>
            {[
              { label: "Summaries Read", value: stats.totalArticlesRead },
              { label: "Sources Saved", value: savedCount },
            ].map((item) => (
              <View
                key={item.label}
                style={[
                  styles.statCard,
                  {
                    borderColor: palette.outlineVariant + "26",
                    shadowColor: "#000",
                  },
                ]}
              >
                <BlurView
                  intensity={72}
                  tint={tint}
                  style={[
                    StyleSheet.absoluteFillObject,
                    { backgroundColor: palette.surfaceContainerLowest + "BF" },
                  ]}
                />
                <Text style={[styles.statValue, { color: palette.primary }]}>
                  {item.value}
                </Text>
                <Text style={[styles.statLabel, { color: palette.onSurfaceVariant }]}>
                  {item.label}
                </Text>
              </View>
            ))}
          </View>

          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: palette.onSurface }]}>
              Preferences & Security
            </Text>

            <View style={styles.actionList}>
              {profileActions.map((item) => {
                const Icon = item.icon;

                return (
                  <View
                    key={item.label}
                    style={[
                      styles.actionShell,
                      { borderColor: palette.outlineVariant + "26" },
                    ]}
                  >
                    <BlurView
                      intensity={72}
                      tint={tint}
                      style={[
                        StyleSheet.absoluteFillObject,
                        { backgroundColor: palette.surfaceContainerLowest + "B8" },
                      ]}
                    />

                    <Pressable
                      onPress={() => router.push(item.path)}
                      style={({ pressed }) => [
                        styles.actionPressable,
                        {
                          backgroundColor: pressed ? palette.surfaceContainerLow + "99" : "transparent",
                        },
                      ]}
                    >
                      <View style={styles.actionRow}>
                        <View
                          style={[
                            styles.actionIcon,
                            { backgroundColor: palette.surfaceContainer },
                          ]}
                        >
                          <Icon size={20} color={palette.primary} strokeWidth={2.1} />
                        </View>

                        <View style={styles.actionCopy}>
                          <Text
                            numberOfLines={1}
                            style={[styles.actionLabel, { color: palette.onSurface }]}
                          >
                            {item.label}
                          </Text>
                        </View>

                        <ChevronRight size={18} color={palette.outlineVariant} />
                      </View>
                    </Pressable>
                  </View>
                );
              })}
            </View>
          </View>

          <View style={[styles.actionShell, { borderColor: palette.error + "50" }]}>
            <BlurView
              intensity={72}
              tint={tint}
              style={[StyleSheet.absoluteFillObject, { backgroundColor: palette.errorContainer + "B8" }]}
            />
            <Pressable
              onPress={handleDeleteAccount}
              style={({ pressed }) => [
                styles.actionPressable,
                { backgroundColor: pressed ? palette.error + "20" : "transparent" },
              ]}
            >
              <View style={styles.actionRow}>
                <View style={[styles.actionIcon, { backgroundColor: palette.errorContainer }]}>
                  <Trash2 size={20} color={palette.onErrorContainer} strokeWidth={2.1} />
                </View>
                <View style={styles.actionCopy}>
                  <Text numberOfLines={1} style={[styles.actionLabel, { color: palette.onErrorContainer }]}>
                    Delete Account
                  </Text>
                </View>
              </View>
            </Pressable>
          </View>
        </ScrollView>

      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  ambientOrb: {
    position: "absolute",
    width: 240,
    height: 240,
    borderRadius: 999,
    opacity: 0.9,
  },
  secondaryOrb: {
    width: 220,
    height: 220,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 148,
    paddingBottom: 150,
  },
  heroSection: {
    alignItems: "center",
    marginBottom: 28,
  },
  avatarGlow: {
    position: "absolute",
    top: 10,
    width: 152,
    height: 152,
    borderRadius: 76,
    opacity: 0.6,
  },
  heroAvatarRing: {
    width: 116,
    height: 116,
    borderRadius: 58,
    overflow: "hidden",
    borderWidth: 4,
    marginBottom: 20,
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.14,
    shadowRadius: 30,
    elevation: 10,
  },
  name: {
    fontFamily: "Newsreader_500Medium",
    fontSize: 36,
    lineHeight: 40,
    letterSpacing: -0.8,
    textAlign: "center",
    marginBottom: 12,
  },
  memberPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 18,
    paddingVertical: 9,
    borderRadius: 999,
    borderWidth: 1,
  },
  memberText: {
    ...type.overline,
    fontFamily: "Manrope_700Bold",
    letterSpacing: 1.6,
  },
  statsGrid: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 34,
  },
  statCard: {
    flex: 1,
    overflow: "hidden",
    borderRadius: 28,
    borderWidth: 1,
    minHeight: 118,
    paddingHorizontal: 20,
    paddingVertical: 18,
    justifyContent: "center",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.05,
    shadowRadius: 20,
    elevation: 6,
  },
  statLabel: {
    ...type.overline,
    fontFamily: "Manrope_700Bold",
    letterSpacing: 1.4,
    marginTop: 8,
  },
  statValue: {
    fontFamily: "Newsreader_500Medium",
    fontSize: 34,
    lineHeight: 38,
  },
  section: {
    gap: 18,
    marginBottom: 34,
  },
  sectionTitle: {
    ...type.headlineSm,
    paddingHorizontal: 4,
  },
  actionList: {
    gap: 12,
  },
  actionShell: {
    overflow: "hidden",
    borderRadius: 999,
    borderWidth: 1,
  },
  actionPressable: {
    width: "100%",
  },
  actionRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    minHeight: 72,
    paddingHorizontal: 16,
    paddingVertical: 15,
  },
  actionIcon: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: "center",
    justifyContent: "center",
  },
  actionCopy: {
    flex: 1,
    minWidth: 0,
    justifyContent: "center",
  },
  actionLabel: {
    ...type.label,
    fontFamily: "Manrope_500Medium",
  },
});
