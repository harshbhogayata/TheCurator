interface UserNameSource {
  displayName?: string | null;
  email?: string | null;
}

export function userDisplayName(user: UserNameSource | null | undefined, fallback = "Reader"): string {
  const trimmed = user?.displayName?.trim();
  if (trimmed) {
    return trimmed;
  }

  const email = user?.email?.trim();
  if (email) {
    return email.split("@")[0] || fallback;
  }

  return fallback;
}

export function userInitial(user: UserNameSource | null | undefined, fallback = "R"): string {
  const label = userDisplayName(user, fallback);
  return label.charAt(0).toUpperCase() || fallback;
}
