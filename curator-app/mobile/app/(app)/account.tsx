import { useMemo, useState, useEffect } from "react";
import { Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { pickProfileImageUri } from "../../src/lib/pick-profile-image";
import { Camera, Download, Hash, Link2, Mail, Save, User } from "lucide-react-native";

import { useTheme } from "../../src/providers/theme-provider";
import { useAuth } from "../../src/providers/auth-provider";
import { useSubscription } from "../../src/providers/subscription-provider";
import { useToast } from "../../src/providers/toast-provider";
import { PillPageHeader } from "../../src/ui/pill-page-header";
import { useModalScrollPadding } from "../../src/lib/layout";
import { ProfileAvatar } from "../../src/ui/profile-avatar";
import { ApiError } from "../../src/services/api-client";

export default function AccountScreen() {
  const { palette } = useTheme();
  const { session, deleteAccount, updateProfileDetails, updateProfileAvatar, signOut, isBusy } =
    useAuth();
  const { tier } = useSubscription();
  const { showToast } = useToast();
  const router = useRouter();
  const modalScrollPadding = useModalScrollPadding();

  const displayName = session?.user?.displayName || "";
  const email = session?.user?.email || "";
  const uid = session?.user?.id || "";
  const avatarUrl = session?.user?.avatarUrl || null;

  const [name, setName] = useState(displayName);

  useEffect(() => {
    setName(session?.user?.displayName ?? "");
  }, [session?.user?.displayName]);

  const handlePickImage = async () => {
    try {
      const uri = await pickProfileImageUri();
      if (!uri) {
        return;
      }

      await updateProfileAvatar(uri);
      showToast("success", "Profile picture updated.");
    } catch {
      showToast("error", "Couldn't update your profile picture right now.");
    }
  };
  const handleDeleteAccount = () => {
    Alert.alert(
      "Delete Account?",
      "All your data, saved articles, collections, and preferences will be permanently lost. This cannot be undone.",
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
  const liveDisplayName = name.trim() || displayName;

  const memberSinceLabel = useMemo(() => {
    if (!session?.user.memberSince) {
      return "Recently";
    }

    return new Date(session.user.memberSince).toLocaleDateString(undefined, {
      month: "long",
      year: "numeric",
    });
  }, [session?.user.memberSince]);

  const hasChanges = name.trim() !== displayName.trim();

  const handleSave = async () => {
    const trimmedName = name.trim();

    if (!trimmedName) {
      showToast("warning", "Add a display name before saving.");
      return;
    }

    try {
      await updateProfileDetails({ displayName: trimmedName });
      showToast("success", "Profile updated successfully.");
    } catch {
      showToast("error", "Couldn't update your profile right now.");
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: palette.background }} edges={[]}>
      <PillPageHeader title="Account" />

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={[styles.content, { paddingTop: modalScrollPadding }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.hero}>
          <View style={styles.avatarWrap}>
            <Pressable
              onPress={() => void handlePickImage()}
              disabled={isBusy}
              style={({ pressed }) => [pressed && { opacity: 0.92 }]}
            >
              <ProfileAvatar
                avatarUrl={avatarUrl}
                displayName={session?.user?.displayName}
                email={session?.user?.email}
                size={96}
              />

              <View
                style={[
                  styles.cameraButton,
                  {
                    backgroundColor: palette.primary,
                    borderColor: palette.background,
                  },
                ]}
              >
                <Camera size={14} color={palette.primaryForeground} />
              </View>
            </Pressable>
          </View>

          <Text style={[styles.heroName, { color: palette.onSurface }]}>
            {liveDisplayName}
          </Text>
          <Text style={[styles.heroMeta, { color: palette.onSurfaceVariant }]}>
            Member since {memberSinceLabel}
          </Text>
        </View>

        <View style={styles.fieldStack}>
          <View
            style={[
              styles.fieldCard,
              {
                backgroundColor: palette.surfaceContainerLowest,
                borderColor: palette.outlineVariant + "26",
              },
            ]}
          >
            <View style={styles.fieldLabelRow}>
              <User size={14} color={palette.onSurfaceVariant} />
              <Text style={[styles.fieldLabel, { color: palette.onSurfaceVariant }]}>
                Display Name
              </Text>
            </View>
            <TextInput
              value={name}
              onChangeText={setName}
              style={[styles.fieldInput, { color: palette.onSurface }]}
              placeholderTextColor={palette.onSurfaceVariant}
              placeholder="Enter your name"
            />
          </View>

          <View
            style={[
              styles.fieldCard,
              {
                backgroundColor: palette.surfaceContainerLowest,
                borderColor: palette.outlineVariant + "26",
              },
            ]}
          >
            <View style={styles.fieldLabelRow}>
              <Mail size={14} color={palette.onSurfaceVariant} />
              <Text style={[styles.fieldLabel, { color: palette.onSurfaceVariant }]}>
                Email
              </Text>
            </View>
            <Text style={[styles.fieldValue, { color: palette.onSurfaceVariant }]}>
              {email}
            </Text>
          </View>

          <View
            style={[
              styles.fieldCard,
              {
                backgroundColor: palette.surfaceContainerLowest,
                borderColor: palette.outlineVariant + "26",
              },
            ]}
          >
            <View style={styles.fieldLabelRow}>
              <Hash size={14} color={palette.onSurfaceVariant} />
              <Text style={[styles.fieldLabel, { color: palette.onSurfaceVariant }]}>
                User ID
              </Text>
            </View>
            <Text numberOfLines={1} style={[styles.fieldValue, { color: palette.onSurfaceVariant }]}>
              {uid}
            </Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: palette.onSurface }]}>
            Account Information
          </Text>

          <View
            style={[
              styles.infoCard,
              {
                backgroundColor: palette.surfaceContainerLowest,
                borderColor: palette.outlineVariant + "26",
              },
            ]}
          >
            {[
              { label: "Account Status", value: "Active" },
              { label: "Member Since", value: memberSinceLabel },
              { label: "Account Type", value: tier === "free" ? "Free Reader" : `${tier} Reader` },
            ].map((item, index, array) => (
              <View key={item.label}>
                <View style={styles.infoRow}>
                  <Text style={[styles.infoLabel, { color: palette.onSurfaceVariant }]}>
                    {item.label}
                  </Text>
                  <Text
                    style={[
                      styles.infoValue,
                      { color: palette.onSurface },
                    ]}
                  >
                    {item.value}
                  </Text>
                </View>
                {index < array.length - 1 ? (
                  <View style={[styles.divider, { backgroundColor: palette.outlineVariant + "26" }]} />
                ) : null}
              </View>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: palette.onSurface }]}>
            Security & Access
          </Text>

          <Pressable
            onPress={() => router.push("/(app)/connected-accounts")}
            style={({ pressed }) => [
              styles.connectedRow,
              {
                backgroundColor: pressed ? palette.surfaceContainerLow : palette.surfaceContainerLowest,
                borderColor: palette.outlineVariant + "26",
              },
            ]}
          >
            <View style={styles.connectedContent}>
              <View
                style={[
                  styles.connectedIcon,
                  { backgroundColor: palette.surfaceContainer },
                ]}
              >
                <Link2 size={20} color={palette.primary} strokeWidth={2.1} />
              </View>

              <View style={styles.connectedCopy}>
                <Text style={[styles.connectedTitle, { color: palette.onSurface }]}>
                  Connected Accounts
                </Text>
                <Text style={[styles.connectedDescription, { color: palette.onSurfaceVariant }]}>
                  Manage linked sign-in methods and recovery access.
                </Text>
              </View>
            </View>
          </Pressable>

          <Pressable
            onPress={() => router.push("/(app)/data-export")}
            style={({ pressed }) => [
              styles.connectedRow,
              {
                backgroundColor: pressed ? palette.surfaceContainerLow : palette.surfaceContainerLowest,
                borderColor: palette.outlineVariant + "26",
                marginTop: 12,
              },
            ]}
          >
            <View style={styles.connectedContent}>
              <View
                style={[
                  styles.connectedIcon,
                  { backgroundColor: palette.surfaceContainer },
                ]}
              >
                <Download size={20} color={palette.primary} strokeWidth={2.1} />
              </View>

              <View style={styles.connectedCopy}>
                <Text style={[styles.connectedTitle, { color: palette.onSurface }]}>
                  Data Export
                </Text>
                <Text style={[styles.connectedDescription, { color: palette.onSurfaceVariant }]}>
                  Download a copy of your personal data and saved articles.
                </Text>
              </View>
            </View>
          </Pressable>
        </View>

        {hasChanges ? (
          <Pressable
            onPress={() => void handleSave()}
            disabled={isBusy}
            style={({ pressed }) => [
              styles.saveButton,
              {
                backgroundColor:
                  isBusy || pressed ? palette.primaryDim : palette.inverseSurface,
                opacity: isBusy ? 0.7 : 1,
              },
            ]}
          >
            <View style={styles.saveContent}>
              <Save size={18} color={palette.inversePrimary} strokeWidth={2.2} />
              <Text style={[styles.saveText, { color: palette.inversePrimary }]}>
                {isBusy ? "Saving Changes..." : "Save Changes"}
              </Text>
            </View>
          </Pressable>
        ) : null}

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: palette.onSurface }]}>
            Danger Zone
          </Text>

          <View
            style={[
              styles.dangerCard,
              {
                backgroundColor: palette.error + "0D",
                borderColor: palette.error + "33",
              },
            ]}
          >
            <Text style={[styles.dangerTitle, { color: palette.error }]}>
              Delete Account
            </Text>
            <Text style={[styles.dangerCopy, { color: palette.onSurfaceVariant }]}>
              Permanently delete your account and all associated data. This action cannot be undone.
            </Text>
            <Pressable
              onPress={handleDeleteAccount}
              style={[
                styles.deleteButton,
                { backgroundColor: palette.error },
              ]}
            >
              <Text style={[styles.deleteText, { color: palette.onError }]}>
                Delete My Account
              </Text>
            </Pressable>
          </View>
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
  hero: {
    alignItems: "center",
    marginTop: 8,
    marginBottom: 28,
  },
  avatarWrap: {
    position: "relative",
  },
  avatar: {
    width: 104,
    height: 104,
    borderRadius: 52,
    borderWidth: 3,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarImage: {
    width: 104,
    height: 104,
    borderRadius: 52,
    borderWidth: 3,
  },
  cameraButton: {
    position: "absolute",
    right: 0,
    bottom: 0,
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 3,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    fontFamily: "Manrope_700Bold",
    fontSize: 40,
  },
  heroName: {
    fontFamily: "Newsreader_500Medium",
    fontSize: 34,
    lineHeight: 38,
    marginTop: 18,
    marginBottom: 6,
  },
  heroMeta: {
    fontFamily: "Manrope_400Regular",
    fontSize: 14,
  },
  fieldStack: {
    gap: 12,
    marginBottom: 28,
  },
  fieldCard: {
    borderRadius: 26,
    borderWidth: 1,
    padding: 20,
  },
  fieldLabelRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 10,
  },
  fieldLabel: {
    fontFamily: "Manrope_600SemiBold",
    fontSize: 11,
    textTransform: "uppercase",
    letterSpacing: 2,
  },
  fieldInput: {
    fontFamily: "Manrope_500Medium",
    fontSize: 16,
    padding: 0,
  },
  fieldValue: {
    fontFamily: "Manrope_500Medium",
    fontSize: 15,
  },
  section: {
    gap: 12,
    marginBottom: 28,
  },
  sectionTitle: {
    fontFamily: "Newsreader_500Medium_Italic",
    fontSize: 24,
    paddingHorizontal: 4,
  },
  infoCard: {
    borderRadius: 26,
    borderWidth: 1,
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
    gap: 16,
  },
  infoLabel: {
    fontFamily: "Manrope_400Regular",
    fontSize: 14,
  },
  infoValue: {
    fontFamily: "Manrope_500Medium",
    fontSize: 14,
    textTransform: "capitalize",
  },
  divider: {
    height: 1,
  },
  connectedRow: {
    borderRadius: 30,
    borderWidth: 1,
    overflow: "hidden",
  },
  connectedContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    minHeight: 78,
    paddingHorizontal: 16,
    paddingVertical: 15,
  },
  connectedIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  connectedCopy: {
    flex: 1,
    minWidth: 0,
    gap: 3,
  },
  connectedTitle: {
    fontFamily: "Manrope_500Medium",
    fontSize: 15,
  },
  connectedDescription: {
    fontFamily: "Manrope_400Regular",
    fontSize: 12,
    lineHeight: 18,
  },
  saveButton: {
    width: "100%",
    minHeight: 68,
    borderRadius: 999,
    justifyContent: "center",
    paddingHorizontal: 20,
    marginBottom: 28,
  },
  saveContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
  },
  saveText: {
    fontFamily: "Manrope_600SemiBold",
    fontSize: 14,
  },
  dangerCard: {
    borderRadius: 26,
    borderWidth: 1,
    padding: 20,
  },
  dangerTitle: {
    fontFamily: "Manrope_600SemiBold",
    fontSize: 16,
    marginBottom: 4,
  },
  dangerCopy: {
    fontFamily: "Manrope_400Regular",
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 16,
  },
  deleteButton: {
    alignSelf: "flex-start",
    borderRadius: 999,
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  deleteText: {
    fontFamily: "Manrope_600SemiBold",
    fontSize: 14,
  },
});
