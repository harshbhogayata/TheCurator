import { ActivityIndicator, Text, View } from "react-native";

import { useTheme } from "../providers/theme-provider";
import { Screen } from "./screen";

interface LoadingScreenProps {
  title: string;
  message: string;
}

export function LoadingScreen({ title, message }: LoadingScreenProps) {
  const { palette } = useTheme();

  return (
    <Screen className="justify-center">
      <View className="flex-1 items-center justify-center gap-5">
        <ActivityIndicator size="large" color={palette.primary} />
        <View className="items-center gap-2">
          <Text
            className="text-[30px]"
            style={{ color: palette.onSurface, fontFamily: "Newsreader_500Medium" }}
          >
            {title}
          </Text>
          <Text
            className="max-w-[280px] text-center text-base leading-6"
            style={{ color: palette.onSurfaceVariant, fontFamily: "Manrope_400Regular" }}
          >
            {message}
          </Text>
        </View>
      </View>
    </Screen>
  );
}
