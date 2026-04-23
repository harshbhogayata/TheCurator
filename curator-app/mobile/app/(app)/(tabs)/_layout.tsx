import { Tabs } from "expo-router";
import { View, Text, Pressable, Platform, StyleSheet } from "react-native";
import { BlurView } from "expo-blur";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Sparkles, Compass, Bookmark, Search } from "lucide-react-native";
import * as Haptics from "expo-haptics";
import type { BottomTabBarProps } from "@react-navigation/bottom-tabs";
import { useTheme } from "../../../src/providers/theme-provider";

const TAB_CONFIG = [
  { name: "index", label: "Brief", Icon: Sparkles, fillable: true },
  { name: "explore", label: "Explore", Icon: Compass, fillable: false },
  { name: "search", label: "Search", Icon: Search, fillable: false },
  { name: "saved", label: "Saved", Icon: Bookmark, fillable: true },
] as const;

function FloatingTabBar({ state, navigation }: BottomTabBarProps) {
  const { palette, resolvedTheme } = useTheme();
  const insets = useSafeAreaInsets();
  const bottomOffset = Math.max(insets.bottom, 16);

  return (
    <View style={[styles.tabBarWrapper, { bottom: bottomOffset }]}>
      <BlurView
        intensity={80}
        tint={resolvedTheme === "dark" ? "dark" : "light"}
        style={[
          styles.tabBarContainer,
          {
            borderColor: palette.outlineVariant + "33",
            backgroundColor: palette.surfaceContainerLowest + "CC",
          },
        ]}
      >
        {TAB_CONFIG.map((tab, index) => {
          const isActive = state.index === index;
          const { Icon } = tab;

          return (
            <Pressable
              key={tab.name}
              accessibilityRole="tab"
              accessibilityState={{ selected: isActive }}
              accessibilityLabel={`${tab.label} tab`}
              onPress={() => {
                if (!isActive) Haptics.selectionAsync();
                const event = navigation.emit({
                  type: "tabPress",
                  target: state.routes[index].key,
                  canPreventDefault: true,
                });
                if (!event.defaultPrevented) {
                  navigation.navigate(state.routes[index].name);
                }
              }}
              style={[
                styles.tabButton,
                isActive && {
                  backgroundColor: palette.primary,
                  borderRadius: 999,
                },
              ]}
            >
              <Icon
                size={20}
                color={isActive ? palette.primaryForeground : palette.onSurfaceVariant}
                fill={
                  isActive && tab.fillable
                    ? palette.primaryForeground
                    : "none"
                }
                strokeWidth={isActive ? 2 : 1.5}
              />
              <Text
                numberOfLines={1}
                style={[
                  styles.tabLabel,
                  {
                    color: isActive ? palette.primaryForeground : palette.onSurfaceVariant,
                  },
                ]}
              >
                {tab.label}
              </Text>
            </Pressable>
          );
        })}
      </BlurView>
    </View>
  );
}

export default function TabsLayout() {
  const { palette } = useTheme();
  return (
    <Tabs
      tabBar={(props) => <FloatingTabBar {...props} />}
      screenOptions={{
        headerShown: false,
        tabBarStyle: { display: "none" },
      }}
    >
      <Tabs.Screen name="index" options={{ title: "Brief" }} />
      <Tabs.Screen name="explore" options={{ title: "Explore" }} />
      <Tabs.Screen name="search" options={{ title: "Search" }} />
      <Tabs.Screen name="saved" options={{ title: "Saved" }} />
      <Tabs.Screen name="settings" options={{ href: null }} />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBarWrapper: {
    position: "absolute",
    left: 16,
    right: 16,
    alignItems: "center",
    zIndex: 50,
  },
  tabBarContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    width: "100%",
    maxWidth: 420,
    height: 64,
    borderRadius: 40,
    borderWidth: 2,
    paddingHorizontal: 12,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 32,
    elevation: 12,
  },
  tabButton: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 8,
    paddingHorizontal: 12,
    gap: 2,
  },
  tabLabel: {
    fontSize: 11,
    fontFamily: "Manrope_500Medium",
    letterSpacing: 0.1,
  },
});
