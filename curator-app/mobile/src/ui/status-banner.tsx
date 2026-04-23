import { AlertCircle, CheckCircle2, Info } from "lucide-react-native";
import { StyleSheet, Text, View } from "react-native";

import { useTheme } from "../providers/theme-provider";

interface StatusBannerProps {
  tone: "error" | "success" | "info";
  message: string;
}

export function StatusBanner({ tone, message }: StatusBannerProps) {
  const { palette } = useTheme();

  const toneStyles =
    tone === "error"
      ? { backgroundColor: palette.errorContainer, color: palette.onErrorContainer, Icon: AlertCircle }
      : tone === "success"
        ? { backgroundColor: palette.successContainer, color: palette.onSuccessContainer, Icon: CheckCircle2 }
        : { backgroundColor: palette.primaryContainer, color: palette.onPrimaryContainer, Icon: Info };

  const { Icon, backgroundColor, color } = toneStyles;

  return (
    <View style={[styles.container, { backgroundColor }]}>
      <Icon size={18} color={color} />
      <Text style={[styles.message, { color, fontFamily: "Manrope_500Medium" }]}>
        {message}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  message: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
  },
});
