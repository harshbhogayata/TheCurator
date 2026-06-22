import { Pressable, Text, View } from "react-native";
import { Mail } from "lucide-react-native";

import { useAuth } from "../providers/auth-provider";
import { useTheme } from "../providers/theme-provider";
import { useToast } from "../providers/toast-provider";
import { type } from "./tokens/typography";

interface EmailVerificationBannerProps {
  compact?: boolean;
}

export function EmailVerificationBanner({ compact = false }: EmailVerificationBannerProps) {
  const { palette } = useTheme();
  const { session, resendVerificationEmail, refreshSession, isBusy } = useAuth();
  const { showToast } = useToast();

  if (!session || session.user.emailVerified) {
    return null;
  }

  const handleResend = async () => {
    try {
      await resendVerificationEmail();
      showToast("success", "Verification email sent. Check your inbox.");
    } catch (error) {
      showToast(
        "error",
        error instanceof Error ? error.message : "Could not send the verification email.",
      );
    }
  };

  const handleRefresh = async () => {
    try {
      await refreshSession();
      showToast("success", "Account status refreshed.");
    } catch {
      showToast("error", "Could not refresh your account status.");
    }
  };

  return (
    <View
      style={{
        marginHorizontal: compact ? 0 : 16,
        marginBottom: compact ? 0 : 16,
        padding: 16,
        borderRadius: 20,
        backgroundColor: palette.secondaryContainer,
        borderWidth: 1,
        borderColor: palette.outlineVariant + "33",
        gap: 12,
      }}
    >
      <View style={{ flexDirection: "row", alignItems: "flex-start", gap: 12 }}>
        <Mail size={18} color={palette.onSecondaryContainer} style={{ marginTop: 2 }} />
        <View style={{ flex: 1, gap: 4 }}>
          <Text style={[type.label, { color: palette.onSecondaryContainer }]}>
            Verify your email
          </Text>
          <Text style={[type.labelSm, { fontFamily: "Manrope_400Regular", color: palette.onSecondaryContainer }]}>
            We sent a link to {session.user.email}. Verify it to secure your account before launch.
          </Text>
        </View>
      </View>

      <View style={{ flexDirection: "row", gap: 8 }}>
        <Pressable
          onPress={handleResend}
          disabled={isBusy}
          style={{
            flex: 1,
            paddingVertical: 10,
            borderRadius: 999,
            backgroundColor: palette.inverseSurface,
            alignItems: "center",
          }}
        >
          <Text style={[type.labelSm, { color: palette.inverseOnSurface, fontFamily: "Manrope_600SemiBold" }]}>
            Resend email
          </Text>
        </Pressable>
        <Pressable
          onPress={handleRefresh}
          disabled={isBusy}
          style={{
            flex: 1,
            paddingVertical: 10,
            borderRadius: 999,
            borderWidth: 1,
            borderColor: palette.outlineVariant,
            alignItems: "center",
          }}
        >
          <Text style={[type.labelSm, { color: palette.onSecondaryContainer, fontFamily: "Manrope_600SemiBold" }]}>
            I verified
          </Text>
        </Pressable>
      </View>
    </View>
  );
}
