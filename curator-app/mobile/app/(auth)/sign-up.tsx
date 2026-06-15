import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "expo-router";
import { Linking, Platform, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { KeyboardAvoidingView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Controller, useForm } from "react-hook-form";
import { useState } from "react";
import { z } from "zod";
import { ArrowLeft, User, Mail, Lock } from "lucide-react-native";

import { useAuth } from "../../src/providers/auth-provider";
import { SITE_URL } from "../../src/constants/site";
import { useTheme } from "../../src/providers/theme-provider";
import { AuthCard } from "../../src/ui/auth-card";
import { InputField } from "../../src/ui/input-field";
import { PrimaryButton } from "../../src/ui/primary-button";
import { StatusBanner } from "../../src/ui/status-banner";

const schema = z.object({
  displayName: z.string().max(60, "Keep your name under 60 characters.").optional(),
  email: z.email("Enter a valid email."),
  password: z.string().min(8, "Use at least 8 characters."),
});

type SignUpValues = z.infer<typeof schema>;

export default function SignUpScreen() {
  const { palette } = useTheme();
  const router = useRouter();
  const { signUpWithEmail, isBusy, errorMessage, clearError } = useAuth();
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<SignUpValues>({
    resolver: zodResolver(schema),
    defaultValues: { displayName: "", email: "", password: "" },
  });

  const onSubmit = handleSubmit(async (values) => {
    await signUpWithEmail({
      email: values.email,
      password: values.password,
      displayName: values.displayName,
    });
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
            eyebrow="Create account"
            title="Join The Curator"
            description="Create your account, then we'll tailor your experience."
          >
            {errorMessage ? <StatusBanner tone="error" message={errorMessage} /> : null}

            <Controller
              control={control}
              name="displayName"
              render={({ field: { onChange, value } }) => (
                <InputField
                  label="Display name"
                  value={value ?? ""}
                  onChangeText={(v) => { clearError(); onChange(v); }}
                  hint="Optional."
                  placeholder="Harsh"
                  icon={<User size={14} color={palette.outline} />}
                />
              )}
            />
            <Controller
              control={control}
              name="email"
              render={({ field: { onChange, value } }) => (
                <InputField
                  label="Email address"
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
                  value={value}
                  onChangeText={(v) => { clearError(); onChange(v); }}
                  secureTextEntry
                  autoCapitalize="none"
                  error={errors.password?.message}
                  hint="At least 8 characters."
                  placeholder="Create a password"
                  icon={<Lock size={14} color={palette.outline} />}
                />
              )}
            />

            {/* Terms */}
            <Pressable
              onPress={() => setAgreedToTerms(!agreedToTerms)}
              style={styles.termsRow}
            >
              <View
                style={[
                  styles.checkbox,
                  {
                    borderColor: agreedToTerms ? palette.primary : palette.outlineVariant,
                    backgroundColor: agreedToTerms ? palette.primary : "transparent",
                  },
                ]}
              >
                {agreedToTerms ? (
                  <Text style={{ color: palette.primaryForeground, fontSize: 13, fontFamily: "Manrope_700Bold" }}>
                    ✓
                  </Text>
                ) : null}
              </View>
              <Text style={[styles.termsText, { color: palette.onSurfaceVariant }]}>
                I agree to the{" "}
                <Text
                  onPress={(event) => {
                    event.stopPropagation();
                    void Linking.openURL(`${SITE_URL}/privacy`);
                  }}
                  style={{ color: palette.primary, fontFamily: "Manrope_600SemiBold" }}
                >
                  Privacy Policy
                </Text>
                {" "}and{" "}
                <Text
                  onPress={(event) => {
                    event.stopPropagation();
                    void Linking.openURL(`${SITE_URL}/terms`);
                  }}
                  style={{ color: palette.primary, fontFamily: "Manrope_600SemiBold" }}
                >
                  Terms of Service
                </Text>
              </Text>
            </Pressable>
          </AuthCard>
        </ScrollView>

        {/* Sticky CTA — always visible */}
        <View style={[styles.stickyFooter, { backgroundColor: palette.background, borderTopColor: palette.outlineVariant + "40" }]}>
          <PrimaryButton
            label="Create account"
            loading={isBusy || isSubmitting}
            disabled={!agreedToTerms}
            onPress={onSubmit}
          />
          <View style={styles.divider}>
            <View style={[styles.dividerLine, { backgroundColor: palette.outlineVariant + "40" }]} />
            <Text style={[styles.dividerText, { color: palette.outline }]}>or</Text>
            <View style={[styles.dividerLine, { backgroundColor: palette.outlineVariant + "40" }]} />
          </View>
          <PrimaryButton
            label="Sign in instead"
            variant="secondary"
            onPress={() => router.push("/sign-in")}
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
  termsRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    paddingVertical: 4,
  },
  checkbox: {
    marginTop: 2,
    width: 20,
    height: 20,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 6,
    borderWidth: 1.5,
  },
  termsText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 19,
    fontFamily: "Manrope_400Regular",
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
  dividerLine: {
    flex: 1,
    height: 1,
  },
  dividerText: {
    fontFamily: "Manrope_400Regular",
    fontSize: 13,
  },
});
