import NetInfo from "@react-native-community/netinfo";
import { useEffect, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useTheme } from "../providers/theme-provider";
import { UI_MAX_FONT_SIZE_MULTIPLIER } from "./tokens/accessibility";
import { type } from "./tokens/typography";

export function OfflineBanner() {
  const { palette } = useTheme();
  const insets = useSafeAreaInsets();
  const [offline, setOffline] = useState(false);

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state) => {
      setOffline(state.isConnected === false);
    });

    void NetInfo.fetch().then((state) => {
      setOffline(state.isConnected === false);
    });

    return unsubscribe;
  }, []);

  if (!offline) {
    return null;
  }

  return (
    <View
      accessibilityRole="alert"
      accessibilityLiveRegion="polite"
      pointerEvents="none"
      style={[
        styles.banner,
        {
          top: insets.top,
          backgroundColor: palette.errorContainer,
          borderColor: palette.error + "44",
        },
      ]}
    >
      <Text
        style={[type.labelSm, { color: palette.onErrorContainer, textAlign: "center" }]}
        maxFontSizeMultiplier={UI_MAX_FONT_SIZE_MULTIPLIER}
      >
        You're offline. Saved content may still be available.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    position: "absolute",
    left: 16,
    right: 16,
    zIndex: 100,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
  },
});
