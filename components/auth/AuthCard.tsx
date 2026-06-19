import type { ReactNode } from "react";
import Card from "@/components/ui/Card";

export default function AuthCard({
  eyebrow,
  title,
  subtitle,
  children,
}: {
  eyebrow: string;
  title: string;
  subtitle?: string;
  children: ReactNode;
}) {
  return (
    <Card pad="lg" style={{ boxShadow: "var(--shadow-lg)" }}>
      <div className="dg-eyebrow" style={{ marginBottom: "8px" }}>
        {eyebrow}
      </div>
      <h1
        style={{
          fontFamily: "var(--font-secondary)",
          fontSize: "24px",
          margin: "0 0 6px",
          color: "var(--fg-primary)",
          letterSpacing: "-0.01em",
        }}
      >
        {title}
      </h1>
      {subtitle && (
        <p style={{ fontSize: "14px", color: "var(--fg-secondary)", margin: "0 0 22px", lineHeight: 1.5 }}>
          {subtitle}
        </p>
      )}
      {children}
    </Card>
  );
}

export function AuthAlert({
  tone,
  children,
}: {
  tone: "error" | "success";
  children: ReactNode;
}) {
  const style =
    tone === "error"
      ? { background: "#FBEAEA", border: "1px solid #E9B7B8", color: "var(--dg-error-dark)" }
      : { background: "#F1F7DC", border: "1px solid #CDE08C", color: "var(--dg-success-dark)" };
  return (
    <div
      role={tone === "error" ? "alert" : "status"}
      style={{
        ...style,
        fontSize: "13px",
        borderRadius: "var(--radius-md)",
        padding: "10px 12px",
        marginBottom: "16px",
        lineHeight: 1.45,
      }}
    >
      {children}
    </div>
  );
}
