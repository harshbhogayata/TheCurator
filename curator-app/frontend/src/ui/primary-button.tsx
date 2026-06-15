import { type ButtonHTMLAttributes, type ReactNode } from "react";
import { Link } from "react-router";

type ButtonVariant = "primary" | "secondary" | "ghost";

interface PrimaryButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  label: string;
  variant?: ButtonVariant;
  loading?: boolean;
  icon?: ReactNode;
  iconPosition?: "left" | "right";
  /** When set, renders a React Router Link (reliable navigation). */
  to?: string;
}

const variantClass: Record<ButtonVariant, string> = {
  primary: "bg-inverse-surface text-surface shadow-xl hover:bg-zinc-800",
  secondary:
    "border border-outline-variant/15 bg-surface-container-low text-on-surface hover:bg-surface-container",
  ghost:
    "bg-transparent text-on-surface-variant hover:bg-surface-container-low hover:text-on-surface",
};

const baseClass =
  "relative z-50 flex w-full cursor-pointer items-center justify-center gap-2 rounded-full px-6 py-4 text-base font-semibold tracking-wide no-underline transition-all active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50";

function ButtonContent({
  label,
  loading,
  icon,
  iconPosition = "right",
}: Pick<PrimaryButtonProps, "label" | "loading" | "icon" | "iconPosition">) {
  if (loading) return <span>{label}…</span>;
  return (
    <>
      {iconPosition === "left" ? icon : null}
      <span>{label}</span>
      {iconPosition === "right" ? icon : null}
    </>
  );
}

export function PrimaryButton({
  label,
  variant = "primary",
  loading = false,
  disabled,
  icon,
  iconPosition = "right",
  className = "",
  type = "button",
  to,
  onClick,
  ...rest
}: PrimaryButtonProps) {
  const classes = `${baseClass} ${variantClass[variant]} ${className}`;

  if (to) {
    return (
      <Link to={to} className={classes} aria-disabled={disabled || loading ? true : undefined}>
        <ButtonContent label={label} loading={loading} icon={icon} iconPosition={iconPosition} />
      </Link>
    );
  }

  return (
    <button
      type={type}
      disabled={disabled || loading}
      onClick={onClick}
      className={classes}
      {...rest}
    >
      <ButtonContent label={label} loading={loading} icon={icon} iconPosition={iconPosition} />
    </button>
  );
}
