import * as Haptics from "expo-haptics";

// Navigation, minor interactions
export const tap = () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
// Intentional actions: bookmark, save, toggle
export const medium = () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
// Destructive or high-weight actions: delete, clear all
export const heavy = () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
// Tab and chip selection
export const select = () => Haptics.selectionAsync();
// Outcomes
export const ok = () => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
export const warn = () => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
export const error = () => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
