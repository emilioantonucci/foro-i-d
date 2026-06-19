"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Sparkles, Copy, Check, Save } from "lucide-react";
import { saveAiOutputAction } from "@/app/(app)/actions";
import type { DebateSynthesis } from "@/lib/types";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";

const box: React.CSSProperties = {
  background: "var(--dg-gray-50)",
  border: "1px solid var(--border-default)",
  borderRadius: "var(--radius-md)",
  padding: "12px 14px",
};
const boxLabel: React.CSSProperties = {
  fontSize: "11px",
  fontWeight: 700,
  textTransform: "uppercase",
  letterSpacing: ".06em",
  color: "#6B9000",
  marginBottom: "6px",
};

export default function AiSynthesis({ postId }: { postId: string }) {
  const router = useRouter();
  const toast = useToast();
  const [data, setData] = useState<DebateSynthesis | null>(null);
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);
  const [copied, setCopied] = useState(false);
  const [savePending, startSave] = useTransition();

  async function generate() {
    setLoading(true);
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
      toast.error(e instanceof Error ? e.message : "Error al generar la síntesis.");
    } finally {
      setLoading(false);
    }
  }

  function save() {
    if (!data) return;
    startSave(async () => {
      const r = await saveAiOutputAction("sintesis", data, postId);
      if (r.error) {
        toast.error(r.error);
      } else {
        setSaved(true);
        toast.success("Síntesis guardada · +30 puntos");
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
    <Card pad="lg">
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "10px",
          flexWrap: "wrap",
          marginBottom: data ? "14px" : 0,
        }}
      >
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "7px",
            fontFamily: "var(--font-secondary)",
            fontWeight: 700,
            fontSize: "15px",
            color: "var(--fg-primary)",
          }}
        >
          <Sparkles size={16} color="#6B9000" aria-hidden="true" /> Síntesis IA del debate
        </div>
        <Button
          variant="secondary"
          size="sm"
          onClick={generate}
          loading={loading}
          icon={!loading ? <Sparkles size={14} color="#99CC06" aria-hidden="true" /> : undefined}
        >
          {loading ? "Generando…" : data ? "Regenerar" : "Generar síntesis"}
        </Button>
      </div>

      {data && (
        <>
          <div className="dg-grid-halves" style={{ gap: "10px" }}>
            <div style={box}>
              <div style={boxLabel}>Puntos de consenso</div>
              <p style={{ margin: 0, fontSize: "13px", color: "var(--dg-gray-700)", lineHeight: 1.5 }}>
                {data.consenso || "—"}
              </p>
            </div>
            <div style={box}>
              <div style={{ ...boxLabel, color: "var(--dg-warning-dark)" }}>Puntos de tensión</div>
              <p style={{ margin: 0, fontSize: "13px", color: "var(--dg-gray-700)", lineHeight: 1.5 }}>
                {data.tension || "—"}
              </p>
            </div>
            <div style={box}>
              <div style={boxLabel}>Próximas acciones</div>
              <ul style={{ margin: 0, paddingLeft: "16px", fontSize: "13px", color: "var(--dg-gray-700)", lineHeight: 1.5 }}>
                {data.proximasAcciones.map((a, i) => (
                  <li key={i}>{a}</li>
                ))}
              </ul>
            </div>
            <div
              style={{
                ...box,
                background: "rgba(153,204,6,0.12)",
                border: "1px solid rgba(153,204,6,0.35)",
              }}
            >
              <div style={boxLabel}>Decisión recomendada</div>
              <p style={{ margin: 0, fontSize: "13px", color: "var(--fg-primary)", lineHeight: 1.5, fontWeight: 600 }}>
                {data.decisionRecomendada || "—"}
              </p>
            </div>
          </div>

          {data.argumentos.length > 0 && (
            <div style={{ marginTop: "12px" }}>
              <div style={boxLabel}>Argumentos</div>
              <ul style={{ margin: 0, paddingLeft: "16px", fontSize: "13px", color: "var(--fg-secondary)", lineHeight: 1.5 }}>
                {data.argumentos.map((a, i) => (
                  <li key={i}>{a}</li>
                ))}
              </ul>
            </div>
          )}

          <div style={{ display: "flex", gap: "8px", marginTop: "14px", flexWrap: "wrap" }}>
            <Button
              size="sm"
              onClick={save}
              loading={savePending}
              disabled={saved}
              icon={saved ? <Check size={14} aria-hidden="true" /> : <Save size={14} aria-hidden="true" />}
            >
              {saved ? "Guardada (+30)" : "Guardar síntesis (+30)"}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={copy}
              icon={copied ? <Check size={14} aria-hidden="true" /> : <Copy size={14} aria-hidden="true" />}
            >
              {copied ? "Copiado" : "Copiar"}
            </Button>
          </div>
          <p style={{ fontSize: "11.5px", color: "var(--fg-muted)", margin: "10px 0 0" }}>
            Generada por IA · validá antes de difundir.
          </p>
        </>
      )}
    </Card>
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
