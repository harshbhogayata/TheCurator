import { type PropsWithChildren } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { cn } from "../lib/cn";
import { useLayout } from "../lib/layout";
import { useTheme } from "../providers/theme-provider";
import { TAB_BAR_HEIGHT } from "./tokens/spacing";

interface ScreenProps extends PropsWithChildren {
  className?: string;
  tabBarPadding?: boolean;
}

export function Screen({ children, className, tabBarPadding = true }: ScreenProps) {
  const { palette } = useTheme();
  const { isTablet, contentPadding } = useLayout();

  const bottomPad = tabBarPadding ? TAB_BAR_HEIGHT + 24 : 0;

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: palette.background }]}>
      <View style={StyleSheet.absoluteFill}>
        <View
          style={[
            styles.glow,
            { backgroundColor: palette.secondary, top: -120, right: -70, opacity: 0.08 },
          ]}
        />
        <View
          style={[
            styles.glow,
            { backgroundColor: palette.tertiary, bottom: -130, left: -80, opacity: 0.08 },
          ]}
        />
      </View>

      <KeyboardAvoidingView
        behavior={Platform.select({ ios: "padding", android: undefined })}
        style={styles.safeArea}
      >
        <ScrollView
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={[
            styles.content,
            { paddingHorizontal: contentPadding, paddingBottom: bottomPad + 32 },
            isTablet && styles.tabletContent,
          ]}
          contentContainerClassName={cn("pt-3", className)}
        >
          {children}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  content: {
    flexGrow: 1,
    gap: 20,
  },
  tabletContent: {
    maxWidth: 680,
    alignSelf: "center",
    width: "100%",
  },
  glow: {
    position: "absolute",
    width: 260,
    height: 260,
    borderRadius: 999,
  },
});
