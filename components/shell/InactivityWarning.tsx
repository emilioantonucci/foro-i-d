import Link from "next/link";

/**
 * Slim inactivity warning strip, rendered by the app layout from 12 idle days
 * onward (3 days before apply_inactivity_penalty() subtracts 100 points, see
 * migration 0010). Not dismissable on purpose: it disappears on its own when
 * the user interacts (touch triggers bump last_activity_at) or when the
 * penalty lands (last_penalty_at resets the idle reference).
 */
export default function InactivityWarning({
  diasInactivo,
  diasRestantes,
}: {
  diasInactivo: number;
  diasRestantes: number;
}) {
  const mensaje =
    diasRestantes <= 0
      ? "Última llamada: tus 100 puntos se restan hoy. Publicá o comentá algo y quedan a salvo."
      : `Tus puntos entraron en modo siesta: hace ${diasInactivo} días que no pasás por acá. Si no aparecés en ${
          diasRestantes === 1 ? "1 día" : `${diasRestantes} días`
        }, se te van a restar 100 puntos. Un comentario alcanza para salvarlos 😉`;

  return (
    <div
      role="status"
      style={{
        display: "flex",
        alignItems: "center",
        flexWrap: "wrap",
        gap: "8px",
        background: "rgba(255, 186, 26, 0.08)",
        border: "1px solid rgba(255, 186, 26, 0.35)",
        borderRadius: "var(--radius-md)",
        padding: "10px 14px",
        marginBottom: "16px",
        fontSize: "13.5px",
        color: "var(--fg-primary)",
      }}
    >
      <span aria-hidden="true" style={{ fontSize: "15px", lineHeight: 1 }}>
        🪫
      </span>
      <span style={{ flex: "1 1 240px", minWidth: 0 }}>{mensaje}</span>
      <Link
        href="/radar"
        style={{
          flexShrink: 0,
          fontWeight: 600,
          fontSize: "13px",
          color: "var(--dg-warning-dark)",
          textDecoration: "underline",
          textUnderlineOffset: "3px",
        }}
      >
        Ir al foro
      </Link>
    </div>
  );
}
