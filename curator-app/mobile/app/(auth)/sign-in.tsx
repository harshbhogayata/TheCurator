import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "expo-router";
import { Platform, ScrollView, StyleSheet, Text, View } from "react-native";
import { KeyboardAvoidingView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Controller, useForm } from "react-hook-form";
import { useState } from "react";
import { z } from "zod";
import { ArrowLeft, Mail, Lock } from "lucide-react-native";

import { useAndroidBackNavigation } from "../../src/hooks/use-android-back-navigation";
import { useAuth } from "../../src/providers/auth-provider";
import { useTheme } from "../../src/providers/theme-provider";
import { AuthCard } from "../../src/ui/auth-card";
import { InputField } from "../../src/ui/input-field";
import { PrimaryButton } from "../../src/ui/primary-button";
import { OAuthSignInButtons } from "../../src/ui/oauth-sign-in-buttons";
import { StatusBanner } from "../../src/ui/status-banner";

const schema = z.object({
  email: z.email("Enter a valid email."),
  password: z.string().min(8, "Use at least 8 characters."),
});

type SignInValues = z.infer<typeof schema>;

export default function SignInScreen() {
  const { palette } = useTheme();
  const router = useRouter();
  useAndroidBackNavigation("/welcome");
  const { signInWithEmail, isBusy, errorMessage, clearError } = useAuth();
  const [oauthError, setOauthError] = useState<string | null>(null);
  const [oauthBusy, setOauthBusy] = useState(false);
  const {
    control,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting, isValid },
  } = useForm<SignInValues>({
    resolver: zodResolver(schema),
    mode: "onChange",
    reValidateMode: "onChange",
    defaultValues: { email: "", password: "" },
  });

  const passwordValue = watch("password");
  const passwordTooShort = passwordValue.length > 0 && passwordValue.length < 8;

  const onSubmit = handleSubmit(async (values) => {
    await signInWithEmail(values.email, values.password);
  });

  return (
    <SafeAreaView style={[styles.root, { backgroundColor: palette.background }]}>
      <KeyboardAvoidingView
        behavior={Platform.select({ ios: "padding", android: undefined })}
        style={{ flex: 1 }}
      >
        {/* Scrollable form */}
        <ScrollView
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={styles.scrollContent}
        >
          <PrimaryButton
            label="Back"
            variant="ghost"
            icon={<ArrowLeft size={18} />}
            iconPosition="left"
            onPress={() => router.back()}
          />

          <AuthCard
            eyebrow="Sign in"
            title="Welcome Back"
            description="We'll restore your profile and settings exactly where you left them."
          >
            {errorMessage ? <StatusBanner tone="error" message={errorMessage} /> : null}
            {oauthError ? <StatusBanner tone="error" message={oauthError} /> : null}

            <Controller
              control={control}
              name="email"
              render={({ field: { onChange, value } }) => (
                <InputField
                  label="Email address"
                  testID="auth-email"
                  value={value}
                  onChangeText={(v) => { clearError(); onChange(v); }}
                  autoCapitalize="none"
                  autoCorrect={false}
                  keyboardType="email-address"
                  error={errors.email?.message}
                  placeholder="you@curator.app"
                  icon={<Mail size={14} color={palette.outline} />}
                />
              )}
            />
            <Controller
              control={control}
              name="password"
              render={({ field: { onChange, value } }) => (
                <InputField
                  label="Password"
                  testID="auth-password"
                  value={value}
                  onChangeText={(v) => { clearError(); onChange(v); }}
                  secureTextEntry
                  autoCapitalize="none"
                  error={errors.password?.message ?? (passwordTooShort ? "Use at least 8 characters." : undefined)}
                  placeholder="Your password"
                  icon={<Lock size={14} color={palette.outline} />}
                />
              )}
            />

            <View style={styles.forgotRow}>
              <Text
                onPress={() => router.push("/forgot-password")}
                style={[styles.forgotText, { color: palette.primary }]}
              >
                Forgot password?
              </Text>
            </View>
          </AuthCard>
        </ScrollView>

        {/* Sticky CTA — always visible */}
        <View style={[styles.stickyFooter, { backgroundColor: palette.background, borderTopColor: palette.outlineVariant + "40" }]}>
          <PrimaryButton
            label="Sign in"
            testID="auth-sign-in"
            loading={isBusy || isSubmitting || oauthBusy}
            disabled={!isValid || passwordTooShort || oauthBusy}
            onPress={onSubmit}
          />
          <View style={styles.divider}>
            <View style={[styles.dividerLine, { backgroundColor: palette.outlineVariant + "40" }]} />
            <Text style={[styles.dividerText, { color: palette.outline }]}>or continue with</Text>
            <View style={[styles.dividerLine, { backgroundColor: palette.outlineVariant + "40" }]} />
          </View>
          <OAuthSignInButtons
            disabled={isBusy || isSubmitting || oauthBusy}
            onBusyChange={setOauthBusy}
            onError={(message) => {
              clearError();
              setOauthError(message);
            }}
          />
          <View style={styles.divider}>
            <View style={[styles.dividerLine, { backgroundColor: palette.outlineVariant + "40" }]} />
            <Text style={[styles.dividerText, { color: palette.outline }]}>or</Text>
            <View style={[styles.dividerLine, { backgroundColor: palette.outlineVariant + "40" }]} />
          </View>
          <PrimaryButton
            label="Create Account"
            variant="secondary"
            onPress={() => router.push("/sign-up")}
          />
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: 16,
    gap: 20,
  },
  forgotRow: {
    alignItems: "flex-end",
  },
  forgotText: {
    fontFamily: "Manrope_600SemiBold",
    fontSize: 14,
  },
  stickyFooter: {
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: 16,
    gap: 12,
    borderTopWidth: 1,
  },
  divider: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  dividerLine: { flex: 1, height: 1 },
  dividerText: {
    fontFamily: "Manrope_400Regular",
    fontSize: 13,
  },
});
