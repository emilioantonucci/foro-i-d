import type { CSSProperties, ReactNode } from "react";

type Variant = "tint" | "solid" | "subtle";

interface BadgeProps {
  /** Hex color driving the badge (ignored for the `subtle` variant). */
  color?: string;
  variant?: Variant;
  size?: "sm" | "md";
  /** Show a leading status dot. */
  dot?: boolean;
  className?: string;
  style?: CSSProperties;
  children: ReactNode;
}

/** Pill / status badge. Tinted background by default (`color` at ~12% + text). */
export default function Badge({
  color = "var(--dg-gray-500)",
  variant = "tint",
  size = "md",
  dot,
  className,
  style,
  children,
}: BadgeProps) {
  const variantStyle: CSSProperties =
    variant === "solid"
      ? { background: color, color: "var(--dg-white)" }
      : variant === "subtle"
        ? { background: "var(--dg-gray-100)", color: "var(--fg-secondary)" }
        : { background: `${color}1F`, color };

  const cls = ["dg-badge", size === "sm" ? "dg-badge--sm" : "", className]
    .filter(Boolean)
    .join(" ");

  return (
    <span className={cls} style={{ ...variantStyle, ...style }}>
      {dot && (
        <span
          className="dg-badge__dot"
          style={{ background: variant === "solid" ? "var(--dg-white)" : color }}
        />
      )}
      {children}
    </span>
  );
}
