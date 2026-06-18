"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Sparkles, Loader2, Copy, Check, Save } from "lucide-react";
import { saveAiOutputAction } from "@/app/(app)/actions";
import type { DebateSynthesis } from "@/lib/types";

const box: React.CSSProperties = {
  background: "#FAFAF8",
  border: "1px solid #EEEDE8",
  borderRadius: "10px",
  padding: "12px 14px",
};
const boxLabel: React.CSSProperties = {
  fontSize: "11px",
  fontWeight: 700,
  textTransform: "uppercase",
  letterSpacing: ".06em",
  color: "#6b9000",
  marginBottom: "6px",
};

export default function AiSynthesis({ postId }: { postId: string }) {
  const router = useRouter();
  const [data, setData] = useState<DebateSynthesis | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [copied, setCopied] = useState(false);
  const [savePending, startSave] = useTransition();

  async function generate() {
    setLoading(true);
    setError(null);
    try {
      const r = await fetch("/api/ai/synthesis", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ postId }),
      });
      const j = await r.json();
      if (!r.ok || !j.ok) throw new Error(j.error ?? "No se pudo generar la síntesis.");
      setData(j.data);
      setSaved(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error al generar la síntesis.");
    } finally {
      setLoading(false);
    }
  }

  function save() {
    if (!data) return;
    startSave(async () => {
      const r = await saveAiOutputAction("sintesis", data, postId);
      if (r.error) setError(r.error);
      else {
        setSaved(true);
        router.refresh();
      }
    });
  }

  function copy() {
    if (!data) return;
    navigator.clipboard.writeText(formatSynthesis(data));
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <div style={{ background: "#fff", border: "1px solid #E8E8E8", borderRadius: "14px", padding: "20px" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "10px", marginBottom: data ? "14px" : 0 }}>
        <div style={{ display: "inline-flex", alignItems: "center", gap: "7px", fontFamily: "'Poppins',sans-serif", fontWeight: 700, fontSize: "15px", color: "#262626" }}>
          <Sparkles size={16} color="#6b9000" /> Síntesis IA del debate
        </div>
        <button onClick={generate} disabled={loading} className="dg-btn dg-btn--secondary" style={{ fontSize: "12.5px" }}>
          {loading ? <Loader2 size={14} className="spin" /> : <Sparkles size={14} color="#99CC06" />}
          {loading ? "Generando…" : data ? "Regenerar" : "Generar síntesis"}
        </button>
      </div>

      {error && <p style={{ color: "#C62A2F", fontSize: "13px", margin: "10px 0 0" }}>{error}</p>}

      {data && (
        <>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
            <div style={box}>
              <div style={boxLabel}>Puntos de consenso</div>
              <p style={{ margin: 0, fontSize: "13px", color: "#404040", lineHeight: 1.5 }}>{data.consenso || "—"}</p>
            </div>
            <div style={box}>
              <div style={{ ...boxLabel, color: "#B45F06" }}>Puntos de tensión</div>
              <p style={{ margin: 0, fontSize: "13px", color: "#404040", lineHeight: 1.5 }}>{data.tension || "—"}</p>
            </div>
            <div style={box}>
              <div style={boxLabel}>Próximas acciones</div>
              <ul style={{ margin: 0, paddingLeft: "16px", fontSize: "13px", color: "#404040", lineHeight: 1.5 }}>
                {data.proximasAcciones.map((a, i) => <li key={i}>{a}</li>)}
              </ul>
            </div>
            <div style={{ ...box, background: "rgba(153,204,6,0.12)", border: "1px solid rgba(153,204,6,0.35)" }}>
              <div style={boxLabel}>Decisión recomendada</div>
              <p style={{ margin: 0, fontSize: "13px", color: "#262626", lineHeight: 1.5, fontWeight: 600 }}>{data.decisionRecomendada || "—"}</p>
            </div>
          </div>

          {data.argumentos.length > 0 && (
            <div style={{ marginTop: "12px" }}>
              <div style={boxLabel}>Argumentos</div>
              <ul style={{ margin: 0, paddingLeft: "16px", fontSize: "13px", color: "#525252", lineHeight: 1.5 }}>
                {data.argumentos.map((a, i) => <li key={i}>{a}</li>)}
              </ul>
            </div>
          )}

          <div style={{ display: "flex", gap: "8px", marginTop: "14px" }}>
            <button onClick={save} disabled={savePending || saved} className="dg-btn dg-btn--primary" style={{ fontSize: "12.5px", opacity: saved ? 0.6 : 1 }}>
              {saved ? <Check size={14} /> : <Save size={14} />}
              {saved ? "Guardada (+30)" : savePending ? "Guardando…" : "Guardar síntesis (+30)"}
            </button>
            <button onClick={copy} className="dg-btn dg-btn--ghost" style={{ fontSize: "12.5px" }}>
              {copied ? <Check size={14} /> : <Copy size={14} />} {copied ? "Copiado" : "Copiar"}
            </button>
          </div>
          <p style={{ fontSize: "11.5px", color: "#AAAAB4", margin: "10px 0 0" }}>
            Generada por IA · validá antes de difundir.
          </p>
        </>
      )}
    </div>
  );
}

function formatSynthesis(d: DebateSynthesis): string {
  return [
    "SÍNTESIS DEL DEBATE",
    `\nConsenso: ${d.consenso}`,
    `Tensión: ${d.tension}`,
    `\nArgumentos:\n- ${d.argumentos.join("\n- ")}`,
    `\nPróximas acciones:\n- ${d.proximasAcciones.join("\n- ")}`,
    `\nDecisión recomendada: ${d.decisionRecomendada}`,
  ].join("\n");
}
