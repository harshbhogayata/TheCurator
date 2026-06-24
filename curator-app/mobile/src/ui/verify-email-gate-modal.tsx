import { Modal, Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Mail, X } from "lucide-react-native";
import { useRouter } from "expo-router";

import { useAuth } from "../providers/auth-provider";
import { useTheme } from "../providers/theme-provider";
import { useToast } from "../providers/toast-provider";
import { UNVERIFIED_ARTICLE_READ_LIMIT } from "../lib/email-verification";
import type { VerifyGateReason } from "../providers/email-verification-gate-provider";
import { PrimaryButton } from "./primary-button";
import { type } from "./tokens/typography";

interface VerifyEmailGateModalProps {
  visible: boolean;
  reason: VerifyGateReason;
  onClose: () => void;
  dismissible?: boolean;
}

function reasonCopy(reason: VerifyGateReason): { title: string; body: string } {
  switch (reason) {
    case "article_limit":
      return {
        title: "Verify your email to keep reading",
        body: `You've opened ${UNVERIFIED_ARTICLE_READ_LIMIT} stories on this trial. Confirm your inbox so we know it's really you — then reading, saves, and collections unlock.`,
      };
    case "save":
      return {
        title: "Verify to save articles",
        body: "Saving needs a confirmed email so your library stays tied to a real inbox.",
      };
    case "collection":
      return {
        title: "Verify to use collections",
        body: "Collections sync to your account. Verify your email first so nothing gets lost.",
      };
    default:
      return {
        title: "Verify your email",
        body: "We sent a link when you signed up. Confirm your inbox to unlock the full Curator experience.",
      };
  }
}

export function VerifyEmailGateModal({
  visible,
  reason,
  onClose,
  dismissible = true,
}: VerifyEmailGateModalProps) {
  const { palette } = useTheme();
  const { session, resendVerificationEmail, refreshSession, isBusy, signOut } = useAuth();
  const { showToast } = useToast();
  const router = useRouter();
  const copy = reasonCopy(reason);

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
      showToast("success", "Account refreshed. If you verified, you're all set.");
    } catch {
      showToast("error", "Could not refresh your account status.");
    }
  };

  const handleSignOut = async () => {
    onClose();
    await signOut();
    router.replace("/(auth)/welcome");
  };

  if (!session) return null;

  return (
    <Modal visible={visible} animationType="fade" presentationStyle="fullScreen">
      <SafeAreaView style={[styles.root, { backgroundColor: palette.background }]}>
        {dismissible ? (
          <Pressable onPress={onClose} hitSlop={12} style={styles.closeButton}>
            <X size={22} color={palette.onSurfaceVariant} />
          </Pressable>
        ) : null}

        <View style={styles.content}>
          <View style={[styles.iconWrap, { backgroundColor: palette.secondaryContainer }]}>
            <Mail size={28} color={palette.onSecondaryContainer} />
          </View>

          <Text style={[styles.title, { color: palette.onSurface }]}>{copy.title}</Text>
          <Text style={[styles.body, { color: palette.onSurfaceVariant }]}>{copy.body}</Text>

          <View
            style={[
              styles.emailPill,
              { backgroundColor: palette.surfaceContainerLow, borderColor: palette.outlineVariant + "33" },
            ]}
          >
            <Text style={[type.labelSm, { color: palette.onSurfaceVariant }]}>{session.user.email}</Text>
          </View>

          <View style={styles.actions}>
            <PrimaryButton label="Resend verification email" loading={isBusy} onPress={() => void handleResend()} />
            <PrimaryButton
              label="I verified — refresh"
              variant="secondary"
              loading={isBusy}
              onPress={() => void handleRefresh()}
            />
            {reason === "article_limit" ? (
              <Pressable onPress={() => void handleSignOut()} style={styles.signOut}>
                <Text style={[type.labelSm, { color: palette.outline }]}>Sign out and use another account</Text>
              </Pressable>
            ) : dismissible ? (
              <Pressable onPress={onClose} style={styles.signOut}>
                <Text style={[type.labelSm, { color: palette.outline }]}>Not now</Text>
              </Pressable>
            ) : null}
          </View>
        </View>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  closeButton: {
    alignSelf: "flex-end",
    padding: 20,
  },
  content: {
    flex: 1,
    paddingHorizontal: 28,
    justifyContent: "center",
    gap: 16,
    marginTop: -48,
  },
  iconWrap: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "center",
    marginBottom: 8,
  },
  title: {
    fontFamily: "Newsreader_500Medium",
    fontSize: 28,
    lineHeight: 34,
    textAlign: "center",
  },
  body: {
    fontFamily: "Manrope_400Regular",
    fontSize: 15,
    lineHeight: 22,
    textAlign: "center",
  },
  emailPill: {
    alignSelf: "center",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 999,
    borderWidth: 1,
    marginTop: 4,
  },
  actions: {
    marginTop: 16,
    gap: 12,
  },
  signOut: {
    alignItems: "center",
    paddingVertical: 12,
  },
});
