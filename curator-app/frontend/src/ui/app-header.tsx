import { useNavigate } from "react-router";
import { Menu as MenuIcon } from "lucide-react";

import { useAuth } from "../app/context/AuthContext";
import { SubscriptionBadge } from "../app/components/SubscriptionBadge";
import { ProfileAvatar } from "./profile-avatar";

interface AppHeaderProps {
  title?: string;
}

export function AppHeader({ title = "The Curator" }: AppHeaderProps) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const avatar = user?.profileImage;

  return (
    <header
      className="fixed inset-x-0 top-4 z-50 px-4"
      data-layout="app-header"
    >
      <div className="mx-auto flex max-w-[680px] items-center gap-2">
        <button
          type="button"
          onClick={() => navigate("/menu")}
          className="glass-pill flex h-[52px] w-[52px] shrink-0 items-center justify-center border-2 border-outline-variant/30 text-on-surface transition-transform active:scale-[0.98]"
          aria-label="Open menu"
        >
          <MenuIcon className="h-5 w-5" strokeWidth={2.5} />
        </button>

        <div className="glass-pill min-w-0 flex-1 border-2 border-outline-variant/30 px-4 py-3">
          <h1 className="truncate text-center font-[family-name:var(--font-headline)] text-[19px] italic leading-6 text-on-surface">
            {title}
          </h1>
        </div>

        <button
          type="button"
          onClick={() => navigate("/settings")}
          className="glass-pill flex h-[52px] shrink-0 items-center gap-1.5 border-2 border-outline-variant/30 py-2 pl-2 pr-3 transition-transform active:scale-[0.98]"
        >
          <SubscriptionBadge size="sm" />
          <ProfileAvatar avatarUrl={avatar} name={user?.name} email={user?.email} size={30} />
        </button>
      </div>
    </header>
  );
}
