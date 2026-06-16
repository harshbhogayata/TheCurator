import { getDownloadURL, getStorage, ref, uploadBytes } from "firebase/storage";

import { firebaseConfigured, getFirebaseApp, getFirebaseAuth } from "./firebase";

export class AvatarUploadError extends Error {
  code: "storage_unavailable" | "not_signed_in" | "read_failed" | "upload_failed";

  constructor(
    code: AvatarUploadError["code"],
    message: string,
  ) {
    super(message);
    this.name = "AvatarUploadError";
    this.code = code;
  }
}

export const firebaseStorageConfigured =
  firebaseConfigured &&
  Boolean(String(process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET ?? "").trim());

/** True when Firebase Storage bucket is configured (Blaze plan required for uploads). */
export function isAvatarUploadAvailable(): boolean {
  return firebaseStorageConfigured;
}

function mapFirebaseStorageError(error: unknown): AvatarUploadError {
  const code = (error as { code?: string })?.code ?? "";
  if (code.includes("storage/unauthorized") || code.includes("storage/unknown")) {
    return new AvatarUploadError(
      "storage_unavailable",
      "Photo upload needs Firebase Storage on the Blaze plan. You can still use your initials avatar.",
    );
  }
  return new AvatarUploadError(
    "upload_failed",
    "Could not upload your photo. Try again or continue with your initials.",
  );
}

export async function uploadProfileAvatarImage(localUri: string): Promise<string> {
  if (!firebaseStorageConfigured) {
    throw new AvatarUploadError(
      "storage_unavailable",
      "Profile photos are not configured yet. Your initials avatar will be used instead.",
    );
  }

  const auth = getFirebaseAuth();
  const user = auth.currentUser;

  if (!user) {
    throw new AvatarUploadError(
      "not_signed_in",
      "You need to be signed in to update your profile photo.",
    );
  }

  const response = await fetch(localUri);
  if (!response.ok) {
    throw new AvatarUploadError("read_failed", "Could not read the selected photo.");
  }

  const blob = await response.blob();
  const storageRef = ref(getStorage(getFirebaseApp()), `avatars/${user.uid}/profile.jpg`);

  try {
    await uploadBytes(storageRef, blob, {
      contentType: blob.type || "image/jpeg",
      cacheControl: "public,max-age=3600",
    });
  } catch (error) {
    throw mapFirebaseStorageError(error);
  }

  return getDownloadURL(storageRef);
}
