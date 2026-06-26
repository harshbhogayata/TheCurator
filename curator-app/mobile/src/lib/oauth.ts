import * as Google from "expo-auth-session/providers/google";
import * as WebBrowser from "expo-web-browser";
import { GoogleAuthProvider, type AuthCredential } from "firebase/auth";
import { useMemo } from "react";

WebBrowser.maybeCompleteAuthSession();

const googleWebClientId = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID?.trim() ?? "";
const googleIosClientId = process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID?.trim() ?? "";
const googleAndroidClientId = process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID?.trim() ?? "";

export const isGoogleSignInConfigured = Boolean(
  googleWebClientId || googleIosClientId || googleAndroidClientId,
);

export function useGoogleIdTokenRequest() {
  const config = useMemo(
    () => ({
      webClientId: googleWebClientId || undefined,
      iosClientId: googleIosClientId || undefined,
      androidClientId: googleAndroidClientId || undefined,
    }),
    [],
  );

  return Google.useIdTokenAuthRequest(config);
}

export async function googleCredentialFromIdToken(idToken: string): Promise<AuthCredential> {
  return GoogleAuthProvider.credential(idToken);
}
