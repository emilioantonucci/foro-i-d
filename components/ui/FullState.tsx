import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

/** Centered full-page state used by error / not-found screens. */
export default function FullState({
  icon: Icon,
  title,
  desc,
  tone = "neutral",
  children,
}: {
  icon: LucideIcon;
  title: string;
  desc?: string;
  tone?: "neutral" | "danger";
  children?: ReactNode;
}) {
  const color = tone === "danger" ? "var(--dg-error)" : "var(--fg-muted)";
  const bg = tone === "danger" ? "rgba(198, 42, 47, 0.10)" : "var(--dg-gray-100)";
  return (
    <div
      style={{
        maxWidth: "460px",
        margin: "10vh auto",
        textAlign: "center",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        padding: "0 20px",
      }}
    >
      <span
        style={{
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          width: "64px",
          height: "64px",
          borderRadius: "50%",
          background: bg,
          color,
          marginBottom: "18px",
        }}
      >
        <Icon size={30} aria-hidden="true" />
      </span>
      <h1
        style={{
          fontFamily: "var(--font-secondary)",
          fontSize: "22px",
          fontWeight: 700,
          color: "var(--fg-primary)",
          margin: "0 0 8px",
        }}
      >
        {title}
      </h1>
      {desc && (
        <p
          style={{
            fontSize: "14px",
            color: "var(--fg-secondary)",
            margin: "0 0 22px",
            lineHeight: 1.55,
          }}
        >
          {desc}
        </p>
      )}
      {children && (
        <div style={{ display: "flex", gap: "10px", justifyContent: "center", flexWrap: "wrap" }}>
          {children}
        </div>
      )}
    </div>
  );
}
