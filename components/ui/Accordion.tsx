"use client";

import { useState, type ReactNode } from "react";
import { ChevronDown } from "lucide-react";

/**
 * Sección colapsable simple para los formularios largos (encuesta, preguntas
 * disparadoras). Cerrada por defecto: lo opcional no agranda el form.
 */
export default function Accordion({
  title,
  subtitle,
  badge,
  defaultOpen = false,
  children,
}: {
  title: string;
  subtitle?: string;
  /** Indicador a la derecha (ej: "1 encuesta" cuando hay contenido). */
  badge?: ReactNode;
  defaultOpen?: boolean;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div
      style={{
        border: "1px solid var(--border-default)",
        borderRadius: "var(--radius-md)",
        overflow: "hidden",
      }}
    >
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        style={{
          width: "100%",
          display: "flex",
          alignItems: "center",
          gap: "10px",
          padding: "12px 14px",
          background: open ? "var(--dg-gray-100)" : "var(--dg-white)",
          border: "none",
          cursor: "pointer",
          textAlign: "left",
        }}
      >
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: "13px", fontWeight: 700, color: "var(--fg-primary)" }}>
            {title}
          </div>
          {subtitle && (
            <div style={{ fontSize: "12px", color: "var(--fg-muted)", marginTop: "2px" }}>
              {subtitle}
            </div>
          )}
        </div>
        {badge}
        <ChevronDown
          size={16}
          color="var(--fg-muted)"
          aria-hidden="true"
          style={{
            flex: "none",
            transform: open ? "rotate(180deg)" : "none",
            transition: "transform .15s ease",
          }}
        />
      </button>
      {open && <div style={{ padding: "14px", borderTop: "1px solid var(--border-default)" }}>{children}</div>}
    </div>
  );
}
