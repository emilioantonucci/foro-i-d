import { createClient } from "@/lib/supabase/server";
import OpportunityPanel from "@/components/trends/OpportunityPanel";
import ImpactUrgencyMatrix from "@/components/trends/ImpactUrgencyMatrix";
import { CategoryBars } from "@/components/dashboard/Charts";
import type { CountRow, TraccionRow } from "@/lib/data/dashboard";

export default async function TendenciasPage() {
  const supabase = await createClient();
  const [tracRes, catRes] = await Promise.all([
    supabase.from("v_posts_traccion").select("*").limit(12),
    supabase.from("v_posts_por_categoria").select("*"),
  ]);
  const traccion = ((tracRes.data ?? []) as TraccionRow[]).filter((t) => t.traccion > 0);
  const categorias = ((catRes.data ?? []) as CountRow[]).filter((c) => c.total > 0).slice(0, 8);

  return (
    <div>
      <h1 style={{ fontFamily: "'Poppins', sans-serif", fontSize: "22px", margin: "0 0 4px", color: "#262626", letterSpacing: "-0.01em" }}>
        Mapa de tendencias
      </h1>
      <p style={{ color: "#737373", fontSize: "14px", margin: "0 0 22px" }}>
        Del foro al radar estratégico — impacto × urgencia y oportunidades emergentes.
      </p>

      <div style={{ display: "grid", gridTemplateColumns: "minmax(0,1fr) 360px", gap: "18px", alignItems: "start" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <ImpactUrgencyMatrix posts={traccion} />
          <div style={{ background: "#fff", border: "1px solid #E8E8E8", borderRadius: "14px", padding: "20px" }}>
            <div style={{ fontSize: "11px", letterSpacing: ".1em", textTransform: "uppercase", color: "#AAAAB4", fontWeight: 700, marginBottom: "14px" }}>
              Distribución por categoría
            </div>
            <CategoryBars data={categorias} />
          </div>
        </div>

        <OpportunityPanel />
      </div>
    </div>
  );
}
