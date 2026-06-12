import { useEffect, useMemo, useState } from "react";
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import {
  Bell,
  BookMarked,
  ChevronRight,
  Globe,
  Heart,
  Link2,
  LogOut,
  Monitor,
  Moon,
  Sparkles,
  Sun,
  User,
  Zap,
} from "lucide-react-native";

import {
  categoryOptions,
  defaultPreferences,
  type NotificationFrequency,
  type TextSize,
  type ThemePreference,
  type UserPreferences,
} from "../../src/lib/types";
import { useTheme } from "../../src/providers/theme-provider";
import { useSubscription } from "../../src/providers/subscription-provider";
import { useAuth } from "../../src/providers/auth-provider";
import { useToast } from "../../src/providers/toast-provider";
import { useTextSizePreference } from "../../src/hooks/use-text-size-preference";
import { updatePreferences as updatePreferencesRemote } from "../../src/services/mobile-api";
import { SubscriptionBadge } from "../../src/ui/subscription-badge";
import { PillPageHeader } from "../../src/ui/pill-page-header";
import { type } from "../../src/ui/tokens/typography";

const themeOptions: Array<{
  value: ThemePreference;
  label: string;
  Icon: typeof Sun;
}> = [
  { value: "light", label: "Light", Icon: Sun },
  { value: "dark", label: "Dark", Icon: Moon },
  { value: "system", label: "Auto", Icon: Monitor },
];

const notificationOptions: Array<{
  value: NotificationFrequency;
  label: string;
}> = [
  { value: "daily", label: "Daily Brief" },
  { value: "breaking", label: "Breaking" },
  { value: "weekly", label: "Weekly Digest" },
  { value: "none", label: "Quiet Mode" },
];

const textSizeOptions: Array<{
  value: TextSize;
  label: string;
}> = [
  { value: "compact", label: "Compact" },
  { value: "comfortable", label: "Comfortable" },
  { value: "large", label: "Large" },
];

function SectionHeading({ label }: { label: string }) {
  const { palette } = useTheme();

  return (
    <Text style={[styles.sectionHeading, { color: palette.onSurface }]}>
      {label}
    </Text>
  );
}

function ChoiceChip({
  label,
  selected,
  onPress,
  width = "48%",
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
  width?: `${number}%`;
}) {
  const { palette } = useTheme();

  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.choiceChip,
        {
          width,
          backgroundColor: selected ? palette.inverseSurface : palette.surfaceContainerLowest,
          borderColor: selected ? palette.inverseSurface : palette.outlineVariant + "26",
        },
      ]}
    >
      <Text
        numberOfLines={1}
        adjustsFontSizeToFit
        minimumFontScale={0.85}
        style={[
          styles.choiceChipText,
          { color: selected ? palette.inversePrimary : palette.onSurface },
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

function MiniToggle({ value }: { value: boolean }) {
  const { palette } = useTheme();

  return (
    <View
      style={[
        styles.toggleTrack,
        { backgroundColor: value ? palette.primary : palette.surfaceContainerHigh },
      ]}
    >
      <View
        style={[
          styles.toggleThumb,
          {
            left: value ? 28 : 4,
            backgroundColor: "#FFFFFF",
          },
        ]}
      />
    </View>
  );
}

function ActionRow({
  Icon,
  title,
  description,
  onPress,
}: {
  Icon: typeof User;
  title: string;
  description: string;
  onPress: () => void;
}) {
  const { palette } = useTheme();

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.rowShell,
        {
          backgroundColor: pressed ? palette.surfaceContainerLow : palette.surfaceContainerLowest,
          borderColor: palette.outlineVariant + "26",
        },
      ]}
    >
      <View style={styles.rowContent}>
        <View
          style={[
            styles.rowIcon,
            { backgroundColor: palette.surfaceContainer },
          ]}
        >
          <Icon size={20} color={palette.primary} strokeWidth={2.1} />
        </View>

        <View style={styles.rowCopy}>
          <Text numberOfLines={1} style={[styles.rowTitle, { color: palette.onSurface }]}>
            {title}
          </Text>
          <Text numberOfLines={2} style={[styles.rowDescription, { color: palette.onSurfaceVariant }]}>
            {description}
          </Text>
        </View>

        <ChevronRight size={18} color={palette.outlineVariant} />
      </View>
    </Pressable>
  );
}

