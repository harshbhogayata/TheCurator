import { Pressable, StyleSheet, Text, View } from "react-native";
import { useCallback, useEffect } from "react";
import { signInWithCredential } from "firebase/auth";

import {
  googleCredentialFromIdToken,
  isGoogleSignInConfigured,
  useGoogleIdTokenRequest,
} from "../lib/oauth";
import { getFirebaseAuth } from "../services/firebase";
import { useTheme } from "../providers/theme-provider";
import { UI_MAX_FONT_SIZE_MULTIPLIER } from "./tokens/accessibility";

interface OAuthSignInButtonsProps {
  disabled?: boolean;
  onBusyChange?: (busy: boolean) => void;
  onError?: (message: string) => void;
}

export function OAuthSignInButtons({
  disabled = false,
  onBusyChange,
  onError,
}: OAuthSignInButtonsProps) {
  const { palette } = useTheme();
  const [request, response, promptGoogle] = useGoogleIdTokenRequest();

  const setBusy = useCallback(
    (busy: boolean) => {
      onBusyChange?.(busy);
    },
    [onBusyChange],
  );

  useEffect(() => {
    if (!response) return;

    if (response.type !== "success") {
      if (response.type === "error") {
        onError?.("Google sign-in was cancelled or failed. Try again.");
      }
      setBusy(false);
      return;
    }

    const idToken = response.params.id_token;
    if (!idToken) {
      onError?.("Google did not return a sign-in token.");
      return;
    }

    let cancelled = false;
    setBusy(true);
    void (async () => {
      try {
        const credential = await googleCredentialFromIdToken(idToken);
        await signInWithCredential(getFirebaseAuth(), credential);
      } catch (error) {
        if (!cancelled) {
          onError?.(error instanceof Error ? error.message : "Google sign-in failed.");
        }
      } finally {
        if (!cancelled) setBusy(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [onError, response, setBusy]);

  const handleGooglePress = useCallback(async () => {
    if (!request || disabled) return;
    setBusy(true);
    try {
      await promptGoogle();
    } catch (error) {
      onError?.(error instanceof Error ? error.message : "Google sign-in failed.");
      setBusy(false);
    }
  }, [disabled, onError, promptGoogle, request, setBusy]);

  if (!isGoogleSignInConfigured) {
    return null;
  }

  return (
    <View style={styles.root}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Continue with Google"
        disabled={disabled || !request}
        onPress={() => void handleGooglePress()}
        style={[
          styles.button,
          {
            backgroundColor: palette.surfaceContainerLow,
            borderColor: palette.outlineVariant + "55",
            opacity: disabled || !request ? 0.5 : 1,
          },
        ]}
      >
        <Text style={[styles.label, { color: palette.onSurface }]} maxFontSizeMultiplier={UI_MAX_FONT_SIZE_MULTIPLIER}>
          Continue with Google
        </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    gap: 10,
  },
  button: {
    minHeight: 48,
    borderRadius: 999,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 20,
  },
  label: {
    fontFamily: "Manrope_600SemiBold",
    fontSize: 15,
  },
});
