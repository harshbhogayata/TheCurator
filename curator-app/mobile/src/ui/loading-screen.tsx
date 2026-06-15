import { ActivityIndicator, StyleSheet, View } from "react-native";

import { useTheme } from "../providers/theme-provider";
import { BrandSplash } from "./brand-splash";

interface LoadingScreenProps {
  message: string;
}

export function LoadingScreen({ message }: LoadingScreenProps) {
  const { palette } = useTheme();

  return (
    <View style={[styles.root, { backgroundColor: palette.background }]}>
      <BrandSplash
        backgroundColor={palette.background}
        subtitle={message}
        showTagline={false}
        fontsReady
        style={styles.brand}
      />
      <View style={styles.footer}>
        <ActivityIndicator size="small" color={palette.primary} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  brand: {
    flex: 1,
  },
  footer: {
    position: "absolute",
    bottom: 56,
    left: 0,
    right: 0,
    alignItems: "center",
  },
});
