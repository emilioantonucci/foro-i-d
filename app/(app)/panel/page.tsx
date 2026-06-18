import Link from "next/link";
import { getDashboardData } from "@/lib/data/dashboard";
import { DonutChart, CategoryBars } from "@/components/dashboard/Charts";
import { nombreCategoria } from "@/lib/constants";
import { initials, avatarColor } from "@/lib/ui";

const card: React.CSSProperties = {
  background: "#fff",
  border: "1px solid #E8E8E8",
  borderRadius: "14px",
  padding: "18px 20px",
};
const sectionLabel: React.CSSProperties = {
  fontSize: "11px",
  letterSpacing: ".1em",
  textTransform: "uppercase",
  color: "#AAAAB4",
  fontWeight: 700,
  marginBottom: "14px",
};

function Kpi({ value, label, sub }: { value: number | string; label: string; sub?: string }) {
  return (
    <div style={card}>
      <div style={{ fontFamily: "'Poppins',sans-serif", fontSize: "30px", fontWeight: 700, color: "#262626", lineHeight: 1 }}>{value}</div>
      <div style={{ fontSize: "13px", color: "#525252", marginTop: "6px", fontWeight: 600 }}>{label}</div>
      {sub && <div style={{ fontSize: "12px", color: "#6b9000", marginTop: "2px" }}>{sub}</div>}
    </div>
  );
}

export default async function PanelPage() {
  const d = await getDashboardData();

  return (
    <div>
      <h1 style={{ fontFamily: "'Poppins', sans-serif", fontSize: "22px", margin: "0 0 4px", color: "#262626", letterSpacing: "-0.01em" }}>
        Panel ejecutivo
      </h1>
      <p style={{ color: "#737373", fontSize: "14px", margin: "0 0 22px" }}>
        Métricas de participación e impacto para Dirección.
      </p>

      {/* KPIs */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "14px", marginBottom: "18px" }}>
        <Kpi value={d.usuariosRegistrados} label="Usuarios registrados" />
        <Kpi value={d.pulso.usuarios_activos} label="Usuarios activos" sub="últimos 7 días" />
        <Kpi value={d.publicacionesTotales} label="Publicaciones totales" sub={`+${d.pulso.publicaciones} esta semana`} />
        <Kpi value={d.insumosGenerados} label="Insumos IA generados" sub="síntesis · oportunidad · brief" />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "16px" }}>
        <div style={card}>
          <div style={sectionLabel}>Estado del contenido</div>
          <DonutChart data={d.porEstado} />
        </div>
        <div style={card}>
          <div style={sectionLabel}>Categorías más activas</div>
          <CategoryBars data={d.porCategoria.slice(0, 6)} />
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
        <div style={card}>
          <div style={sectionLabel}>Temas con mayor tracción</div>
          {d.traccion.length === 0 ? (
            <p style={{ fontSize: "13px", color: "#AAAAB4", margin: 0 }}>Sin tracción aún.</p>
          ) : (
            d.traccion.map((t) => (
              <Link key={t.id} href={`/post/${t.id}`} style={{ display: "flex", alignItems: "center", gap: "10px", padding: "8px 0", borderBottom: "1px solid #F4F4F4" }}>
                <span style={{ flex: 1, minWidth: 0 }}>
                  <span style={{ display: "block", fontSize: "13.5px", fontWeight: 700, color: "#262626", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{t.titulo}</span>
                  <span style={{ fontSize: "11.5px", color: "#AAAAB4" }}>{nombreCategoria(t.categoria)}</span>
                </span>
                <span style={{ fontSize: "12px", color: "#6b9000", fontWeight: 700, flex: "none" }}>↑{t.votos} · 💬{t.comentarios}</span>
              </Link>
            ))
          )}
        </div>

        <div style={card}>
          <div style={sectionLabel}>Mayor contribución</div>
          {d.topContribuyentes.length === 0 ? (
            <p style={{ fontSize: "13px", color: "#AAAAB4", margin: 0 }}>Sin participación aún.</p>
          ) : (
            d.topContribuyentes.map((u, i) => (
              <Link key={u.id} href={`/perfil/${u.id}`} style={{ display: "flex", alignItems: "center", gap: "10px", padding: "8px 0", borderBottom: "1px solid #F4F4F4" }}>
                <span style={{ width: "18px", fontSize: "12px", fontWeight: 700, color: "#AAAAB4" }}>{i + 1}</span>
                <span style={{ width: "30px", height: "30px", borderRadius: "50%", background: avatarColor(u.nombre), color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: "11px", flex: "none" }}>{initials(u.nombre)}</span>
                <span style={{ flex: 1, minWidth: 0 }}>
                  <span style={{ display: "block", fontSize: "13.5px", fontWeight: 700, color: "#262626" }}>{u.nombre ?? "Colaborador"}</span>
                  <span style={{ fontSize: "11.5px", color: "#6b9000" }}>{u.rango}</span>
                </span>
                <span style={{ fontSize: "13px", fontWeight: 700, color: "#404040" }}>{u.puntos}</span>
              </Link>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
