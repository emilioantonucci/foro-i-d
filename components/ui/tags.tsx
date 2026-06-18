import { prioridadBySlug, estadoBySlug, nombreCategoria } from "@/lib/constants";

const pill: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: "5px",
  padding: "3px 10px",
  borderRadius: "999px",
  fontSize: "11.5px",
  fontWeight: 700,
  whiteSpace: "nowrap",
};

export function Semaphore({ prioridad }: { prioridad: string }) {
  const p = prioridadBySlug(prioridad);
  if (!p) return null;
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: "6px", fontSize: "11.5px", fontWeight: 700, color: "#525252" }}>
      <span style={{ width: "9px", height: "9px", borderRadius: "50%", background: p.color }} />
      Prioridad {p.nombre.toLowerCase()}
    </span>
  );
}

export function StatusBadge({ estado }: { estado: string }) {
  const e = estadoBySlug(estado);
  if (!e) return null;
  return (
    <span style={{ ...pill, background: `${e.color}1F`, color: e.color }}>
      {e.nombre}
    </span>
  );
}

export function CategoryPill({ categoria }: { categoria: string | null }) {
  if (!categoria) return null;
  return (
    <span style={{ ...pill, background: "#F4F4F4", color: "#404040" }}>
      {nombreCategoria(categoria)}
    </span>
  );
}

export function Hashtags({ etiquetas }: { etiquetas: string[] }) {
  if (!etiquetas?.length) return null;
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", marginTop: "10px" }}>
      {etiquetas.map((t) => (
        <span key={t} style={{ fontSize: "12px", color: "#6b9000", fontWeight: 600 }}>
          #{t.replace(/^#/, "")}
        </span>
      ))}
    </div>
  );
}
