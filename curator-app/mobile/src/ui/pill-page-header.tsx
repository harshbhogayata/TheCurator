import React, { memo } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ArrowLeft, X } from "lucide-react-native";
import { useRouter } from "expo-router";

import { useTheme } from "../providers/theme-provider";
import { useAuth } from "../providers/auth-provider";
import { FrostedPill } from "./frosted-pill";
import { ProfileAvatar } from "./profile-avatar";
import { SubscriptionBadge } from "./subscription-badge";

interface PillPageHeaderProps {
  title: string;
  /** Back arrow (default) or close X for modal sheets. */
  leadingAction?: "back" | "close";
  onLeadingPress?: () => void;
  /** Profile avatar on the right — mirrors tab Header on Profile screen. */
  showProfile?: boolean;
  showBadge?: boolean;
  profileInteractive?: boolean;
  onProfilePress?: () => void;
}

function PillPageHeaderInner({
  title,
  leadingAction = "back",
  onLeadingPress,
  showProfile = false,
  showBadge = true,
  profileInteractive = true,
  onProfilePress,
}: PillPageHeaderProps) {
  const { palette } = useTheme();
  const { session } = useAuth();
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const LeadingIcon = leadingAction === "close" ? X : ArrowLeft;
  const borderColor = palette.outlineVariant + "4D";

  const handleLeadingPress = onLeadingPress ?? (() => router.back());
  const handleProfilePress = onProfilePress ?? (() => router.push("/(app)/account"));

  return (
    <View
      style={[
        styles.container,
        {
          top: insets.top + 16,
        },
      ]}
    >
      <View style={styles.shadow}>
        <Pressable
          onPress={handleLeadingPress}
          accessibilityRole="button"
          accessibilityLabel={leadingAction === "close" ? "Close" : "Go back"}
        >
          <FrostedPill
            borderColor={borderColor}
            style={{
              padding: leadingAction === "close" ? 4 : 2,
            }}
          >
            <View
              style={
                leadingAction === "close" ? styles.closeButton : styles.backButton
              }
            >
              <LeadingIcon
                size={20}
                color={palette.onSurface}
                strokeWidth={leadingAction === "close" ? 2.5 : 2.3}
              />
            </View>
          </FrostedPill>
        </Pressable>
      </View>

      <View style={[styles.shadow, styles.titleFlex]}>
        <FrostedPill borderColor={borderColor} style={styles.titlePill}>
          <Text
            numberOfLines={1}
            adjustsFontSizeToFit
            minimumFontScale={0.82}
            style={[styles.titleText, { color: palette.onSurface }]}
          >
            {title}
          </Text>
        </FrostedPill>
      </View>

      {showProfile ? (
        <View style={styles.shadow}>
          {profileInteractive ? (
            <Pressable onPress={handleProfilePress}>
              <FrostedPill borderColor={borderColor} style={styles.profilePill}>
                {showBadge ? <SubscriptionBadge size="sm" /> : null}
                <ProfileAvatar
                  avatarUrl={session?.user?.avatarUrl}
                  displayName={session?.user?.displayName}
                  email={session?.user?.email}
                  size={30}
                  imageStyle={{ borderWidth: 1, borderColor: palette.outlineVariant + "26" }}
                />
              </FrostedPill>
            </Pressable>
          ) : (
            <FrostedPill borderColor={borderColor} style={styles.profilePill}>
              <ProfileAvatar
                avatarUrl={session?.user?.avatarUrl}
                displayName={session?.user?.displayName}
                email={session?.user?.email}
                size={30}
                imageStyle={{ borderWidth: 1, borderColor: palette.outlineVariant + "26" }}
              />
            </FrostedPill>
          )}
        </View>
      ) : (
        <View style={styles.sideSpacer} />
      )}
    </View>
  );
}

export const PillPageHeader = memo(PillPageHeaderInner);

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    left: 0,
    right: 0,
    paddingHorizontal: 16,
    zIndex: 50,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  sideSpacer: {
    width: 40,
    height: 40,
  },
  shadow: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 8,
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  titleFlex: {
    flex: 1,
    minWidth: 0,
  },
  titlePill: {
    minWidth: 0,
    minHeight: 52,
    paddingHorizontal: 14,
    paddingVertical: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  titleText: {
    fontFamily: "Newsreader_500Medium_Italic",
    fontSize: 19,
    lineHeight: 24,
    textAlign: "center",
    includeFontPadding: false,
  },
  profilePill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
});
