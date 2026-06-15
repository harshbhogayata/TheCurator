export function userInitial(input: {
  displayName?: string | null;
  name?: string | null;
  email?: string | null;
}): string {
  const label = input.displayName?.trim() || input.name?.trim() || input.email?.trim() || "?";
  return label.charAt(0).toUpperCase();
}
