import { useCallback, useState } from "react";
import { Pressable, RefreshControl, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { BookOpen, Clock, Bookmark, Target } from "lucide-react-native";
import { LinearGradient } from "expo-linear-gradient";

import { useTheme } from "../../src/providers/theme-provider";
import { useReadingStats } from "../../src/providers/reading-stats-provider";
import { useSavedArticles } from "../../src/providers/saved-articles-provider";
import { PillPageHeader } from "../../src/ui/pill-page-header";
import { ErrorState } from "../../src/ui/error-state";
import { type } from "../../src/ui/tokens/typography";

function formatTime(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const mins = Math.floor((totalSeconds % 3600) / 60);
  if (hours > 0) return `${hours}h ${mins}m`;
  return `${mins}m`;
}

export default function ReadingStatsScreen() {
  const { palette } = useTheme();
  const { stats, averageReadTimeMs, thisWeekArticles, statsLoadError, refreshReadingStats } = useReadingStats();
  const { savedCount } = useSavedArticles();
  const [timeframe, setTimeframe] = useState<"week" | "month">("week");
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    void refreshReadingStats().finally(() => setRefreshing(false));
  }, [refreshReadingStats]);

  // Generate bar data
  const dayLabels = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const history = stats.dailyHistory || [];

  // Get the last 7 or 30 days of data
  const barCount = timeframe === "week" ? 7 : 30;
  const barData: { label: string; value: number }[] = [];
  for (let i = barCount - 1; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().slice(0, 10);
    const record = history.find((h) => h.date === dateStr);
    const label =
      timeframe === "week"
        ? dayLabels[date.getDay() === 0 ? 6 : date.getDay() - 1]
        : `${date.getMonth() + 1}/${date.getDate()}`;
    barData.push({ label, value: record?.articlesRead || 0 });
  }

  const maxVal = Math.max(...barData.map((d) => d.value), 1);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: palette.background }}>
      <PillPageHeader title="Reading Stats" />

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={palette.primary}
          />
        }
      >
        {statsLoadError ? (
          <ErrorState
            title="Reading stats could not load"
            message="Pull to refresh or try again when your connection is stable."
            onRetry={onRefresh}
          />
        ) : (
          <>
        {/* Streak Card */}
        <LinearGradient
          colors={[palette.primary, palette.secondary, palette.tertiary]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{
            borderRadius: 28,
            padding: 24,
            marginBottom: 20,
            overflow: "hidden",
          }}
        >
          <View style={{ flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 16 }}>
            <View
              style={{
                width: 44,
                height: 44,
                borderRadius: 22,
                backgroundColor: "rgba(255,255,255,0.2)",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Text style={{ fontSize: 22 }}>🔥</Text>
            </View>
            <View>
              <Text style={[type.labelSm, { fontFamily: "Manrope_400Regular", fontSize: 13, color: "rgba(255,255,255,0.8)" }]}>
                Current Streak
              </Text>
              <Text
                style={{
                  fontFamily: "Manrope_700Bold",
                  fontSize: 28,
                  color: "#ffffff",
                }}
              >
                {stats.currentStreak} days
              </Text>
            </View>
          </View>

          <View
            style={{
              borderTopWidth: 1,
              borderTopColor: "rgba(255,255,255,0.2)",
              paddingTop: 14,
              flexDirection: "row",
              justifyContent: "space-between",
            }}
          >
            <View>
              <Text style={[type.caption, { fontFamily: "Manrope_400Regular", color: "rgba(255,255,255,0.7)" }]}>
                Longest Streak
              </Text>
              <Text style={[type.label, { fontSize: 18, color: "#ffffff" }]}>
                {stats.longestStreak} days
              </Text>
            </View>
            <View style={{ alignItems: "flex-end" }}>
              <Text style={[type.caption, { fontFamily: "Manrope_400Regular", color: "rgba(255,255,255,0.7)" }]}>
                This Week
              </Text>
              <Text style={[type.label, { fontSize: 18, color: "#ffffff" }]}>
                {thisWeekArticles} articles
              </Text>
            </View>
          </View>
        </LinearGradient>

        {/* Stats Grid */}
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 12, marginBottom: 20 }}>
          {[
            { Icon: BookOpen, label: "Total Articles", value: `${stats.totalArticlesRead}`, bg: palette.primary + "1A" },
            { Icon: Clock, label: "Reading Time", value: formatTime(stats.totalReadTimeMs), bg: palette.secondary + "1A" },
            { Icon: Bookmark, label: "Saved", value: `${savedCount}`, bg: palette.tertiary + "1A" },
            { Icon: Target, label: "Avg per Article", value: formatTime(averageReadTimeMs), bg: palette.primary + "1A" },
          ].map((item) => {
            const Icon = item.Icon;
            return (
              <View
                key={item.label}
                style={{
                  width: "48%",
                  backgroundColor: palette.surfaceContainerLowest,
                  borderRadius: 24,
                  borderWidth: 1,
                  borderColor: palette.outlineVariant + "26",
                  padding: 18,
                }}
              >
                <View
                  style={{
                    width: 38,
                    height: 38,
                    borderRadius: 10,
                    backgroundColor: item.bg,
                    alignItems: "center",
                    justifyContent: "center",
                    marginBottom: 10,
                  }}
                >
                  <Icon size={18} color={palette.primary} />
                </View>
                <Text style={[type.labelSm, { fontFamily: "Manrope_400Regular", color: palette.onSurfaceVariant, marginBottom: 4 }]}>
                  {item.label}
                </Text>
                <Text
                  style={{
                    fontFamily: "Manrope_700Bold",
                    fontSize: 22,
                    color: palette.onSurface,
                  }}
                >
                  {item.value}
                </Text>
              </View>
            );
          })}
        </View>

        {/* Activity Chart */}
        <View
          style={{
            backgroundColor: palette.surfaceContainerLowest,
            borderRadius: 24,
            borderWidth: 1,
            borderColor: palette.outlineVariant + "26",
            padding: 20,
          }}
        >
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 20,
            }}
          >
            <Text
              style={{
                ...type.title,
                fontFamily: "Newsreader_700Bold",
                color: palette.onSurface,
              }}
            >
              Activity
            </Text>
            <View style={{ flexDirection: "row", gap: 6 }}>
              {(["week", "month"] as const).map((tf) => (
                <Pressable
                  key={tf}
                  onPress={() => setTimeframe(tf)}
                  style={{
                    backgroundColor: timeframe === tf ? palette.primary : palette.surfaceContainer,
                    borderRadius: 999,
                    paddingHorizontal: 14,
                    paddingVertical: 6,
                  }}
                >
                  <Text style={[type.labelSm, { fontSize: 13, textTransform: "capitalize", color: timeframe === tf ? palette.primaryForeground : palette.onSurface }]}>
                    {tf}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>

          {/* Bar Chart */}
          {timeframe === "week" ? (
            <View style={{ flexDirection: "row", alignItems: "flex-end", gap: 8, height: 140 }}>
              {barData.map((item, index) => (
                <View key={index} style={{ flex: 1, alignItems: "center" }}>
                  <View
                    style={{
                      width: "80%",
                      height: maxVal > 0 ? Math.max((item.value / maxVal) * 120, 4) : 4,
                      backgroundColor: item.value > 0 ? palette.primary : palette.surfaceContainer,
                      borderRadius: 6,
                      marginBottom: 6,
                    }}
                  />
                  <Text
                    style={{
                      ...type.caption,
                      fontFamily: "Manrope_400Regular",
                      color: palette.onSurfaceVariant,
                    }}
                  >
                    {item.label}
                  </Text>
                </View>
              ))}
            </View>
          ) : (
            <View style={{ gap: 4 }}>
              {barData
                .filter((_, i) => i % 5 === 0 || i === barData.length - 1)
                .map((item, index) => (
                  <View key={index} style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                    <Text
                      style={{
                        ...type.caption,
                        fontFamily: "Manrope_400Regular",
                        color: palette.onSurfaceVariant,
                        width: 32,
                      }}
                    >
                      {item.label}
                    </Text>
                    <View
                      style={{
                        flex: 1,
                        height: 20,
                        backgroundColor: palette.surfaceContainer,
                        borderRadius: 10,
                        overflow: "hidden",
                      }}
                    >
                      <View
                        style={{
                          width: maxVal > 0 ? `${(item.value / maxVal) * 100}%` : "0%",
                          height: "100%",
                          backgroundColor: palette.primary,
                          borderRadius: 10,
                        }}
                      />
                    </View>
                    {item.value > 0 && (
                      <Text
                        style={{
                          ...type.caption,
                          color: palette.onSurface,
                          width: 20,
                        }}
                      >
                        {item.value}
                      </Text>
                    )}
                  </View>
                ))}
            </View>
          )}
        </View>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
