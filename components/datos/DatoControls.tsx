import Link from "next/link";
import { X } from "lucide-react";
import { DATO_TIPOS, nombreDatoTipo } from "@/lib/constants";
import type { DatoSort } from "@/lib/data/datos";

const SORTS: { key: DatoSort; label: string }[] = [
  { key: "recientes", label: "Recientes" },
  { key: "mas_gustados", label: "Más gustados" },
  { key: "mas_comentados", label: "Más comentados" },
];

type Params = Record<string, string | undefined>;

function buildHref(base: Params, override: Params): string {
  const merged: Params = { ...base, ...override };
  const sp = new URLSearchParams();
  Object.entries(merged).forEach(([k, v]) => {
    if (v) sp.set(k, v);
  });
  const qs = sp.toString();
  return `/datos${qs ? `?${qs}` : ""}`;
}

export default function DatoControls({
  sort,
  tipo,
  q,
}: {
  sort: DatoSort;
  tipo?: string;
  q?: string;
}) {
  const base: Params = { sort, tipo, q };
  return (
    <div>
      <div
        role="tablist"
        aria-label="Ordenar datos"
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
          aria-label="Filtrar por tipo"
        >
          <Link
            href={buildHref(base, { tipo: undefined })}
            className={`dg-chip ${!tipo ? "dg-chip--active" : ""}`.trim()}
            aria-current={!tipo ? "true" : undefined}
          >
            Todos
          </Link>
          {DATO_TIPOS.map((t) => (
            <Link
              key={t.slug}
              href={buildHref(base, { tipo: t.slug })}
              className={`dg-chip ${tipo === t.slug ? "dg-chip--active" : ""}`.trim()}
              aria-current={tipo === t.slug ? "true" : undefined}
            >
              {t.nombre}
            </Link>
          ))}
        </div>
      </div>

      {tipo && (
        <div style={{ marginTop: "-8px", marginBottom: "14px" }}>
          <Link
            href={buildHref({ sort, q }, { tipo: undefined })}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "5px",
              fontSize: "12.5px",
              color: "var(--fg-secondary)",
              fontWeight: 600,
            }}
          >
            <X size={13} aria-hidden="true" /> Quitar filtro: {nombreDatoTipo(tipo)}
          </Link>
        </div>
      )}
    </div>
  );
}
