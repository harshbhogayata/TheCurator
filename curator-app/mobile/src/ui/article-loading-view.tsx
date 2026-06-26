import { Pressable, StyleSheet, View } from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ArrowLeft } from "lucide-react-native";

import { useTheme } from "../providers/theme-provider";
import { ReadingProgressBar } from "./reading-progress-bar";
import { ArticleDetailSkeleton } from "./skeleton-loader";

export function ArticleLoadingView() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { palette } = useTheme();

  return (
    <View style={[styles.root, { backgroundColor: palette.background }]}>
      <ReadingProgressBar progress={0} />

      <View style={[styles.header, { top: insets.top + 8 }]}>
        <Pressable
          onPress={() => router.back()}
          accessibilityRole="button"
          accessibilityLabel="Go back"
          style={[styles.headerButton, { backgroundColor: palette.surfaceContainerLowest + "CC" }]}
        >
          <ArrowLeft size={20} color={palette.onSurface} />
        </Pressable>
        <View style={styles.headerRight}>
          {[0, 1, 2, 3].map((slot) => (
            <View
              key={slot}
              style={[styles.headerButton, { backgroundColor: palette.surfaceContainerLowest + "CC", opacity: 0.45 }]}
            />
          ))}
        </View>
      </View>

      <View style={{ paddingTop: insets.top + 64, paddingBottom: insets.bottom + 48 }}>
        <ArticleDetailSkeleton />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  header: {
    position: "absolute",
    left: 16,
    right: 16,
    zIndex: 50,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  headerButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  headerRight: {
    flexDirection: "row",
    gap: 8,
  },
});
