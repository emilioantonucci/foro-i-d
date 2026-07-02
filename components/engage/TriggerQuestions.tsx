import { MessageCircleQuestion } from "lucide-react";

/** Bloque destacado de preguntas disparadoras en el detalle de un post/dato.
 *  Se responden por el hilo de comentarios normal. */
export default function TriggerQuestions({ preguntas }: { preguntas: string[] }) {
  if (!preguntas.length) return null;
  return (
    <div
      style={{
        background: "rgba(153,204,6,0.08)",
        border: "1px solid rgba(153,204,6,0.35)",
        borderRadius: "var(--radius-md)",
        padding: "14px 16px",
        margin: "0 0 16px",
      }}
    >
      <div
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: "6px",
          fontSize: "11px",
          fontWeight: 700,
          color: "#6B9000",
          textTransform: "uppercase",
          letterSpacing: ".08em",
          marginBottom: "8px",
        }}
      >
        <MessageCircleQuestion size={13} aria-hidden="true" /> Preguntas para el debate
      </div>
      <ul style={{ margin: 0, paddingLeft: "18px", display: "flex", flexDirection: "column", gap: "6px" }}>
        {preguntas.map((q, i) => (
          <li
            key={i}
            style={{ fontSize: "14.5px", fontWeight: 600, color: "var(--fg-primary)", lineHeight: 1.5 }}
          >
            {q}
          </li>
        ))}
      </ul>
      <div style={{ marginTop: "8px", fontSize: "12px", color: "var(--fg-muted)" }}>
        Sumate respondiendo en los comentarios.
      </div>
    </div>
  );
}
