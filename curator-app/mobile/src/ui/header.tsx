import React, { memo } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { BlurView } from "expo-blur";
import { Menu } from "lucide-react-native";
import { useRouter } from "expo-router";

import { useTheme } from "../providers/theme-provider";
import { useAuth } from "../providers/auth-provider";
import { SubscriptionBadge } from "./subscription-badge";
import { ProfileAvatar } from "./profile-avatar";

interface HeaderProps {
  title?: string;
  showMenu?: boolean;
  showProfile?: boolean;
  showBadge?: boolean;
  onMenuPress?: () => void;
  onProfilePress?: () => void;
}

function HeaderInner({
  title = "The Curator",
  showMenu = true,
  showProfile = true,
  showBadge = true,
  onMenuPress,
  onProfilePress,
}: HeaderProps) {
  const { palette, resolvedTheme } = useTheme();
  const { session } = useAuth();
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const tint = resolvedTheme === "dark" ? "dark" : "light";

  const handleMenuPress = onMenuPress ?? (() => router.push("/(app)/menu"));
  const handleProfilePress = onProfilePress ?? (() => router.push("/(app)/profile"));

  return (
    <View
      style={[
        styles.container,
        {
          top: insets.top + 16,
        },
      ]}
    >
      {showMenu ? (
        <View style={styles.shadow}>
          <Pressable
            onPress={handleMenuPress}
            style={[
              styles.pill,
              {
                borderColor: palette.outlineVariant + "4D",
                padding: 2,
              },
            ]}
          >
            <BlurView
              pointerEvents="none"
              intensity={60}
              tint={tint}
              style={[
                styles.blurFill,
                { backgroundColor: palette.surfaceContainerLowest + "CC" },
              ]}
            />
            <View style={styles.menuButton}>
              <Menu size={20} color={palette.onSurface} strokeWidth={2.5} />
            </View>
          </Pressable>
        </View>
      ) : (
        <View style={styles.sideSpacer} />
      )}

      <View style={[styles.shadow, styles.titleFlex]}>
        <View
          style={[
            styles.pill,
            styles.titlePill,
            {
              borderColor: palette.outlineVariant + "4D",
            },
          ]}
        >
          <BlurView
            pointerEvents="none"
            intensity={60}
            tint={tint}
            style={[
              styles.blurFill,
              { backgroundColor: palette.surfaceContainerLowest + "CC" },
            ]}
          />
          <Text
            numberOfLines={1}
            adjustsFontSizeToFit
            minimumFontScale={0.82}
            style={[styles.titleText, { color: palette.onSurface }]}
          >
            {title}
          </Text>
        </View>
      </View>

      {showProfile ? (
        <View style={styles.shadow}>
          <Pressable
            onPress={handleProfilePress}
            style={[
              styles.pill,
              styles.rightPill,
              {
                borderColor: palette.outlineVariant + "4D",
              },
            ]}
          >
            <BlurView
              pointerEvents="none"
              intensity={60}
              tint={tint}
              style={[
                styles.blurFill,
                { backgroundColor: palette.surfaceContainerLowest + "CC" },
              ]}
            />
            {showBadge && <SubscriptionBadge size="sm" />}
            <ProfileAvatar
              avatarUrl={session?.user?.avatarUrl}
              displayName={session?.user?.displayName}
              email={session?.user?.email}
              size={30}
              imageStyle={{ borderWidth: 1, borderColor: palette.outlineVariant + "26" }}
            />
          </Pressable>
        </View>
      ) : (
        <View style={styles.sideSpacer} />
      )}
    </View>
  );
}

export const Header = memo(HeaderInner);

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
  pill: {
    borderRadius: 999,
    borderWidth: 2,
    overflow: "hidden",
  },
  blurFill: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 999,
  },
  shadow: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 8,
  },
  menuButton: {
    width: 36,
    height: 36,
    borderRadius: 999,
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
  rightPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
});
