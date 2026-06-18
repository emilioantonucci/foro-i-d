import Link from "next/link";
import { CATEGORIAS } from "@/lib/constants";
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

const tab = (active: boolean): React.CSSProperties => ({
  padding: "7px 14px",
  borderRadius: "999px",
  fontSize: "13px",
  fontWeight: 700,
  background: active ? "#262626" : "#fff",
  color: active ? "#fff" : "#525252",
  border: active ? "1px solid #262626" : "1px solid #E8E8E8",
});

const chip = (active: boolean): React.CSSProperties => ({
  padding: "5px 12px",
  borderRadius: "999px",
  fontSize: "12.5px",
  fontWeight: 600,
  whiteSpace: "nowrap",
  background: active ? "#99CC06" : "#fff",
  color: active ? "#262626" : "#525252",
  border: active ? "1px solid #99CC06" : "1px solid #E8E8E8",
});

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
      <div style={{ display: "flex", gap: "6px", marginBottom: "14px", flexWrap: "wrap" }}>
        {SORTS.map((s) => (
          <Link key={s.key} href={buildHref(base, { sort: s.key })} style={tab(s.key === sort)}>
            {s.label}
          </Link>
        ))}
      </div>
      <div style={{ display: "flex", gap: "8px", overflowX: "auto", paddingBottom: "6px", marginBottom: "18px" }}>
        <Link href={buildHref(base, { categoria: undefined })} style={chip(!categoria)}>
          Todas
        </Link>
        {CATEGORIAS.map((c) => (
          <Link key={c.slug} href={buildHref(base, { categoria: c.slug })} style={chip(categoria === c.slug)}>
            {c.nombre}
          </Link>
        ))}
      </div>
    </div>
  );
}
