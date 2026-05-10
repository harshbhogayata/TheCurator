import { useEffect, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Download, FileDown } from "lucide-react-native";
import * as Linking from "expo-linking";

import { useTheme } from "../../src/providers/theme-provider";
import { useToast } from "../../src/providers/toast-provider";
import { PillPageHeader } from "../../src/ui/pill-page-header";
import { listPrivacyExports, requestPrivacyExport, type PrivacyExportPayload } from "../../src/services/mobile-api";

export default function DataExportScreen() {
  const { palette } = useTheme();
  const { showToast } = useToast();

  const [exports, setExports] = useState<PrivacyExportPayload[]>([]);
  const [loading, setLoading] = useState(true);
  const [requesting, setRequesting] = useState(false);

  const fetchExports = async () => {
    try {
      const data = await listPrivacyExports();
      setExports(data);
    } catch {
      showToast("error", "Failed to load exports.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchExports();
  }, []);

  const handleRequestExport = async () => {
    setRequesting(true);
    try {
      await requestPrivacyExport();
      showToast("success", "Export requested! Check back soon.");
      await fetchExports();
    } catch {
      showToast("error", "Failed to request export.");
    } finally {
      setRequesting(false);
    }
  };

  const handleDownload = (url: string) => {
    void Linking.openURL(url);
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: palette.background }}>
      <PillPageHeader title="Data Export" />

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <Text style={[styles.description, { color: palette.onSurfaceVariant }]}>
          Request a copy of all your personal data, saved articles, and reading history. Exports take a few minutes to generate.
        </Text>

        <Pressable
          onPress={() => void handleRequestExport()}
          disabled={requesting}
          style={({ pressed }) => [
            styles.requestButton,
            {
              backgroundColor: requesting || pressed ? palette.primaryDim : palette.primary,
              opacity: requesting ? 0.7 : 1,
            },
          ]}
        >
          <View style={styles.buttonContent}>
            {requesting ? (
              <ActivityIndicator color={palette.primaryForeground} />
            ) : (
              <>
                <FileDown size={18} color={palette.primaryForeground} strokeWidth={2.2} />
                <Text style={[styles.buttonText, { color: palette.primaryForeground }]}>
                  Request New Export
                </Text>
              </>
            )}
          </View>
        </Pressable>

        <Text style={[styles.sectionTitle, { color: palette.onSurface }]}>
          Your Exports
        </Text>

        {loading ? (
          <ActivityIndicator color={palette.primary} style={{ marginTop: 20 }} />
        ) : exports.length === 0 ? (
          <Text style={[styles.emptyText, { color: palette.onSurfaceVariant }]}>
            You haven't requested any exports yet.
          </Text>
        ) : (
          <View style={styles.list}>
            {exports.map((item) => (
              <View
                key={item.id}
                style={[
                  styles.card,
                  {
                    backgroundColor: palette.surfaceContainerLowest,
                    borderColor: palette.outlineVariant + "26",
                  },
                ]}
              >
                <View style={styles.cardInfo}>
                  <Text style={[styles.dateText, { color: palette.onSurface }]}>
                    {new Date(item.createdAt).toLocaleDateString(undefined, {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                      hour: "numeric",
                      minute: "numeric",
                    })}
                  </Text>
                  <Text
                    style={[
                      styles.statusText,
                      {
                        color:
                          item.status === "completed"
                            ? palette.primary
                            : item.status === "failed"
                            ? palette.error
                            : palette.onSurfaceVariant,
                      },
                    ]}
                  >
                    {item.status.toUpperCase()}
                  </Text>
                </View>

                {item.status === "completed" && item.downloadUrl && (
                  <Pressable
                    onPress={() => handleDownload(item.downloadUrl!)}
                    style={({ pressed }) => [
                      styles.downloadButton,
                      {
                        backgroundColor: pressed ? palette.surfaceContainerLow : palette.surfaceContainer,
                      },
                    ]}
                  >
                    <Download size={18} color={palette.primary} />
                  </Pressable>
                )}
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  description: {
    fontFamily: "Manrope_400Regular",
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 24,
  },
  requestButton: {
    width: "100%",
    minHeight: 56,
    borderRadius: 999,
    justifyContent: "center",
    paddingHorizontal: 20,
    marginBottom: 32,
  },
  buttonContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
  },
  buttonText: {
    fontFamily: "Manrope_600SemiBold",
    fontSize: 15,
  },
  sectionTitle: {
    fontFamily: "Newsreader_500Medium",
    fontSize: 22,
    marginBottom: 16,
  },
  emptyText: {
    fontFamily: "Manrope_400Regular",
    fontSize: 14,
    textAlign: "center",
    marginTop: 20,
  },
  list: {
    gap: 12,
  },
  card: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  cardInfo: {
    gap: 4,
  },
  dateText: {
    fontFamily: "Manrope_600SemiBold",
    fontSize: 15,
  },
  statusText: {
    fontFamily: "Manrope_700Bold",
    fontSize: 11,
    letterSpacing: 1,
  },
  downloadButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
});
