import { Image, type ImageStyle } from "expo-image";
import { StyleSheet, Text, View, type StyleProp, type ViewStyle } from "react-native";

import { userInitial } from "../lib/user-display-name";
import { useTheme } from "../providers/theme-provider";

interface ProfileAvatarProps {
  avatarUrl?: string | null;
  displayName?: string | null;
  email?: string | null;
  size?: number;
  imageStyle?: StyleProp<ImageStyle>;
  style?: StyleProp<ViewStyle>;
}

export function ProfileAvatar({
  avatarUrl,
  displayName,
  email,
  size = 40,
  imageStyle,
  style,
}: ProfileAvatarProps) {
  const { palette } = useTheme();
  const radius = size / 2;
  const initial = userInitial({ displayName, email });

  if (avatarUrl) {
    return (
      <Image
        source={{ uri: avatarUrl }}
        style={[
          {
            width: size,
            height: size,
            borderRadius: radius,
            borderWidth: size >= 64 ? 3 : -1,
            borderColor: palette.outlineVariant + "40",
          },
          imageStyle,
        ]}
        contentFit="cover"
      />
    );
  }

  return (
    <View
      style={[
        styles.fallback,
        {
          width: size,
          height: size,
          borderRadius: radius,
          backgroundColor: palette.primaryContainer,
          borderColor: palette.outlineVariant + "40",
          borderWidth: size >= 64 ? 3 : 0,
        },
        style,
      ]}
    >
      <Text
        style={{
          fontFamily: "Manrope_700Bold",
          fontSize: Math.round(size * 0.38),
          color: palette.onPrimaryContainer,
        }}
      >
        {initial}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  fallback: {
    alignItems: "center",
    justifyContent: "center",
  },
});
