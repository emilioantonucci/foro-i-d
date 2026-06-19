import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import Button from "./Button";

export default function EmptyState({
  icon: Icon,
  title,
  desc,
  ctaHref,
  ctaLabel,
  children,
}: {
  icon?: LucideIcon;
  title: string;
  desc?: string;
  ctaHref?: string;
  ctaLabel?: string;
  children?: ReactNode;
}) {
  return (
    <div
      style={{
        background: "var(--dg-white)",
        border: "1px dashed var(--border-strong)",
        borderRadius: "var(--radius-lg)",
        padding: "44px 32px",
        textAlign: "center",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
      }}
    >
      {Icon && (
        <span
          style={{
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            width: "52px",
            height: "52px",
            borderRadius: "50%",
            background: "var(--dg-gray-100)",
            color: "var(--fg-muted)",
            marginBottom: "14px",
          }}
        >
          <Icon size={24} aria-hidden="true" />
        </span>
      )}
      <p
        style={{
          fontFamily: "var(--font-secondary)",
          fontWeight: 700,
          fontSize: "16px",
          color: "var(--fg-primary)",
          margin: "0 0 6px",
        }}
      >
        {title}
      </p>
      {desc && (
        <p
          style={{
            fontSize: "13.5px",
            color: "var(--fg-secondary)",
            margin: "0 0 16px",
            maxWidth: "380px",
            lineHeight: 1.5,
          }}
        >
          {desc}
        </p>
      )}
      {ctaHref && ctaLabel && (
        <Button href={ctaHref} size="sm">
          {ctaLabel}
        </Button>
      )}
      {children}
    </div>
  );
}
