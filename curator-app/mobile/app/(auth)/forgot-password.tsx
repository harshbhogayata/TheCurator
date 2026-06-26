import { zodResolver } from "@hookform/resolvers/zod";
import { router, useRouter } from "expo-router";
import { useState } from "react";
import { Text, View } from "react-native";
import { Controller, useForm } from "react-hook-form";
import { z } from "zod";
import { ArrowLeft, Mail } from "lucide-react-native";

import { useAndroidBackNavigation } from "../../src/hooks/use-android-back-navigation";
import { useAuth } from "../../src/providers/auth-provider";
import { useTheme } from "../../src/providers/theme-provider";
import { AuthCard } from "../../src/ui/auth-card";
import { InputField } from "../../src/ui/input-field";
import { PrimaryButton } from "../../src/ui/primary-button";
import { Screen } from "../../src/ui/screen";
import { StatusBanner } from "../../src/ui/status-banner";

const schema = z.object({
  email: z.email("Enter the email tied to your account."),
});

type ForgotPasswordValues = z.infer<typeof schema>;

export default function ForgotPasswordScreen() {
  const { palette } = useTheme();
  const nav = useRouter();
  useAndroidBackNavigation("/sign-in");
  const { requestPasswordReset, isBusy, errorMessage, clearError } = useAuth();
  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ForgotPasswordValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      email: "",
    },
  });
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  return (
    <Screen tabBarPadding={false}>
      {/* Back button */}
      <PrimaryButton
        label="Back"
        variant="ghost"
        icon={<ArrowLeft size={18} />}
        iconPosition="left"
        onPress={() => nav.back()}
      />

      <AuthCard
        eyebrow="Password recovery"
        title="Reset Password"
        description="Enter your email and we'll send you instructions to reset your password. The message stays neutral either way."
      >
        {successMessage ? (
          <View style={{ gap: 16, alignItems: "center" }}>
            <View
              style={{
                width: 64,
                height: 64,
                borderRadius: 32,
                backgroundColor: palette.primaryContainer,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Text style={{ fontSize: 28 }}>✓</Text>
            </View>
            <StatusBanner tone="success" message={successMessage} />
            <PrimaryButton
              label="Back to Sign In"
              variant="secondary"
              onPress={() => router.push("/sign-in")}
            />
          </View>
        ) : null}
        {errorMessage ? <StatusBanner tone="error" message={errorMessage} /> : null}

        {!successMessage ? (
          <>
            <Controller
              control={control}
              name="email"
              render={({ field: { onChange, value } }) => (
                <InputField
                  label="Email address"
                  value={value}
                  onChangeText={(nextValue) => {
                    clearError();
                    setSuccessMessage(null);
                    onChange(nextValue);
                  }}
                  autoCapitalize="none"
                  autoCorrect={false}
                  keyboardType="email-address"
                  error={errors.email?.message}
                  placeholder="you@curator.app"
                  icon={<Mail size={14} color={palette.outline} />}
                />
              )}
            />

            <PrimaryButton
              label="Send Reset Instructions"
              loading={isBusy || isSubmitting}
              onPress={handleSubmit(async (values) => {
                await requestPasswordReset(values.email);
                setSuccessMessage(
                  "If that email is registered, check your inbox. Open the link, tap the button on the page, then choose a new password.",
                );
              })}
            />

            {/* Divider */}
            <View style={{ flexDirection: "row", alignItems: "center", gap: 12, marginVertical: 4 }}>
              <View style={{ flex: 1, height: 1, backgroundColor: palette.outlineVariant + "40" }} />
              <Text style={{ color: palette.outline, fontFamily: "Manrope_400Regular", fontSize: 13 }}>
                or
              </Text>
              <View style={{ flex: 1, height: 1, backgroundColor: palette.outlineVariant + "40" }} />
            </View>

            <PrimaryButton
              label="Back to Sign In"
              variant="secondary"
              onPress={() => router.push("/sign-in")}
            />
          </>
        ) : null}
      </AuthCard>
    </Screen>
  );
}
