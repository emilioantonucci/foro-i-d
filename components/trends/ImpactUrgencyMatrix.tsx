import Link from "next/link";
import { PRIORIDADES } from "@/lib/constants";
import type { TraccionRow } from "@/lib/data/dashboard";
import Card from "@/components/ui/Card";

const prioOrden = (slug: string) => PRIORIDADES.find((p) => p.slug === slug)?.orden ?? 2;
const prioColor = (slug: string) => PRIORIDADES.find((p) => p.slug === slug)?.color ?? "#AAAAB4";

function Quadrant({
  pos,
  tint,
  label,
}: {
  pos: { top?: number; bottom?: number; left?: number; right?: number };
  tint: string;
  label: string;
}) {
  return (
    <div style={{ position: "absolute", width: "50%", height: "50%", background: tint, ...pos }} aria-hidden="true">
      <span
        style={{
          position: "absolute",
          margin: "8px",
          fontSize: "10.5px",
          fontWeight: 700,
          color: "#8A8A90",
          ...labelCorner(pos),
        }}
      >
        {label}
      </span>
    </div>
  );
}
function labelCorner(pos: { top?: number; left?: number }): React.CSSProperties {
  return {
    top: pos.top !== undefined ? 0 : undefined,
    bottom: pos.top === undefined ? 0 : undefined,
    left: pos.left !== undefined ? 0 : undefined,
    right: pos.left === undefined ? 0 : undefined,
  };
}

export default function ImpactUrgencyMatrix({ posts }: { posts: TraccionRow[] }) {
  const top = posts.slice(0, 12);
  const maxVotos = Math.max(1, ...top.map((p) => p.votos));

  return (
    <Card pad="lg">
      <div className="dg-section-label" style={{ marginBottom: "14px" }}>
        Matriz impacto × urgencia
      </div>

      <div style={{ display: "flex", gap: "10px" }}>
        {/* Y axis label */}
        <div style={{ display: "flex", alignItems: "center" }}>
          <span
            style={{
              writingMode: "vertical-rl",
              transform: "rotate(180deg)",
              fontSize: "11px",
              fontWeight: 700,
              color: "var(--fg-muted)",
              letterSpacing: ".05em",
            }}
          >
            Impacto →
          </span>
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          {/* plot */}
          <div
            role="img"
            aria-label={
              top.length === 0
                ? "Matriz de impacto y urgencia sin datos todavía."
                : `Matriz de impacto (votos) por urgencia (prioridad) con ${top.length} temas.`
            }
            style={{
              position: "relative",
              height: "420px",
              border: "1px solid var(--dg-gray-200)",
              borderRadius: "var(--radius-md)",
              overflow: "hidden",
              background: "var(--dg-gray-50)",
            }}
          >
            <Quadrant pos={{ top: 0, left: 0 }} tint="rgba(153,204,6,0.07)" label="Observar / roadmap" />
            <Quadrant pos={{ top: 0, right: 0 }} tint="rgba(198,42,47,0.06)" label="Actuar ya" />
            <Quadrant pos={{ bottom: 0, left: 0 }} tint="transparent" label="Archivar" />
            <Quadrant pos={{ bottom: 0, right: 0 }} tint="rgba(255,186,26,0.07)" label="Reactivo" />

            {/* center axes */}
            <div style={{ position: "absolute", left: "50%", top: 0, bottom: 0, width: "1px", background: "var(--dg-gray-200)" }} aria-hidden="true" />
            <div style={{ position: "absolute", top: "50%", left: 0, right: 0, height: "1px", background: "var(--dg-gray-200)" }} aria-hidden="true" />

            {top.length === 0 && (
              <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", color: "var(--fg-muted)", fontSize: "13px", textAlign: "center", padding: "0 20px" }}>
                Sin tracción todavía — publicá y votá para poblar el radar.
              </div>
            )}

            {top.map((p) => {
              const x = ((prioOrden(p.prioridad) - 0.5) / 4) * 100;
              const ratio = p.votos / maxVotos;
              const y = 90 - ratio * 78; // higher votes -> higher (top)
              const size = 30 + Math.min(p.traccion, 24) * 2.2;
              return (
                <Link
                  key={p.id}
                  href={`/post/${p.id}`}
                  aria-label={`${p.titulo}: ${p.votos} votos, ${p.comentarios} comentarios`}
                  title={`${p.titulo} · ${p.votos} votos · ${p.comentarios} comentarios`}
                  style={{
                    position: "absolute",
                    left: `${x}%`,
                    top: `${y}%`,
                    transform: "translate(-50%, -50%)",
                    width: `${size}px`,
                    height: `${size}px`,
                    borderRadius: "50%",
                    background: `${prioColor(p.prioridad)}d9`,
                    color: "#fff",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "11px",
                    fontWeight: 700,
                    border: "2px solid var(--dg-white)",
                    boxShadow: "var(--shadow-sm)",
                  }}
                >
                  {p.traccion}
                </Link>
              );
            })}
          </div>
          {/* X axis label */}
          <div style={{ textAlign: "right", fontSize: "11px", fontWeight: 700, color: "var(--fg-muted)", marginTop: "6px", letterSpacing: ".05em" }}>
            Urgencia (prioridad) →
          </div>
        </div>
      </div>

      <p style={{ fontSize: "11.5px", color: "var(--fg-muted)", margin: "10px 0 0" }}>
        Posición: urgencia = prioridad · impacto = votos recibidos. Tamaño y número = tracción
        (votos + comentarios).
      </p>
    </Card>
  );
}
