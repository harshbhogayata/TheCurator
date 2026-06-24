import { Pressable, Text, View } from "react-native";
import { RefreshCw, ShieldAlert } from "lucide-react-native";

import { useSubscription } from "../providers/subscription-provider";
import { useTheme } from "../providers/theme-provider";
import { type } from "./tokens/typography";

interface MembershipSyncBannerProps {
  /** Use inside screens that already apply horizontal padding. */
  embedded?: boolean;
}

export function MembershipSyncBanner({ embedded = false }: MembershipSyncBannerProps) {
  const { palette } = useTheme();
  const { tierSyncDegraded, isTierResolving, refreshTier } = useSubscription();

  if (isTierResolving || !tierSyncDegraded) {
    return null;
  }

  return (
    <View
      style={{
        marginHorizontal: embedded ? 0 : 16,
        marginBottom: 16,
        padding: 16,
        borderRadius: 20,
        backgroundColor: palette.secondaryContainer,
        borderWidth: 1,
        borderColor: palette.outlineVariant + "33",
        gap: 12,
      }}
    >
      <View style={{ flexDirection: "row", alignItems: "flex-start", gap: 12 }}>
        <ShieldAlert size={18} color={palette.onSecondaryContainer} style={{ marginTop: 2 }} />
        <View style={{ flex: 1, gap: 4 }}>
          <Text style={[type.label, { color: palette.onSecondaryContainer }]}>
            Membership status needs a refresh
          </Text>
          <Text
            style={[
              type.labelSm,
              { fontFamily: "Manrope_400Regular", color: palette.onSecondaryContainer },
            ]}
          >
            We could not confirm your plan with Curator right now. Your reading access is
            unchanged — tap refresh to sync your membership.
          </Text>
        </View>
      </View>

      <Pressable
        onPress={() => void refreshTier()}
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "center",
          gap: 8,
          paddingVertical: 10,
          borderRadius: 999,
          backgroundColor: palette.inverseSurface,
        }}
      >
        <RefreshCw size={16} color={palette.inverseOnSurface} />
        <Text style={[type.labelSm, { color: palette.inverseOnSurface, fontFamily: "Manrope_600SemiBold" }]}>
          Refresh membership
        </Text>
      </Pressable>
    </View>
  );
}
