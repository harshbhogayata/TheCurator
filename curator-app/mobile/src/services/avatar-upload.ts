import { getDownloadURL, getStorage, ref, uploadBytes } from "firebase/storage";

import { firebaseConfigured, getFirebaseApp, getFirebaseAuth } from "./firebase";

export const firebaseStorageConfigured =
  firebaseConfigured &&
  Boolean(String(process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET ?? "").trim());

export async function uploadProfileAvatarImage(localUri: string): Promise<string> {
  if (!firebaseStorageConfigured) {
    throw new Error("Firebase Storage is not configured for profile photo uploads.");
  }

  const auth = getFirebaseAuth();
  const user = auth.currentUser;

  if (!user) {
    throw new Error("You need to be signed in to update your profile photo.");
  }

  const response = await fetch(localUri);
  if (!response.ok) {
    throw new Error("Could not read the selected photo.");
  }

  const blob = await response.blob();
  const storageRef = ref(getStorage(getFirebaseApp()), `avatars/${user.uid}/profile.jpg`);

  await uploadBytes(storageRef, blob, {
    contentType: blob.type || "image/jpeg",
    cacheControl: "public,max-age=3600",
  });

  return getDownloadURL(storageRef);
}
