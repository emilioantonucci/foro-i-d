import Link from "next/link";
import { getDashboardData } from "@/lib/data/dashboard";
import { DonutChart, CategoryBars } from "@/components/dashboard/Charts";
import { nombreCategoria } from "@/lib/constants";
import Card from "@/components/ui/Card";
import Avatar from "@/components/ui/Avatar";

function Kpi({ value, label, sub }: { value: number | string; label: string; sub?: string }) {
  return (
    <Card pad="md">
      <div style={{ fontFamily: "var(--font-secondary)", fontSize: "30px", fontWeight: 700, color: "var(--fg-primary)", lineHeight: 1 }}>
        {value}
      </div>
      <div style={{ fontSize: "13px", color: "var(--fg-secondary)", marginTop: "6px", fontWeight: 600 }}>
        {label}
      </div>
      {sub && <div style={{ fontSize: "12px", color: "#6B9000", marginTop: "2px" }}>{sub}</div>}
    </Card>
  );
}

export default async function PanelPage() {
  const d = await getDashboardData();

  return (
    <div>
      <h1 className="dg-page-title">Panel ejecutivo</h1>
      <p className="dg-page-sub">Métricas de participación e impacto para Dirección.</p>

      {/* KPIs */}
      <div className="dg-grid-kpis" style={{ marginBottom: "18px" }}>
        <Kpi value={d.usuariosRegistrados} label="Usuarios registrados" />
        <Kpi value={d.pulso.usuarios_activos} label="Usuarios activos" sub="últimos 7 días" />
        <Kpi
          value={d.publicacionesTotales}
          label="Publicaciones totales"
          sub={`+${d.pulso.publicaciones} esta semana`}
        />
        <Kpi value={d.insumosGenerados} label="Insumos IA generados" sub="síntesis · oportunidad · brief" />
      </div>

      <div className="dg-grid-halves" style={{ marginBottom: "16px" }}>
        <Card pad="md">
          <div className="dg-section-label" style={{ marginBottom: "14px" }}>
            Estado del contenido
          </div>
          <DonutChart data={d.porEstado} />
        </Card>
        <Card pad="md">
          <div className="dg-section-label" style={{ marginBottom: "14px" }}>
            Categorías más activas
          </div>
          <CategoryBars data={d.porCategoria.slice(0, 6)} />
        </Card>
      </div>

      <div className="dg-grid-halves">
        <Card pad="md">
          <div className="dg-section-label" style={{ marginBottom: "14px" }}>
            Temas con mayor tracción
          </div>
          {d.traccion.length === 0 ? (
            <p style={{ fontSize: "13px", color: "var(--fg-muted)", margin: 0 }}>Sin tracción aún.</p>
          ) : (
            d.traccion.map((t) => (
              <Link
                key={t.id}
                href={`/post/${t.id}`}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                  padding: "8px 0",
                  borderBottom: "1px solid var(--dg-gray-100)",
                }}
              >
                <span style={{ flex: 1, minWidth: 0 }}>
                  <span
                    style={{
                      display: "block",
                      fontSize: "13.5px",
                      fontWeight: 700,
                      color: "var(--fg-primary)",
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                    }}
                  >
                    {t.titulo}
                  </span>
                  <span style={{ fontSize: "11.5px", color: "var(--fg-muted)" }}>
                    {nombreCategoria(t.categoria)}
                  </span>
                </span>
                <span style={{ fontSize: "12px", color: "#6B9000", fontWeight: 700, flex: "none" }}>
                  ↑{t.votos} · 💬{t.comentarios}
                </span>
              </Link>
            ))
          )}
        </Card>

        <Card pad="md">
          <div className="dg-section-label" style={{ marginBottom: "14px" }}>
            Mayor contribución
          </div>
          {d.topContribuyentes.length === 0 ? (
            <p style={{ fontSize: "13px", color: "var(--fg-muted)", margin: 0 }}>Sin participación aún.</p>
          ) : (
            d.topContribuyentes.map((u, i) => (
              <Link
                key={u.id}
                href={`/perfil/${u.id}`}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                  padding: "8px 0",
                  borderBottom: "1px solid var(--dg-gray-100)",
                }}
              >
                <span style={{ width: "18px", fontSize: "12px", fontWeight: 700, color: "var(--fg-muted)" }}>
                  {i + 1}
                </span>
                <Avatar name={u.nombre} size={30} title={u.nombre ?? "Colaborador"} />
                <span style={{ flex: 1, minWidth: 0 }}>
                  <span style={{ display: "block", fontSize: "13.5px", fontWeight: 700, color: "var(--fg-primary)" }}>
                    {u.nombre ?? "Colaborador"}
                  </span>
                  <span style={{ fontSize: "11.5px", color: "#6B9000" }}>{u.rango}</span>
                </span>
                <span style={{ fontSize: "13px", fontWeight: 700, color: "var(--dg-gray-700)" }}>{u.puntos}</span>
              </Link>
            ))
          )}
        </Card>
      </div>
    </div>
  );
}
