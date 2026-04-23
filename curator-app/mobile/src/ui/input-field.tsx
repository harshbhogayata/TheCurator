import { forwardRef, type ReactElement, useState } from "react";
import {
  Pressable,
  Text,
  TextInput,
  type TextInputProps,
  View,
} from "react-native";
import { Eye, EyeOff } from "lucide-react-native";

import { useTheme } from "../providers/theme-provider";

interface InputFieldProps extends Omit<TextInputProps, "secureTextEntry"> {
  label: string;
  hint?: string | null;
  error?: string;
  icon?: ReactElement;
  secureTextEntry?: boolean;
}

export const InputField = forwardRef<TextInput, InputFieldProps>(
  ({ label, hint, error, icon, style, onFocus, onBlur, secureTextEntry, ...props }, ref) => {
    const { palette } = useTheme();
    const [focused, setFocused] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const helperText = error ?? hint;
    const helperColor = error ? palette.error : palette.onSurfaceVariant;

    const borderColor = error
      ? palette.error
      : focused
        ? palette.primary
        : palette.outlineVariant + "26";

    return (
      <View style={{ gap: 8 }}>
        <View
          style={{
            backgroundColor: palette.surfaceContainerLow,
            borderRadius: 28,
            borderWidth: 1.5,
            borderColor,
            paddingHorizontal: 20,
            paddingTop: 16,
            paddingBottom: 16,
          }}
        >
          {/* Label row with optional icon */}
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 10 }}>
            {icon ?? null}
            <Text
              style={{
                fontFamily: "Manrope_600SemiBold",
                fontSize: 10,
                color: palette.outline,
                textTransform: "uppercase",
                letterSpacing: 1.5,
              }}
            >
              {label}
            </Text>
          </View>

          {/* Input row */}
          <View style={{ flexDirection: "row", alignItems: "center" }}>
            <TextInput
              ref={ref}
              style={[
                {
                  flex: 1,
                  color: palette.onSurface,
                  fontFamily: "Manrope_400Regular",
                  fontSize: 17,
                  padding: 0,
                  margin: 0,
                },
                style,
              ]}
              placeholderTextColor={palette.outline + "80"}
              onFocus={(e) => {
                setFocused(true);
                onFocus?.(e);
              }}
              onBlur={(e) => {
                setFocused(false);
                onBlur?.(e);
              }}
              secureTextEntry={secureTextEntry && !showPassword}
              {...props}
            />
            {secureTextEntry ? (
              <Pressable
                onPress={() => setShowPassword(!showPassword)}
                style={{ padding: 4, marginLeft: 8 }}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                {showPassword ? (
                  <EyeOff size={18} color={palette.outline} />
                ) : (
                  <Eye size={18} color={palette.outline} />
                )}
              </Pressable>
            ) : null}
          </View>
        </View>

        {helperText ? (
          <Text
            style={{
              fontSize: 13,
              lineHeight: 18,
              paddingHorizontal: 4,
              color: helperColor,
              fontFamily: "Manrope_400Regular",
            }}
          >
            {helperText}
          </Text>
        ) : null}
      </View>
    );
  },
);

InputField.displayName = "InputField";
