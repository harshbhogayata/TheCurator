import { useEffect, useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { SafeAreaView } from "react-native-safe-area-context";
import { Check, Info } from "lucide-react-native";

import { useTheme } from "../../src/providers/theme-provider";
import { useToast } from "../../src/providers/toast-provider";
import { PillPageHeader } from "../../src/ui/pill-page-header";
import { useModalScrollPadding } from "../../src/lib/layout";

const REGION_STORAGE_KEY = "@curator/locale-region";

const regions = [
  { code: "en-US", name: "United States", language: "English (US)", flag: "\uD83C\uDDFA\uD83C\uDDF8" },
  { code: "en-GB", name: "United Kingdom", language: "English (UK)", flag: "\uD83C\uDDEC\uD83C\uDDE7" },
  { code: "en-EU", name: "European Union", language: "English (EU)", flag: "\uD83C\uDDEA\uD83C\uDDFA" },
];

export default function LanguageRegionScreen() {
  const { palette } = useTheme();
  const { showToast } = useToast();
  const modalScrollPadding = useModalScrollPadding();
  const [selectedRegion, setSelectedRegion] = useState("en-US");

  useEffect(() => {
    void AsyncStorage.getItem(REGION_STORAGE_KEY).then((stored) => {
      if (stored && regions.some((region) => region.code === stored)) {
        setSelectedRegion(stored);
      }
    });
  }, []);

  const handleSelect = (code: string) => {
    setSelectedRegion(code);
    void AsyncStorage.setItem(REGION_STORAGE_KEY, code);
    const region = regions.find((r) => r.code === code);
    showToast("success", `Region set to ${region?.name}`);
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: palette.background }} edges={[]}>
      <PillPageHeader title="Language & Region" />

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingTop: modalScrollPadding, paddingHorizontal: 20, paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
      >
        <Text
          style={{
            fontFamily: "Manrope_400Regular",
            fontSize: 14,
            color: palette.onSurfaceVariant,
            textAlign: "center",
            marginBottom: 24,
            lineHeight: 20,
          }}
        >
          Select your preferred region for The Curator experience
        </Text>

        {/* Region Options */}
        <View style={{ gap: 10, marginBottom: 24 }}>
          {regions.map((region) => {
            const isSelected = selectedRegion === region.code;
            return (
              <Pressable
                key={region.code}
                onPress={() => handleSelect(region.code)}
                style={{
                  backgroundColor: palette.surfaceContainerLowest,
                  borderRadius: 24,
                  borderWidth: 2,
                  borderColor: isSelected ? palette.primary : palette.outlineVariant + "26",
                  padding: 20,
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 16,
                }}
              >
                <Text style={{ fontSize: 32 }}>{region.flag}</Text>
                <View style={{ flex: 1 }}>
                  <Text
                    style={{
                      fontFamily: "Manrope_600SemiBold",
                      fontSize: 16,
                      color: palette.onSurface,
                      marginBottom: 2,
                    }}
                  >
                    {region.name}
                  </Text>
                  <Text
                    style={{
                      fontFamily: "Manrope_400Regular",
                      fontSize: 13,
                      color: palette.onSurfaceVariant,
                    }}
                  >
                    {region.language}
                  </Text>
                </View>
                {isSelected ? (
                  <View
                    style={{
                      width: 28,
                      height: 28,
                      borderRadius: 14,
                      backgroundColor: palette.primary,
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <Check size={16} color={palette.primaryForeground} strokeWidth={3} />
                  </View>
                ) : null}
              </Pressable>
            );
          })}
        </View>

        <View
          style={{
            backgroundColor: palette.primaryContainer + "80",
            borderRadius: 24,
            borderWidth: 1,
            borderColor: palette.outlineVariant + "26",
            padding: 20,
            flexDirection: "row",
            gap: 12,
          }}
        >
          <Info size={20} color={palette.onPrimaryContainer} style={{ marginTop: 2 }} />
          <Text
            style={{
              flex: 1,
              fontFamily: "Manrope_400Regular",
              fontSize: 13,
              color: palette.onSurfaceVariant,
              lineHeight: 19,
            }}
          >
            Region preference is saved on this device. Content localization will expand in a future update.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
