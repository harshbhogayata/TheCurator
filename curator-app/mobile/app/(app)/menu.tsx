import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import {
  FolderOpen,
  BarChart3,
  Heart,
  Settings,
  HelpCircle,
  LogOut,
  Info,
  FileText,
  ChevronRight,
} from "lucide-react-native";

import { useTheme } from "../../src/providers/theme-provider";
import { useAuth } from "../../src/providers/auth-provider";
import { useSubscription } from "../../src/providers/subscription-provider";
import { SubscriptionBadge } from "../../src/ui/subscription-badge";
import { ProfileAvatar } from "../../src/ui/profile-avatar";
import { GlassCard } from "../../src/ui/glass-card";
import { PillPageHeader } from "../../src/ui/pill-page-header";
import { useModalScrollPadding } from "../../src/lib/layout";
import { userDisplayName } from "../../src/lib/user-display-name";
import { useNavigateFromModal } from "../../src/lib/navigate-from-modal";

const menuItems = [
  { icon: FolderOpen, label: "Collections", path: "/(app)/collections" as const },
  { icon: BarChart3, label: "Reading Stats", path: "/(app)/reading-stats" as const },
  { icon: Settings, label: "Settings", path: "/(app)/settings" as const },
  { icon: Heart, label: "Support Us", path: "/(app)/donate" as const },
  { icon: Info, label: "About The Curator", path: "/(app)/about" as const },
  { icon: FileText, label: "Privacy Policy", path: "/(app)/privacy" as const },
  { icon: HelpCircle, label: "Help & Support", path: "/(app)/help" as const },
];

export default function MenuScreen() {
  const { palette } = useTheme();
  const { session, signOut } = useAuth();
  const { tier } = useSubscription();
  const navigateFromModal = useNavigateFromModal();
  const modalScrollPadding = useModalScrollPadding();

  const handleSignOut = () => {
    Alert.alert("Sign Out?", "You'll need to sign in again to access your saved articles.", [
      { text: "Cancel", style: "cancel" },
      { text: "Sign Out", style: "destructive", onPress: () => void signOut() },
    ]);
  };

  const displayName = userDisplayName(session?.user);
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
          { backgroundColor: palette.primary + "14", top: -50, left: -40 },
        ]}
      />
      <View
        pointerEvents="none"
        style={[
          styles.ambientOrb,
          styles.secondaryOrb,
          { backgroundColor: palette.tertiary + "12", top: 260, right: -90 },
        ]}
      />

      <SafeAreaView style={{ flex: 1 }} edges={[]}>
        <PillPageHeader title="Menu" leadingAction="close" />

        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={[styles.scrollContent, { paddingTop: modalScrollPadding }]}
          showsVerticalScrollIndicator={false}
        >
          <Pressable
            onPress={() => navigateFromModal("/(app)/profile")}
            style={({ pressed }) => ({ opacity: pressed ? 0.94 : 1, marginBottom: 28 })}
          >
            <GlassCard
              borderRadius={38}
              style={styles.profileCard}
            >
              <View
                style={[
                  styles.profileAvatarWrap,
                  { borderColor: palette.outlineVariant + "40" },
                ]}
              >
                <ProfileAvatar
                  avatarUrl={session?.user?.avatarUrl}
                  displayName={session?.user?.displayName}
                  email={session?.user?.email}
                  size={64}
                />
              </View>

              <View style={styles.profileCopy}>
                <Text style={[styles.profileName, { color: palette.onSurface }]} numberOfLines={1}>
                  {displayName}
                </Text>
                <View style={styles.profileMetaRow}>
                  <SubscriptionBadge size="sm" />
                  <Text style={[styles.profileMeta, { color: palette.outline }]}>
                    {memberLabel}
                  </Text>
                </View>
              </View>

              <ChevronRight
                size={20}
                color={palette.outlineVariant}
                strokeWidth={2.2}
                style={{ flexShrink: 0 }}
              />
            </GlassCard>
          </Pressable>

          <View style={styles.navList}>
            {menuItems.map((item) => {
              const Icon = item.icon;

              return (
                <GlassCard key={item.label} borderRadius={30} style={styles.menuCard}>
                  <Pressable
                    onPress={() => navigateFromModal(item.path)}
                    style={({ pressed }) => [
                      styles.menuPressable,
                      {
                        backgroundColor: pressed ? palette.surfaceContainerLow + "B3" : "transparent",
                      },
                    ]}
                  >
                    <View style={styles.menuItem}>
                      <View
                        style={[
                          styles.menuIcon,
                          { backgroundColor: palette.primaryContainer },
                        ]}
                      >
                        <Icon size={22} color={palette.onPrimaryContainer} strokeWidth={2.1} />
                      </View>

                      <View style={styles.menuLabelWrap}>
                        <Text
                          numberOfLines={1}
                          style={[styles.menuLabel, { color: palette.onSurface }]}
                        >
                          {item.label}
                        </Text>
                      </View>

                      <ChevronRight size={18} color={palette.outlineVariant} strokeWidth={2.1} />
                    </View>
                  </Pressable>
                </GlassCard>
              );
            })}
          </View>

          <GlassCard borderRadius={30} style={styles.signOutCard}>
            <Pressable
              onPress={handleSignOut}
              style={({ pressed }) => [
                styles.menuPressable,
                {
                  backgroundColor: pressed
                    ? palette.surfaceContainerLow + "B3"
                    : "transparent",
                },
              ]}
            >
              <View style={styles.menuItem}>
                <View
                  style={[
                    styles.menuIcon,
                    { backgroundColor: palette.errorContainer },
                  ]}
                >
                  <LogOut
                    size={22}
                    color={palette.onErrorContainer}
                    strokeWidth={2.1}
                  />
                </View>

                <View style={styles.menuLabelWrap}>
                  <Text
                    numberOfLines={1}
                    style={[styles.menuLabel, { color: palette.error }]}
                  >
                    Sign Out
                  </Text>
                </View>
              </View>
            </Pressable>
          </GlassCard>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  ambientOrb: {
    position: "absolute",
    width: 260,
    height: 260,
    borderRadius: 999,
    opacity: 0.9,
  },
  secondaryOrb: {
    width: 220,
    height: 220,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingBottom: 42,
  },
  profileCard: {
    padding: 22,
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    minHeight: 112,
  },
  profileAvatarWrap: {
    width: 68,
    height: 68,
    borderRadius: 34,
    overflow: "hidden",
    borderWidth: 2,
  },
  profileCopy: {
    flex: 1,
    minWidth: 0,
  },
  profileName: {
    fontFamily: "Newsreader_500Medium",
    fontSize: 26,
    marginBottom: 6,
  },
  profileMetaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flexWrap: "wrap",
  },
  profileMeta: {
    fontFamily: "Manrope_500Medium",
    fontSize: 13,
  },
  navList: {
    gap: 10,
  },
  menuCard: {
    // Shadow handled by GlassCard outer wrapper.
  },
  menuPressable: {
    width: "100%",
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    minHeight: 76,
    paddingHorizontal: 18,
    paddingVertical: 14,
  },
  menuIcon: {
    width: 46,
    height: 46,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 16,
    flexShrink: 0,
  },
  menuLabelWrap: {
    flex: 1,
    minWidth: 0,
    justifyContent: "center",
  },
  menuLabel: {
    fontFamily: "Manrope_500Medium",
    fontSize: 17,
    lineHeight: 22,
  },
  signOutCard: {
    marginTop: 28,
  },
});
