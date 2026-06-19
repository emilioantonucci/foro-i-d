import { prioridadBySlug, estadoBySlug, nombreCategoria } from "@/lib/constants";
import Badge from "./Badge";

export function Semaphore({ prioridad }: { prioridad: string }) {
  const p = prioridadBySlug(prioridad);
  if (!p) return null;
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "6px",
        fontSize: "11.5px",
        fontWeight: 700,
        color: "var(--fg-secondary)",
        whiteSpace: "nowrap",
      }}
    >
      <span className="dg-badge__dot" style={{ background: p.color }} />
      Prioridad {p.nombre.toLowerCase()}
    </span>
  );
}

export function StatusBadge({ estado }: { estado: string }) {
  const e = estadoBySlug(estado);
  if (!e) return null;
  return <Badge color={e.color}>{e.nombre}</Badge>;
}

export function CategoryPill({ categoria }: { categoria: string | null }) {
  if (!categoria) return null;
  return <Badge variant="subtle">{nombreCategoria(categoria)}</Badge>;
}

export function Hashtags({ etiquetas }: { etiquetas: string[] }) {
  if (!etiquetas?.length) return null;
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", marginTop: "10px" }}>
      {etiquetas.map((t) => (
        <span key={t} style={{ fontSize: "12px", color: "#6B9000", fontWeight: 600 }}>
          #{t.replace(/^#/, "")}
        </span>
      ))}
    </div>
  );
}
