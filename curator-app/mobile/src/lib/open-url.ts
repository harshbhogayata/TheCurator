import { Alert, Linking } from "react-native";

export function normalizeExternalUrl(raw: string): string {
  const trimmed = raw.trim();
  if (!trimmed) return "";
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  if (trimmed.startsWith("www.")) return `https://${trimmed}`;
  if (trimmed.includes(".") && !trimmed.includes(" ")) return `https://${trimmed}`;
  return "";
}

export async function openExternalUrl(raw: string, label = "link"): Promise<boolean> {
  const url = normalizeExternalUrl(raw);
  if (!url) {
    Alert.alert("Link unavailable", `This ${label} does not have a web address yet.`);
    return false;
  }

  try {
    const supported = await Linking.canOpenURL(url);
    if (!supported) {
      Alert.alert("Unable to open link", "Your device could not open this source.");
      return false;
    }
    await Linking.openURL(url);
    return true;
  } catch {
    Alert.alert("Unable to open link", "This source link could not be opened.");
    return false;
  }
}
