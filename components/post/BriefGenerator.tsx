"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { FileText, Copy, Check, Save } from "lucide-react";
import { saveAiOutputAction } from "@/app/(app)/actions";
import type { Brief } from "@/lib/types";
import Button from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: "10px" }}>
      <div
        style={{
          fontSize: "10.5px",
          fontWeight: 700,
          textTransform: "uppercase",
          letterSpacing: ".06em",
          color: "#6B9000",
          marginBottom: "3px",
        }}
      >
        {title}
      </div>
      <div style={{ fontSize: "12.5px", color: "var(--dg-gray-700)", lineHeight: 1.5 }}>
        {children}
      </div>
    </div>
  );
}

export default function BriefGenerator({ postId }: { postId: string }) {
  const router = useRouter();
  const toast = useToast();
  const [data, setData] = useState<Brief | null>(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [saved, setSaved] = useState(false);
  const [savePending, startSave] = useTransition();

  async function generate() {
    setLoading(true);
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
      toast.error(e instanceof Error ? e.message : "Error al generar el brief.");
    } finally {
      setLoading(false);
    }
  }

  function save() {
    if (!data) return;
    startSave(async () => {
      const r = await saveAiOutputAction("brief", data, postId);
      if (r.error) {
        toast.error(r.error);
      } else {
        setSaved(true);
        toast.success("Brief guardado");
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
    <div style={{ background: "var(--dg-black)", borderRadius: "var(--radius-lg)", padding: "18px", color: "var(--dg-white)" }}>
      <div
        style={{
          fontSize: "11px",
          letterSpacing: ".1em",
          textTransform: "uppercase",
          color: "var(--dg-green)",
          fontWeight: 700,
          marginBottom: "10px",
        }}
      >
        Del link al proyecto
      </div>
      <Button
        block
        size="sm"
        onClick={generate}
        loading={loading}
        icon={!loading ? <FileText size={14} aria-hidden="true" /> : undefined}
      >
        {loading ? "Generando…" : data ? "Regenerar brief" : "Generar brief de oportunidad"}
      </Button>

      {data && (
        <div style={{ background: "var(--dg-white)", borderRadius: "var(--radius-md)", padding: "14px", marginTop: "12px" }}>
          <div
            style={{
              fontFamily: "var(--font-secondary)",
              fontWeight: 700,
              fontSize: "14px",
              color: "var(--fg-primary)",
              marginBottom: "10px",
            }}
          >
            {data.tituloOportunidad}
          </div>
          <Section title="Contexto">{data.contexto}</Section>
          <Section title="Evidencia interna">
            <ul style={{ margin: 0, paddingLeft: "16px" }}>
              {data.evidenciaInterna.map((e, i) => (
                <li key={i}>{e}</li>
              ))}
            </ul>
          </Section>
          <Section title="Hipótesis de mercado">{data.hipotesisMercado}</Section>
          <Section title="Aplicación académica">{data.aplicacionAcademica}</Section>
          <Section title="Aplicación comercial">{data.aplicacionComercial}</Section>
          <Section title="Riesgos">
            <ul style={{ margin: 0, paddingLeft: "16px" }}>
              {data.riesgos.map((e, i) => (
                <li key={i}>{e}</li>
              ))}
            </ul>
          </Section>
          <Section title="Próximos pasos">
            <ul style={{ margin: 0, paddingLeft: "16px" }}>
              {data.proximosPasos.map((e, i) => (
                <li key={i}>{e}</li>
              ))}
            </ul>
          </Section>

          <div style={{ display: "flex", gap: "8px", marginTop: "12px", flexWrap: "wrap" }}>
            <Button
              variant="secondary"
              size="sm"
              onClick={save}
              loading={savePending}
              disabled={saved}
              icon={saved ? <Check size={13} aria-hidden="true" /> : <Save size={13} aria-hidden="true" />}
            >
              {saved ? "Guardado" : "Guardar"}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={copy}
              icon={copied ? <Check size={13} aria-hidden="true" /> : <Copy size={13} aria-hidden="true" />}
            >
              {copied ? "Copiado" : "Copiar"}
            </Button>
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
