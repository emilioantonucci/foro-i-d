"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { FileText, Loader2, Copy, Check, Save } from "lucide-react";
import { saveAiOutputAction } from "@/app/(app)/actions";
import type { Brief } from "@/lib/types";

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: "10px" }}>
      <div style={{ fontSize: "10.5px", fontWeight: 700, textTransform: "uppercase", letterSpacing: ".06em", color: "#6b9000", marginBottom: "3px" }}>{title}</div>
      <div style={{ fontSize: "12.5px", color: "#404040", lineHeight: 1.5 }}>{children}</div>
    </div>
  );
}

export default function BriefGenerator({ postId }: { postId: string }) {
  const router = useRouter();
  const [data, setData] = useState<Brief | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [saved, setSaved] = useState(false);
  const [savePending, startSave] = useTransition();

  async function generate() {
    setLoading(true);
    setError(null);
    try {
      const r = await fetch("/api/ai/brief", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ postIds: [postId] }),
      });
      const j = await r.json();
      if (!r.ok || !j.ok) throw new Error(j.error ?? "No se pudo generar el brief.");
      setData(j.data);
      setSaved(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error al generar el brief.");
    } finally {
      setLoading(false);
    }
  }

  function save() {
    if (!data) return;
    startSave(async () => {
      const r = await saveAiOutputAction("brief", data, postId);
      if (r.error) setError(r.error);
      else {
        setSaved(true);
        router.refresh();
      }
    });
  }

  function copy() {
    if (!data) return;
    navigator.clipboard.writeText(formatBrief(data));
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <div style={{ background: "#262626", borderRadius: "14px", padding: "18px", color: "#fff" }}>
      <div style={{ fontSize: "11px", letterSpacing: ".1em", textTransform: "uppercase", color: "#99CC06", fontWeight: 700, marginBottom: "10px" }}>
        Del link al proyecto
      </div>
      <button onClick={generate} disabled={loading} className="dg-btn dg-btn--primary" style={{ width: "100%", justifyContent: "center", fontSize: "13px" }}>
        {loading ? <Loader2 size={14} className="spin" /> : <FileText size={14} />}
        {loading ? "Generando…" : data ? "Regenerar brief" : "Generar brief de oportunidad"}
      </button>

      {error && <p style={{ color: "#FF9A9C", fontSize: "12px", margin: "10px 0 0" }}>{error}</p>}

      {data && (
        <div style={{ background: "#fff", borderRadius: "10px", padding: "14px", marginTop: "12px" }}>
          <div style={{ fontFamily: "'Poppins',sans-serif", fontWeight: 700, fontSize: "14px", color: "#262626", marginBottom: "10px" }}>
            {data.tituloOportunidad}
          </div>
          <Section title="Contexto">{data.contexto}</Section>
          <Section title="Evidencia interna">
            <ul style={{ margin: 0, paddingLeft: "16px" }}>{data.evidenciaInterna.map((e, i) => <li key={i}>{e}</li>)}</ul>
          </Section>
          <Section title="Hipótesis de mercado">{data.hipotesisMercado}</Section>
          <Section title="Aplicación académica">{data.aplicacionAcademica}</Section>
          <Section title="Aplicación comercial">{data.aplicacionComercial}</Section>
          <Section title="Riesgos">
            <ul style={{ margin: 0, paddingLeft: "16px" }}>{data.riesgos.map((e, i) => <li key={i}>{e}</li>)}</ul>
          </Section>
          <Section title="Próximos pasos">
            <ul style={{ margin: 0, paddingLeft: "16px" }}>{data.proximosPasos.map((e, i) => <li key={i}>{e}</li>)}</ul>
          </Section>

          <div style={{ display: "flex", gap: "8px", marginTop: "12px" }}>
            <button onClick={save} disabled={savePending || saved} className="dg-btn dg-btn--secondary" style={{ fontSize: "12px" }}>
              {saved ? <Check size={13} /> : <Save size={13} />} {saved ? "Guardado" : savePending ? "Guardando…" : "Guardar"}
            </button>
            <button onClick={copy} className="dg-btn dg-btn--outline" style={{ fontSize: "12px" }}>
              {copied ? <Check size={13} /> : <Copy size={13} />} {copied ? "Copiado" : "Copiar"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function formatBrief(d: Brief): string {
  return [
    `BRIEF — ${d.tituloOportunidad}`,
    `\nContexto: ${d.contexto}`,
    `\nEvidencia interna:\n- ${d.evidenciaInterna.join("\n- ")}`,
    `\nHipótesis de mercado: ${d.hipotesisMercado}`,
    `Aplicación académica: ${d.aplicacionAcademica}`,
    `Aplicación comercial: ${d.aplicacionComercial}`,
    `\nRiesgos:\n- ${d.riesgos.join("\n- ")}`,
    `\nPróximos pasos:\n- ${d.proximosPasos.join("\n- ")}`,
  ].join("\n");
}
