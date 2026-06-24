import { Text, View } from "react-native";

import { useEmailVerificationGate } from "../providers/email-verification-gate-provider";
import { EmailVerificationBanner } from "./email-verification-banner";
import { type } from "./tokens/typography";

interface UnverifiedTrialBannerProps {
  embedded?: boolean;
}

export function UnverifiedTrialBanner({ embedded = false }: UnverifiedTrialBannerProps) {
  const { needsVerify, isLockedOut, remainingArticleReads } = useEmailVerificationGate();

  if (!needsVerify || isLockedOut) {
    return null;
  }

  return (
    <View style={{ marginBottom: embedded ? 12 : 16 }}>
      <EmailVerificationBanner compact={embedded} />
      <Text
        style={[
          type.labelSm,
          {
            fontFamily: "Manrope_500Medium",
            textAlign: "center",
            marginTop: 8,
            opacity: 0.9,
          },
        ]}
      >
        {remainingArticleReads === 1
          ? "1 free story left before verify is required"
          : `${remainingArticleReads} free stories left before verify is required`}
      </Text>
    </View>
  );
}
