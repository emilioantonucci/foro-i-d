"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Sparkles, Loader2, Check, Save } from "lucide-react";
import { saveAiOutputAction } from "@/app/(app)/actions";
import type { OpportunityReport, Opportunity } from "@/lib/types";

export default function OpportunityPanel() {
  const router = useRouter();
  const [report, setReport] = useState<OpportunityReport | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState<Set<number>>(new Set());
  const [pending, startTransition] = useTransition();

  async function generate() {
    setLoading(true);
    setError(null);
    try {
      const r = await fetch("/api/ai/opportunities", { method: "POST" });
      const j = await r.json();
      if (!r.ok || !j.ok) throw new Error(j.error ?? "No se pudieron detectar oportunidades.");
      setReport(j.data);
      setSaved(new Set());
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error al detectar oportunidades.");
    } finally {
      setLoading(false);
    }
  }

  function saveOne(op: Opportunity, idx: number) {
    startTransition(async () => {
      const r = await saveAiOutputAction("oportunidad", op);
      if (!r.error) {
        setSaved((prev) => new Set(prev).add(idx));
        router.refresh();
      } else {
        setError(r.error);
      }
    });
  }

  return (
    <div style={{ background: "#262626", borderRadius: "14px", padding: "20px", color: "#fff" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "10px", marginBottom: report ? "14px" : 0 }}>
        <div style={{ fontSize: "11px", letterSpacing: ".1em", textTransform: "uppercase", color: "#99CC06", fontWeight: 700 }}>
          Oportunidades detectadas por IA
        </div>
        <button onClick={generate} disabled={loading} className="dg-btn dg-btn--primary" style={{ fontSize: "12.5px" }}>
          {loading ? <Loader2 size={14} className="spin" /> : <Sparkles size={14} />}
          {loading ? "Analizando…" : report ? "Volver a analizar" : "Detectar"}
        </button>
      </div>

      <p style={{ fontSize: "12.5px", color: "rgba(255,255,255,0.7)", lineHeight: 1.5, margin: report ? "0 0 14px" : "10px 0 0" }}>
        Analiza las publicaciones internas recientes y propone líneas emergentes. Solo usa datos internos de la app.
      </p>

      {error && <p style={{ color: "#FF9A9C", fontSize: "12.5px", margin: "10px 0 0" }}>{error}</p>}

      {report && (
        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          {report.oportunidades.map((op, i) => (
            <div key={i} style={{ background: "rgba(255,255,255,0.06)", borderRadius: "10px", padding: "12px 14px" }}>
              <span style={{ display: "inline-block", background: "rgba(153,204,6,0.2)", color: "#bfe06a", borderRadius: "999px", padding: "2px 9px", fontSize: "10.5px", fontWeight: 700, marginBottom: "6px" }}>
                {op.tipo}
              </span>
              <div style={{ fontSize: "14px", fontWeight: 700, marginBottom: "4px" }}>{op.titulo}</div>
              <p style={{ fontSize: "12.5px", color: "rgba(255,255,255,0.8)", lineHeight: 1.5, margin: "0 0 10px" }}>{op.justificacion}</p>
              <button
                onClick={() => saveOne(op, i)}
                disabled={pending || saved.has(i)}
                className="dg-btn dg-btn--outline-light"
                style={{ fontSize: "12px", padding: "7px 14px" }}
              >
                {saved.has(i) ? <Check size={13} /> : <Save size={13} />} {saved.has(i) ? "Guardada (+40)" : "Guardar oportunidad (+40)"}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
