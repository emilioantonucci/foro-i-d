"use client";

import { useState, useTransition } from "react";
import { Sparkles, Check, Save } from "lucide-react";
import { saveAiOutputAction } from "@/app/(app)/actions";
import type { OpportunityReport, Opportunity } from "@/lib/types";
import Button from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";

export default function OpportunityPanel() {
  const toast = useToast();
  const [report, setReport] = useState<OpportunityReport | null>(null);
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState<Set<number>>(new Set());
  const [pending, startTransition] = useTransition();

  async function generate() {
    setLoading(true);
    try {
      const r = await fetch("/api/ai/opportunities", { method: "POST" });
      const j = await r.json();
      if (!r.ok || !j.ok) throw new Error(j.error ?? "No se pudieron detectar oportunidades.");
      setReport(j.data);
      setSaved(new Set());
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Error al detectar oportunidades.");
    } finally {
      setLoading(false);
    }
  }

  function saveOne(op: Opportunity, idx: number) {
    startTransition(async () => {
      const r = await saveAiOutputAction("oportunidad", op);
      if (!r.error) {
        setSaved((prev) => new Set(prev).add(idx));
        toast.success("Oportunidad guardada · +40 puntos");
      } else {
        toast.error(r.error);
      }
    });
  }

  return (
    <div
      className="dg-two-col__rail"
      style={{ background: "var(--dg-black)", borderRadius: "var(--radius-lg)", padding: "20px", color: "var(--dg-white)" }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: "10px",
          flexWrap: "wrap",
          marginBottom: report ? "14px" : 0,
        }}
      >
        <div
          style={{
            fontSize: "11px",
            letterSpacing: ".1em",
            textTransform: "uppercase",
            color: "var(--dg-green)",
            fontWeight: 700,
          }}
        >
          Oportunidades detectadas por IA
        </div>
        <Button
          size="sm"
          onClick={generate}
          loading={loading}
          icon={!loading ? <Sparkles size={14} aria-hidden="true" /> : undefined}
        >
          {loading ? "Analizando…" : report ? "Volver a analizar" : "Detectar"}
        </Button>
      </div>

      <p
        style={{
          fontSize: "12.5px",
          color: "rgba(255,255,255,0.7)",
          lineHeight: 1.5,
          margin: report ? "0 0 14px" : "10px 0 0",
        }}
      >
        Analiza las publicaciones internas recientes y propone líneas emergentes. Solo usa datos
        internos de la app.
      </p>

      {report && (
        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          {report.oportunidades.map((op, i) => (
            <div key={i} style={{ background: "rgba(255,255,255,0.06)", borderRadius: "var(--radius-md)", padding: "12px 14px" }}>
              <span
                style={{
                  display: "inline-block",
                  background: "rgba(153,204,6,0.2)",
                  color: "#BFE06A",
                  borderRadius: "var(--radius-pill)",
                  padding: "2px 9px",
                  fontSize: "10.5px",
                  fontWeight: 700,
                  marginBottom: "6px",
                }}
              >
                {op.tipo}
              </span>
              <div style={{ fontSize: "14px", fontWeight: 700, marginBottom: "4px" }}>{op.titulo}</div>
              <p style={{ fontSize: "12.5px", color: "rgba(255,255,255,0.8)", lineHeight: 1.5, margin: "0 0 10px" }}>
                {op.justificacion}
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => saveOne(op, i)}
                disabled={pending || saved.has(i)}
                icon={saved.has(i) ? <Check size={13} aria-hidden="true" /> : <Save size={13} aria-hidden="true" />}
                style={{ color: "var(--dg-white)", borderColor: "rgba(255,255,255,0.5)" }}
              >
                {saved.has(i) ? "Guardada (+40)" : "Guardar oportunidad (+40)"}
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
