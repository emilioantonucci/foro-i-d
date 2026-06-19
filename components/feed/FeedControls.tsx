import Link from "next/link";
import { X } from "lucide-react";
import { CATEGORIAS, nombreCategoria } from "@/lib/constants";
import type { FeedSort } from "@/lib/data/posts";

const SORTS: { key: FeedSort; label: string }[] = [
  { key: "recientes", label: "Recientes" },
  { key: "mas_votadas", label: "Más votadas" },
  { key: "mas_comentadas", label: "Más comentadas" },
  { key: "alta_prioridad", label: "Alta prioridad" },
];

type Params = Record<string, string | undefined>;

function buildHref(base: Params, override: Params): string {
  const merged: Params = { ...base, ...override };
  const sp = new URLSearchParams();
  Object.entries(merged).forEach(([k, v]) => {
    if (v) sp.set(k, v);
  });
  const qs = sp.toString();
  return `/radar${qs ? `?${qs}` : ""}`;
}

export default function FeedControls({
  sort,
  categoria,
  q,
}: {
  sort: FeedSort;
  categoria?: string;
  q?: string;
}) {
  const base: Params = { sort, categoria, q };
  return (
    <div>
      <div
        role="tablist"
        aria-label="Ordenar publicaciones"
        style={{ display: "flex", gap: "6px", marginBottom: "14px", flexWrap: "wrap" }}
      >
        {SORTS.map((s) => {
          const active = s.key === sort;
          return (
            <Link
              key={s.key}
              href={buildHref(base, { sort: s.key })}
              className={`dg-tab ${active ? "dg-tab--active" : ""}`.trim()}
              role="tab"
              aria-selected={active}
            >
              {s.label}
            </Link>
          );
        })}
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "18px" }}>
        <div
          className="dg-hscroll"
          style={{ display: "flex", gap: "8px", paddingBottom: "6px", flex: 1 }}
          aria-label="Filtrar por categoría"
        >
          <Link
            href={buildHref(base, { categoria: undefined })}
            className={`dg-chip ${!categoria ? "dg-chip--active" : ""}`.trim()}
            aria-current={!categoria ? "true" : undefined}
          >
            Todas
          </Link>
          {CATEGORIAS.map((c) => (
            <Link
              key={c.slug}
              href={buildHref(base, { categoria: c.slug })}
              className={`dg-chip ${categoria === c.slug ? "dg-chip--active" : ""}`.trim()}
              aria-current={categoria === c.slug ? "true" : undefined}
            >
              {c.nombre}
            </Link>
          ))}
        </div>
      </div>

      {categoria && (
        <div style={{ marginTop: "-8px", marginBottom: "14px" }}>
          <Link
            href={buildHref({ sort, q }, { categoria: undefined })}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "5px",
              fontSize: "12.5px",
              color: "var(--fg-secondary)",
              fontWeight: 600,
            }}
          >
            <X size={13} aria-hidden="true" /> Quitar filtro: {nombreCategoria(categoria)}
          </Link>
        </div>
      )}
    </div>
  );
}
