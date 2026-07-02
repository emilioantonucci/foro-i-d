import Link from "next/link";
import type { BibliotecaRow } from "@/lib/data/biblioteca";
import { nombreCategoria, tipoMaterialBySlug } from "@/lib/constants";
import Card from "@/components/ui/Card";

const fmtFecha = (iso: string | null, withTime = false): string => {
  if (!iso) return "—";
  if (!withTime) return new Date(`${iso.slice(0, 10)}T00:00:00`).toLocaleDateString("es-AR");
  // timestamptz: fijar el huso del equipo (en Vercel el server corre en UTC)
  return new Date(iso).toLocaleDateString("es-AR", {
    timeZone: "America/Argentina/Buenos_Aires",
  });
};

/**
 * Lista compacta del repositorio: una fila por publicación, el título
 * enlaza al post original. Densidad tipo tabla (no las cards del feed).
 */
export default function BibliotecaTable({ rows }: { rows: BibliotecaRow[] }) {
  return (
    <Card pad="none">
      <div className="dg-hscroll">
        <table className="dg-lb-table" style={{ minWidth: "760px" }}>
          <thead>
            <tr>
              <th>Título</th>
              <th>Tipo</th>
              <th>Temática</th>
              <th>Autor</th>
              <th>Fecha original</th>
              <th>Publicado</th>
              <th className="num">Interacción</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => {
              const tipo = tipoMaterialBySlug(r.tipo_material);
              return (
                <tr key={r.id}>
                  <td style={{ maxWidth: "340px" }}>
                    <Link
                      href={`/post/${r.id}`}
                      title={r.titulo}
                      style={{
                        display: "block",
                        fontWeight: 700,
                        color: "var(--fg-primary)",
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                      }}
                    >
                      {r.titulo}
                    </Link>
                  </td>
                  <td>
                    {tipo ? (
                      <span
                        style={{
                          display: "inline-flex",
                          borderRadius: "var(--radius-pill)",
                          padding: "2px 9px",
                          fontSize: "11.5px",
                          fontWeight: 700,
                          whiteSpace: "nowrap",
                          color: tipo.color,
                          background: `${tipo.color}1A`,
                        }}
                      >
                        {tipo.nombre}
                      </span>
                    ) : (
                      <span style={{ color: "var(--fg-muted)" }}>—</span>
                    )}
                  </td>
                  <td style={{ whiteSpace: "nowrap", color: "var(--fg-secondary)" }}>
                    {r.categoria ? nombreCategoria(r.categoria) : "—"}
                  </td>
                  <td style={{ whiteSpace: "nowrap", color: "var(--fg-secondary)" }}>
                    {r.autor_nombre ?? "Colaborador"}
                  </td>
                  <td style={{ whiteSpace: "nowrap", color: "var(--fg-secondary)" }}>
                    {fmtFecha(r.fecha_original)}
                  </td>
                  <td style={{ whiteSpace: "nowrap", color: "var(--fg-secondary)" }}>
                    {fmtFecha(r.created_at, true)}
                  </td>
                  <td className="num" style={{ fontWeight: 700 }}>
                    {r.interaccion}
                    <span
                      style={{
                        display: "block",
                        fontSize: "10.5px",
                        fontWeight: 500,
                        color: "var(--fg-muted)",
                      }}
                    >
                      {r.votos_count} votos · {r.comentarios_count} coment.
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