function ToggleRow({
  Icon,
  title,
  description,
  value,
  onPress,
}: {
  Icon: typeof Bell;
  title: string;
  description: string;
  value: boolean;
  onPress: () => void;
}) {
  const { palette } = useTheme();

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.rowShell,
        {
          backgroundColor: pressed ? palette.surfaceContainerLow : palette.surfaceContainerLowest,
          borderColor: palette.outlineVariant + "26",
        },
      ]}
    >
      <View style={styles.rowContent}>
        <View
          style={[
            styles.rowIcon,
            { backgroundColor: palette.surfaceContainer },
          ]}
        >
          <Icon size={20} color={palette.primary} strokeWidth={2.1} />
        </View>

        <View style={styles.rowCopy}>
          <Text numberOfLines={1} style={[styles.rowTitle, { color: palette.onSurface }]}>
            {title}
          </Text>
          <Text numberOfLines={2} style={[styles.rowDescription, { color: palette.onSurfaceVariant }]}>
            {description}
          </Text>
        </View>

        <MiniToggle value={value} />
      </View>
    </Pressable>
  );
}

export default function SettingsScreen() {
  const { palette, preference, setPreference } = useTheme();
  const { selectTextSize } = useTextSizePreference();
  const { tier } = useSubscription();
  const {
    session,
    status,
    signOut,
    updateOnboardingCategories,
    updateOnboardingPreferences,
    updateSessionPreferences,
  } = useAuth();
  const { showToast } = useToast();
  const router = useRouter();
  const sessionCategories = session?.onboarding.selectedCategories ?? [];

  const [preferences, setPreferences] = useState<UserPreferences>(
    session?.preferences ?? defaultPreferences,
  );
  const [selectedCategories, setSelectedCategories] = useState<string[]>(sessionCategories);
  const handleSignOut = () => {
    Alert.alert("Sign Out?", "Are you sure you want to sign out?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Sign Out",
        style: "destructive",
        onPress: () => void signOut().catch(() => showToast("error", "Couldn't sign out right now.")),
      },
    ]);
  };

  useEffect(() => {
    if (!session) {
      return;
    }

    setPreferences(session.preferences);
    setSelectedCategories(session.onboarding.selectedCategories);
  }, [session]);

  const tierCopy = useMemo(() => {
    if (tier === "lifetime") {
      return {
        title: "Lifetime Member",
        description: "You already have the full Curator experience.",
        action: "Manage Membership",
      };
    }

    if (tier === "premium") {
      return {
        title: "Premium Member",
        description: "All premium reading features are active right now.",
        action: "Manage Subscription",
      };
    }

    if (tier === "basic") {
      return {
        title: "Basic Member",
        description: "Upgrade anytime for unlimited saves and deeper access.",
        action: "Manage Subscription",
      };
    }

    return {
      title: "Free Reader",
      description: "Support independent journalism and unlock more features.",
      action: "Support The Curator",
    };
  }, [tier]);

  const applyPreferenceUpdate = (updater: (current: UserPreferences) => UserPreferences) => {
    const previous = preferences;
    const previousTheme = preference;
    const next = updater(preferences);

    setPreferences(next);

    if (next.themePreference !== preference) {
      setPreference(next.themePreference);
    }

    updateSessionPreferences(next);

    void updatePreferencesRemote(next)
      .then((payload) => {
        updateSessionPreferences({ ...next, ...payload });
      })
      .catch(() => {
        void updateOnboardingPreferences(next)
          .catch(() => {
            setPreferences(previous);
            updateSessionPreferences(previous);
            if (previous.themePreference !== next.themePreference) {
              setPreference(previous.themePreference);
            }
            showToast("error", "Couldn't update your settings right now.");
          });
      });
  };

  const handleCategoryToggle = (key: string) => {
    const isSelected = selectedCategories.includes(key);

    if (isSelected && selectedCategories.length <= 3) {
      showToast("info", "Keep at least 3 interests selected.");
      return;
    }

    const previous = selectedCategories;
    const next = isSelected
      ? selectedCategories.filter((item) => item !== key)
      : [...selectedCategories, key];

    setSelectedCategories(next);
    void updateOnboardingCategories({ categories: next }).catch(() => {
      setSelectedCategories(previous);
      showToast("error", "Couldn't update your interests right now.");
    });
  };

  if (status === "loading" && !session) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: palette.background }}>
        <PillPageHeader title="Settings" />
        <View style={{ flex: 1, paddingHorizontal: 20, gap: 16, paddingTop: 16 }}>
          {[120, 72, 72, 72].map((h, i) => (
            <View key={i} style={{ height: h, borderRadius: 30, backgroundColor: palette.surfaceContainerLow }} />
          ))}
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: palette.background }}>
      <PillPageHeader title="Settings" />

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View
          style={[
            styles.membershipCard,
            {
              backgroundColor: palette.primaryContainer + "80",
              borderColor: palette.outlineVariant + "26",
            },
          ]}
        >
          <View style={styles.membershipHeader}>
            <View
              style={[
                styles.membershipIcon,
                { backgroundColor: palette.primary },
              ]}
            >
              <Sparkles size={22} color={palette.primaryForeground} />
            </View>

            <View style={styles.membershipCopy}>
              <Text style={[styles.membershipTitle, { color: palette.onPrimaryContainer }]}>
                {tierCopy.title}
              </Text>
              <Text style={[styles.membershipDescription, { color: palette.onSurfaceVariant }]}>
                {tierCopy.description}
              </Text>
            </View>

            <SubscriptionBadge size="md" />
          </View>

          <Pressable
            onPress={() => router.push("/(app)/donate")}
            style={({ pressed }) => [
              styles.membershipButton,
              {
                backgroundColor: pressed ? palette.primaryDim : palette.inverseSurface,
              },
            ]}
          >
            <View style={styles.membershipButtonContent}>
              <Text
                numberOfLines={1}
                style={[styles.membershipButtonText, { color: palette.inversePrimary }]}
              >
                {tierCopy.action}
              </Text>
              <ChevronRight size={18} color={palette.inversePrimary} />
            </View>
          </Pressable>
        </View>

        <SectionHeading label="Account" />
        <View style={styles.sectionStack}>
          <ActionRow
            Icon={User}
            title="Profile & Account"
            description="Update your display name and account information."
            onPress={() => router.push("/(app)/account")}
          />
          <ActionRow
            Icon={Link2}
            title="Connected Accounts"
            description="Manage linked sign-in methods and account recovery access."
            onPress={() => router.push("/(app)/connected-accounts")}
          />
          <ActionRow
            Icon={Heart}
            title="Support The Curator"
            description="Choose a membership plan and keep the product independent."
            onPress={() => router.push("/(app)/donate")}
          />
        </View>

        <SectionHeading label="Alerts & Delivery" />
        <View
          style={[
            styles.preferenceBlock,
            {
              backgroundColor: palette.surfaceContainerLowest,
              borderColor: palette.outlineVariant + "26",
            },
          ]}
        >
          <Text style={[styles.blockTitle, { color: palette.onSurface }]}>
            Notification Cadence
          </Text>
          <Text style={[styles.blockDescription, { color: palette.onSurfaceVariant }]}>
            Keep this aligned with the choices you made in onboarding.
          </Text>
          <View style={styles.choiceWrap}>
            {notificationOptions.map((option) => (
              <ChoiceChip
                key={option.value}
                label={option.label}
                selected={preferences.notificationFrequency === option.value}
                onPress={() =>
                  applyPreferenceUpdate((current) => ({
                    ...current,
                    notificationFrequency: option.value,
                  }))
                }
              />
            ))}
          </View>
        </View>
        <View style={styles.sectionStack}>
          <ToggleRow
            Icon={Bell}
            title="Push Notifications"
            description="Store your push preference now and keep the daily brief ready."
            value={preferences.pushEnabled}
            onPress={() =>
              applyPreferenceUpdate((current) => ({
                ...current,
                pushEnabled: !current.pushEnabled,
              }))
            }
          />
          <ToggleRow
            Icon={BookMarked}
            title="Email Digest"
            description="Receive a written backup of your preferred briefing cadence."
            value={preferences.emailDigestEnabled}
            onPress={() =>
              applyPreferenceUpdate((current) => ({
                ...current,
                emailDigestEnabled: !current.emailDigestEnabled,
              }))
            }
          />
        </View>

        <SectionHeading label="Reading & Experience" />
        <View
          style={[
            styles.preferenceBlock,
            {
              backgroundColor: palette.surfaceContainerLowest,
              borderColor: palette.outlineVariant + "26",
            },
          ]}
        >
          <Text style={[styles.blockTitle, { color: palette.onSurface }]}>
            Text Size
          </Text>
          <View style={styles.choiceWrap}>
            {textSizeOptions.map((option) => (
              <ChoiceChip
                key={option.value}
                label={option.label}
                width="31%"
                selected={preferences.textSize === option.value}
                onPress={() => {
                  selectTextSize(option.value);
                  setPreferences((current) => ({
                    ...current,
                    textSize: option.value,
                  }));
                }}
              />
            ))}
          </View>
        </View>
        <View style={styles.sectionStack}>
          <ToggleRow
            Icon={Zap}
            title="Auto-save Articles"
            description="Keep article state resilient across sessions."
            value={preferences.autoSaveEnabled}
            onPress={() =>
              applyPreferenceUpdate((current) => ({
                ...current,
                autoSaveEnabled: !current.autoSaveEnabled,
              }))
            }
          />
          <ToggleRow
            Icon={Moon}
            title="Reduce Motion"
            description="Tone down animations for a calmer reading experience."
            value={preferences.reduceMotionEnabled}
            onPress={() =>
              applyPreferenceUpdate((current) => ({
                ...current,
                reduceMotionEnabled: !current.reduceMotionEnabled,
              }))
            }
          />
        </View>
        <View
          style={[
            styles.preferenceBlock,
            {
              backgroundColor: palette.surfaceContainerLowest,
              borderColor: palette.outlineVariant + "26",
            },
          ]}
        >
          <Text style={[styles.blockTitle, { color: palette.onSurface }]}>
            Topics & Interests
          </Text>
          <Text style={[styles.blockDescription, { color: palette.onSurfaceVariant }]}>
            These are the categories selected during onboarding. Keep at least three active.
          </Text>
          <View style={styles.choiceWrap}>
            {categoryOptions.map((category) => (
              <ChoiceChip
                key={category.key}
                label={category.label}
                selected={selectedCategories.includes(category.key)}
                onPress={() => handleCategoryToggle(category.key)}
              />
            ))}
          </View>
        </View>

        <SectionHeading label="Appearance" />
        <View
          style={[
            styles.preferenceBlock,
            {
              backgroundColor: palette.surfaceContainerLowest,
              borderColor: palette.outlineVariant + "26",
            },
          ]}
        >
          <Text style={[styles.blockTitle, { color: palette.onSurface }]}>
            Theme
          </Text>
          <View style={styles.choiceWrap}>
            {themeOptions.map(({ value, label, Icon }) => (
              <Pressable
                key={value}
                onPress={() =>
                  applyPreferenceUpdate((current) => ({
                    ...current,
                    themePreference: value,
                  }))
                }
                style={[
                  styles.themeChip,
                  {
                    width: "31%",
                    backgroundColor:
                      preferences.themePreference === value
                        ? palette.inverseSurface
                        : palette.surfaceContainerLowest,
                    borderColor:
                      preferences.themePreference === value
                        ? palette.inverseSurface
                        : palette.outlineVariant + "26",
                  },
                ]}
              >
                <Icon
                  size={18}
                  color={
                    preferences.themePreference === value
                      ? palette.inversePrimary
                      : palette.onSurface
                  }
                />
                <Text
                  numberOfLines={1}
                  style={[
                    styles.themeChipText,
                    {
                      color:
                        preferences.themePreference === value
                          ? palette.inversePrimary
                          : palette.onSurface,
                    },
                  ]}
                >
                  {label}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>
        <View style={styles.sectionStack}>
          <ActionRow
            Icon={Globe}
            title="Language & Region"
            description="Adjust spelling conventions, date formatting, and regional defaults."
            onPress={() => router.push("/(app)/language-region")}
          />
        </View>

        <View
          style={[
            styles.rowShell,
            { backgroundColor: palette.error, borderColor: palette.error, marginTop: 12 },
          ]}
        >
          <Pressable
            onPress={handleSignOut}
            style={({ pressed }) => ({
              borderRadius: 30,
              overflow: "hidden",
              backgroundColor: pressed ? "rgba(0,0,0,0.15)" : "transparent",
            })}
          >
            <View style={styles.rowContent}>
              <View style={[styles.rowIcon, { backgroundColor: "#ffffff25" }]}>
                <LogOut size={20} color={palette.onError} strokeWidth={2.1} />
              </View>
              <View style={styles.rowCopy}>
                <Text numberOfLines={1} style={[styles.rowTitle, { color: palette.onError }]}>
                  Sign Out
                </Text>
              </View>
            </View>
          </Pressable>
        </View>
      </ScrollView>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: 20,
    paddingBottom: 40,
    gap: 16,
  },
  membershipCard: {
    borderRadius: 30,
    borderWidth: 1,
    padding: 20,
    gap: 16,
  },
  membershipHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },
  membershipIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  membershipCopy: {
    flex: 1,
    minWidth: 0,
    gap: 4,
  },
  membershipTitle: {
    ...type.headlineSm,
  },
  membershipDescription: {
    ...type.labelSm,
    fontFamily: "Manrope_400Regular",
    lineHeight: 19,
  },
  membershipButton: {
    width: "100%",
    minHeight: 58,
    borderRadius: 999,
    justifyContent: "center",
    paddingHorizontal: 18,
  },
  membershipButtonContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  membershipButtonText: {
    ...type.label,
  },
  sectionHeading: {
    ...type.headlineSm,
    paddingHorizontal: 4,
    marginTop: 6,
  },
  sectionStack: {
    gap: 12,
  },
  preferenceBlock: {
    borderRadius: 30,
    borderWidth: 1,
    padding: 18,
    gap: 12,
  },
  blockTitle: {
    ...type.label,
  },
  blockDescription: {
    ...type.labelSm,
    fontFamily: "Manrope_400Regular",
    lineHeight: 19,
  },
  choiceWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    rowGap: 10,
  },
  choiceChip: {
    minHeight: 48,
    borderRadius: 18,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 10,
  },
  choiceChipText: {
    ...type.labelSm,
    fontFamily: "Manrope_600SemiBold",
    textAlign: "center",
  },
  themeChip: {
    minHeight: 66,
    borderRadius: 20,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingHorizontal: 10,
  },
  themeChipText: {
    ...type.labelSm,
    fontFamily: "Manrope_600SemiBold",
  },
  rowShell: {
    borderRadius: 30,
    borderWidth: 1,
    overflow: "hidden",
  },
  rowContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    minHeight: 78,
    paddingHorizontal: 16,
    paddingVertical: 15,
  },
  rowIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  rowCopy: {
    flex: 1,
    minWidth: 0,
    gap: 3,
  },
  rowTitle: {
    ...type.label,
    fontFamily: "Manrope_500Medium",
  },
  rowDescription: {
    ...type.caption,
    lineHeight: 18,
  },
  toggleTrack: {
    width: 56,
    height: 32,
    borderRadius: 16,
    justifyContent: "center",
    position: "relative",
  },
  toggleThumb: {
    position: "absolute",
    top: 4,
    width: 24,
    height: 24,
    borderRadius: 12,
  },
});
