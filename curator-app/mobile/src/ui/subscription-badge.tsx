import React, { memo } from "react";
import { StyleSheet, Text, View } from "react-native";
import { Crown, Sparkles, Star } from "lucide-react-native";

import { useTheme } from "../providers/theme-provider";
import {
  useSubscription,
  type SubscriptionTier,
} from "../providers/subscription-provider";

interface SubscriptionBadgeProps {
  size?: "sm" | "md" | "lg";
  tier?: SubscriptionTier;
}

const SIZE_MAP = {
  sm: { height: 24, px: 8, fontSize: 8, iconSize: 10 },
  md: { height: 28, px: 10, fontSize: 9, iconSize: 12 },
  lg: { height: 32, px: 12, fontSize: 10, iconSize: 14 },
} as const;

function SubscriptionBadgeInner({ size = "sm", tier: tierProp }: SubscriptionBadgeProps) {
  const { palette } = useTheme();
  const { tier: contextTier } = useSubscription();
  const tier = tierProp ?? contextTier;

  if (tier === "free") {
    return null;
  }

  const sizeConfig = SIZE_MAP[size];

  const tierConfig = {
    basic: {
      bg: palette.primaryContainer,
      text: palette.onPrimaryContainer,
      Icon: Sparkles,
    },
    premium: {
      bg: palette.secondaryContainer,
      text: palette.onSecondaryContainer,
      Icon: Crown,
    },
    lifetime: {
      bg: palette.tertiaryContainer,
      text: palette.onTertiaryContainer,
      Icon: Star,
    },
  } as const;

  const config = tierConfig[tier];
  const { Icon } = config;

  return (
    <View
      style={[
        styles.container,
        {
          height: sizeConfig.height,
          paddingHorizontal: sizeConfig.px,
          backgroundColor: config.bg,
        },
      ]}
    >
      <Icon size={sizeConfig.iconSize} color={config.text} />
      <Text
        style={[
          styles.label,
          {
            fontSize: sizeConfig.fontSize,
            color: config.text,
          },
        ]}
      >
        {tier.toUpperCase()}
      </Text>
    </View>
  );
}

export const SubscriptionBadge = memo(SubscriptionBadgeInner);

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 999,
    gap: 4,
  },
  label: {
    fontFamily: "Manrope_500Medium",
    letterSpacing: 2,
    textTransform: "uppercase",
  },
});
