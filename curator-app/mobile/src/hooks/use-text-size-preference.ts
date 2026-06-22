import { useCallback } from "react";

import type { TextSize } from "../lib/types";
import { useAuth } from "../providers/auth-provider";
import { useReadingPreferences } from "../providers/reading-preferences-provider";
import { updatePreferences } from "../services/mobile-api";

/**
 * Keeps article typography in sync with the account-level textSize preference.
 * Local reading prefs update immediately; the backend is patched when signed in.
 */
export function useTextSizePreference() {
  const { preferences, hydrateFontSize } = useReadingPreferences();
  const { session, status, updateSessionPreferences } = useAuth();

  const selectTextSize = useCallback(
    (size: TextSize) => {
      const previousSize = preferences.fontSize;
      hydrateFontSize(size);

      if (status !== "signed-in" || !session) {
        return;
      }

      const previousPreferences = session.preferences;
      const nextPreferences = { ...session.preferences, textSize: size };
      updateSessionPreferences(nextPreferences);

      void updatePreferences({ textSize: size })
        .then((payload) => {
          updateSessionPreferences({ ...nextPreferences, ...payload });
        })
        .catch(() => {
          hydrateFontSize(previousSize);
          updateSessionPreferences(previousPreferences);
        });
    },
    [hydrateFontSize, preferences.fontSize, session, status, updateSessionPreferences],
  );

  return {
    fontSize: preferences.fontSize,
    selectTextSize,
  };
}
