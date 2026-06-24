import { InteractionManager } from "react-native";
import { type Href, useRouter } from "expo-router";

/** Close the current modal, then navigate — avoids stacked modals / dead tab routes. */
export function useNavigateFromModal() {
  const router = useRouter();

  return (href: Href) => {
    if (router.canGoBack()) {
      router.back();
    }

    InteractionManager.runAfterInteractions(() => {
      router.navigate(href);
    });
  };
}
