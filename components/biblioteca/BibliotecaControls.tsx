"use client";

import { useRef } from "react";
import Link from "next/link";
import { X } from "lucide-react";
import { CATEGORIAS, TIPOS_MATERIAL } from "@/lib/constants";
import type { BibliotecaSort } from "@/lib/data/biblioteca";
import { Input, Select } from "@/components/ui/Field";

const SORTS: { key: BibliotecaSort; label: string }[] = [
  { key: "recientes", label: "Recientes" },
  { key: "fecha_original", label: "Fecha del original" },
  { key: "interaccion", label: "Mayor interacción" },
];

export interface BibliotecaParams {
  sort: BibliotecaSort;
  q?: string;
  categoria?: string;
  tipo?: string;
  pub_desde?: string;
  pub_hasta?: string;
  orig_desde?: string;
  orig_hasta?: string;
}

function buildHref(base: BibliotecaParams, override: Partial<BibliotecaParams>): string {
  const merged = { ...base, ...override };
  const sp = new URLSearchParams();
  Object.entries(merged).forEach(([k, v]) => {
    if (v) sp.set(k, v);
  });
  const qs = sp.toString();
  return `/biblioteca${qs ? `?${qs}` : ""}`;
}

const label: React.CSSProperties = {
  display: "block",
  fontSize: "11.5px",
  fontWeight: 700,
  color: "var(--fg-secondary)",
  marginBottom: "4px",
};

/**
 * Filtros de la Biblioteca. Todo el estado vive en la URL (form GET), así
 * cualquier combinación de filtros es compartible y navegable.
 */
export default function BibliotecaControls({ params }: { params: BibliotecaParams }) {
  const formRef = useRef<HTMLFormElement>(null);
  const submit = () => formRef.current?.requestSubmit();
  const hasFilters = !!(
    params.q ||
    params.categoria ||
    params.tipo ||
    params.pub_desde ||
    params.pub_hasta ||
    params.orig_desde ||
    params.orig_hasta
  );

  return (
    <div style={{ marginBottom: "18px" }}>
      <div
        role="tablist"
        aria-label="Ordenar la biblioteca"
        style={{ display: "flex", gap: "6px", marginBottom: "14px", flexWrap: "wrap" }}
      >
        {SORTS.map((s) => {
          const active = s.key === params.sort;
          return (
            <Link
              key={s.key}
              href={buildHref(params, { sort: s.key })}
              className={`dg-tab ${active ? "dg-tab--active" : ""}`.trim()}
              role="tab"
              aria-selected={active}
            >
              {s.label}
            </Link>
          );
        })}
      </div>

      <form ref={formRef} method="get" action="/biblioteca">
        {/* el orden activo se conserva al filtrar */}
        <input type="hidden" name="sort" value={params.sort} />

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))",
            gap: "10px",
            alignItems: "end",
          }}
        >
          <div style={{ gridColumn: "1 / -1" }}>
            <label htmlFor="bib-q" style={label}>
              Buscar
            </label>
            <Input
              id="bib-q"
              name="q"
              type="search"
              defaultValue={params.q ?? ""}
              placeholder="Título o resumen…"
            />
          </div>

          <div>
            <label htmlFor="bib-categoria" style={label}>
              Temática
            </label>
            <Select
              id="bib-categoria"
              name="categoria"
              defaultValue={params.categoria ?? ""}
              onChange={submit}
            >
              <option value="">Todas</option>
              {CATEGORIAS.map((c) => (
                <option key={c.slug} value={c.slug}>
                  {c.nombre}
                </option>
              ))}
            </Select>
          </div>

          <div>
            <label htmlFor="bib-tipo" style={label}>
              Tipo de material
            </label>
            <Select id="bib-tipo" name="tipo" defaultValue={params.tipo ?? ""} onChange={submit}>
              <option value="">Todos</option>
              {TIPOS_MATERIAL.map((t) => (
                <option key={t.slug} value={t.slug}>
                  {t.nombre}
                </option>
              ))}
            </Select>
          </div>

          <div>
            <label htmlFor="bib-pub-desde" style={label}>
              Publicado en el foro — desde
            </label>
            <Input
              id="bib-pub-desde"
              name="pub_desde"
              type="date"
              defaultValue={params.pub_desde ?? ""}
              onChange={submit}
            />
          </div>
          <div>
            <label htmlFor="bib-pub-hasta" style={label}>
              Publicado en el foro — hasta
            </label>
            <Input
              id="bib-pub-hasta"
              name="pub_hasta"
              type="date"
              defaultValue={params.pub_hasta ?? ""}
              onChange={submit}
            />
          </div>

          <div>
            <label htmlFor="bib-orig-desde" style={label}>
              Fecha del original — desde
            </label>
            <Input
              id="bib-orig-desde"
              name="orig_desde"
              type="date"
              defaultValue={params.orig_desde ?? ""}
              onChange={submit}
            />
          </div>
          <div>
            <label htmlFor="bib-orig-hasta" style={label}>
              Fecha del original — hasta
            </label>
            <Input
              id="bib-orig-hasta"
              name="orig_hasta"
              type="date"
              defaultValue={params.orig_hasta ?? ""}
              onChange={submit}
            />
          </div>

          <div style={{ display: "flex", gap: "8px" }}>
            <button type="submit" className="dg-pagebtn" style={{ cursor: "pointer" }}>
              Filtrar
            </button>
          </div>
        </div>

        <p style={{ margin: "8px 0 0", fontSize: "11.5px", color: "var(--fg-muted)" }}>
          El filtro por fecha del original solo incluye publicaciones con esa fecha detectada.
        </p>
      </form>

      {hasFilters && (
        <div style={{ marginTop: "10px" }}>
          <Link
            href="/biblioteca"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "5px",
              fontSize: "12.5px",
              color: "var(--fg-secondary)",
              fontWeight: 600,
            }}
          >
            <X size={13} aria-hidden="true" /> Quitar todos los filtros
          </Link>
        </div>
      )}
    </div>
  );
}
