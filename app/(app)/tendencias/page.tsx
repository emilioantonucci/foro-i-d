import { createClient } from "@/lib/supabase/server";
import OpportunityPanel from "@/components/trends/OpportunityPanel";
import ImpactUrgencyMatrix from "@/components/trends/ImpactUrgencyMatrix";
import { CategoryBars } from "@/components/dashboard/Charts";
import Card from "@/components/ui/Card";
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
      <h1 className="dg-page-title">Mapa de tendencias</h1>
      <p className="dg-page-sub">
        Del foro al radar estratégico — impacto × urgencia y oportunidades emergentes.
      </p>

      <div className="dg-two-col--wide-rail">
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <ImpactUrgencyMatrix posts={traccion} />
          <Card pad="lg">
            <div className="dg-section-label" style={{ marginBottom: "14px" }}>
              Distribución por categoría
            </div>
            <CategoryBars data={categorias} />
          </Card>
        </div>

        <OpportunityPanel />
      </div>
    </div>
  );
}
