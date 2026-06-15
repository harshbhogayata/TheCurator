import { ImageWithFallback } from "../app/components/figma/ImageWithFallback";
import { userInitial } from "../lib/user-display-name";

interface ProfileAvatarProps {
  avatarUrl?: string | null;
  displayName?: string | null;
  name?: string | null;
  email?: string | null;
  size?: number;
  className?: string;
}

export function ProfileAvatar({
  avatarUrl,
  displayName,
  name,
  email,
  size = 32,
  className = "",
}: ProfileAvatarProps) {
  const initial = userInitial({ displayName, name, email });
  const dimension = { width: size, height: size };

  if (avatarUrl) {
    return (
      <div
        className={`shrink-0 overflow-hidden rounded-full border border-outline-variant/20 ${className}`}
        style={dimension}
      >
        <ImageWithFallback
          src={avatarUrl}
          alt=""
          className="h-full w-full object-cover"
          cdnWidth={Math.max(size * 2, 64)}
        />
      </div>
    );
  }

  return (
    <div
      className={`flex shrink-0 items-center justify-center rounded-full border border-outline-variant/20 bg-primary-container font-semibold text-on-primary-container ${className}`}
      style={{ ...dimension, fontSize: Math.round(size * 0.38) }}
      aria-hidden
    >
      {initial}
    </div>
  );
}
