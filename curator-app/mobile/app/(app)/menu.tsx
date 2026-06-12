import { useState } from "react";
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { BlurView } from "expo-blur";
import {
  X,
  Sparkles,
  Compass,
  FolderOpen,
  Bookmark,
  BarChart3,
  Heart,
  Settings,
  HelpCircle,
  LogOut,
  Search,
  User,
  Info,
  FileText,
} from "lucide-react-native";

import { useTheme } from "../../src/providers/theme-provider";
import { useAuth } from "../../src/providers/auth-provider";
import { useSubscription } from "../../src/providers/subscription-provider";
import { SubscriptionBadge } from "../../src/ui/subscription-badge";
import { ProfileAvatar } from "../../src/ui/profile-avatar";
import { userDisplayName } from "../../src/lib/user-display-name";

const menuItems = [
  { icon: Sparkles, label: "Daily Briefs", path: "/(app)/(tabs)" as const },
  { icon: Compass, label: "Explore", path: "/(app)/(tabs)/explore" as const },
  { icon: Search, label: "Search Articles", path: "/(app)/(tabs)/search" as const },
  { icon: Bookmark, label: "Saved Articles", path: "/(app)/(tabs)/saved" as const },
  { icon: FolderOpen, label: "Collections", path: "/(app)/collections" as const },
  { icon: BarChart3, label: "Reading Stats", path: "/(app)/reading-stats" as const },
  { icon: User, label: "Profile", path: "/(app)/profile" as const },
  { icon: Settings, label: "Settings", path: "/(app)/settings" as const },
  { icon: Heart, label: "Support Us", path: "/(app)/donate" as const },
  { icon: Info, label: "About The Curator", path: "/(app)/about" as const },
  { icon: FileText, label: "Privacy Policy", path: "/(app)/privacy" as const },
  { icon: HelpCircle, label: "Help & Support", path: "/(app)/help" as const },
];

export default function MenuScreen() {
  const { palette, resolvedTheme } = useTheme();
  const { session, signOut } = useAuth();
  const { tier } = useSubscription();
  const router = useRouter();
  const handleSignOut = () => {
    Alert.alert("Sign Out?", "You'll need to sign in again to access your saved articles.", [
      { text: "Cancel", style: "cancel" },
      { text: "Sign Out", style: "destructive", onPress: () => void signOut() },
    ]);
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

      <SafeAreaView style={{ flex: 1 }} edges={["top", "left", "right"]}>
        <View style={styles.headerRow}>
          <View style={[styles.shadow, { flex: 1 }]}>
            <View
              style={[
                styles.headerPill,
                {
                  borderColor: palette.outlineVariant + "4D",
                },
              ]}
            >
              <BlurView
                intensity={80}
                tint={tint}
                style={[
                  StyleSheet.absoluteFillObject,
                  { backgroundColor: palette.surfaceContainerLowest + "CC" },
                ]}
              />
              <Text style={[styles.headerTitle, { color: palette.onSurface }]}>
                Menu
              </Text>
            </View>
          </View>

          <View style={styles.shadow}>
            <View
              style={[
                styles.closePill,
                {
                  borderColor: palette.outlineVariant + "4D",
                },
              ]}
            >
              <BlurView
                intensity={80}
                tint={tint}
                style={[
                  StyleSheet.absoluteFillObject,
                  { backgroundColor: palette.surfaceContainerLowest + "CC" },
                ]}
              />
              <Pressable
                onPress={() => router.back()}
                style={({ pressed }) => [
                  styles.closeButton,
                  {
                    backgroundColor: pressed ? palette.surfaceContainerLow + "99" : "transparent",
                  },
                ]}
              >
                <X size={20} color={palette.onSurface} strokeWidth={2.5} />
              </Pressable>
            </View>
          </View>
        </View>

        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View
            style={[
              styles.profileCard,
              {
                borderColor: palette.outlineVariant + "26",
              },
            ]}
          >
            <BlurView
              intensity={78}
              tint={tint}
              style={[
                StyleSheet.absoluteFillObject,
                { backgroundColor: palette.surfaceContainerLowest + "BF" },
              ]}
            />

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
              <Text style={[styles.profileName, { color: palette.onSurface }]}>
                {displayName}
              </Text>
              <View style={styles.profileMetaRow}>
                <SubscriptionBadge size="sm" />
                <Text style={[styles.profileMeta, { color: palette.outline }]}>
                  {memberLabel}
                </Text>
              </View>
            </View>

            <Pressable onPress={() => router.replace("/(app)/account")}>
              <Text style={[styles.editProfileText, { color: palette.primary }]}>
                Edit Profile
              </Text>
            </Pressable>
          </View>

          <View style={styles.navList}>
            {menuItems.map((item) => {
              const Icon = item.icon;

              return (
                <View
                  key={item.label}
                  style={[
                    styles.menuCard,
                    { borderColor: palette.outlineVariant + "24" },
                  ]}
                >
                  <BlurView
                    intensity={78}
                    tint={tint}
                    style={[
                      StyleSheet.absoluteFillObject,
                      { backgroundColor: palette.surfaceContainerLowest + "BA" },
                    ]}
                  />

                  <Pressable
                    onPress={() => router.replace(item.path)}
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
                    </View>
                  </Pressable>
                </View>
              );
            })}
          </View>

          <View
            style={[
              styles.signOutCard,
              { borderColor: palette.outlineVariant + "24" },
            ]}
          >
            <BlurView
              intensity={78}
              tint={tint}
              style={[
                StyleSheet.absoluteFillObject,
                { backgroundColor: palette.surfaceContainerLowest + "BA" },
              ]}
            />

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
          </View>
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
  shadow: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.1,
    shadowRadius: 18,
    elevation: 8,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 14,
  },
  headerPill: {
    overflow: "hidden",
    borderRadius: 999,
    borderWidth: 2,
    paddingHorizontal: 24,
    paddingVertical: 11,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    fontFamily: "Newsreader_500Medium_Italic",
    fontSize: 25,
  },
  closePill: {
    overflow: "hidden",
    borderRadius: 999,
    borderWidth: 2,
    padding: 4,
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 10,
    paddingBottom: 42,
  },
  profileCard: {
    overflow: "hidden",
    borderRadius: 38,
    borderWidth: 1,
    padding: 22,
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    marginBottom: 28,
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
  editProfileText: {
    fontFamily: "Manrope_600SemiBold",
    fontSize: 14,
  },
  navList: {
    gap: 10,
  },
  menuCard: {
    overflow: "hidden",
    borderRadius: 30,
    borderWidth: 1,
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
    overflow: "hidden",
    borderRadius: 30,
    borderWidth: 1,
    marginTop: 28,
  },
});
