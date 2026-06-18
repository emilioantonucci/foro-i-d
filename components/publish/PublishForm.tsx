"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Sparkles, X, Plus, AlertTriangle, Loader2 } from "lucide-react";
import { CATEGORIAS, PRIORIDADES, APLICACIONES_INTERNAS } from "@/lib/constants";
import { PUNTOS } from "@/lib/points";
import { createPostAction } from "@/app/(app)/actions";
import type { LinkSummary } from "@/lib/types";

const label: React.CSSProperties = { display: "block", fontSize: "13px", fontWeight: 700, color: "#404040", marginBottom: "6px" };
const input: React.CSSProperties = { width: "100%", padding: "10px 12px", border: "1px solid #E0DED9", borderRadius: "10px", fontSize: "14px", color: "#262626", outline: "none", background: "#fff" };
const field: React.CSSProperties = { marginBottom: "18px" };

export default function PublishForm() {
  const router = useRouter();
  const [url, setUrl] = useState("");
  const [titulo, setTitulo] = useState("");
  const [categoria, setCategoria] = useState("");
  const [prioridad, setPrioridad] = useState("media");
  const [resumen, setResumen] = useState("");
  const [relevancia, setRelevancia] = useState("");
  const [etiquetas, setEtiquetas] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [aplicaciones, setAplicaciones] = useState<string[]>([]);

  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [aiRiesgos, setAiRiesgos] = useState<string[]>([]);
  const [aiTags, setAiTags] = useState<string[]>([]);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const puntosEstimados = PUNTOS.publicar_enlace + (resumen.trim() ? PUNTOS.resumen_propio : 0);

  function addTag(t: string) {
    const clean = t.trim().replace(/^#/, "").replace(/\s+/g, "");
    if (clean && !etiquetas.includes(clean)) setEtiquetas([...etiquetas, clean]);
    setTagInput("");
  }
  function toggleAplicacion(a: string) {
    setAplicaciones((prev) => (prev.includes(a) ? prev.filter((x) => x !== a) : [...prev, a]));
  }

  async function analizarConIA() {
    if (!url.trim() && !resumen.trim()) {
      setAiError("Pegá una URL o un texto para analizar.");
      return;
    }
    setAiLoading(true);
    setAiError(null);
    try {
      const res = await fetch("/api/ai/summary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: url.trim(), rawText: resumen.trim() || undefined }),
      });
      const json = await res.json();
      if (!res.ok || !json.ok) throw new Error(json.error ?? "No se pudo analizar.");
      const data = json.data as LinkSummary;
      if (!titulo.trim() && data.resumen) setTitulo(deriveTitle(data));
      if (data.resumen) setResumen(data.resumen);
      if (data.aplicacionIyD) setRelevancia(data.aplicacionIyD);
      if (data.categoriaSugerida) {
        const match = CATEGORIAS.find(
          (c) => c.nombre.toLowerCase() === data.categoriaSugerida.toLowerCase(),
        );
        if (match) setCategoria(match.slug);
      }
      setEtiquetas((prev) =>
        Array.from(new Set([...prev, ...(data.etiquetasSugeridas ?? []).map((t) => t.replace(/^#/, ""))])),
      );
      setAiTags(data.etiquetasSugeridas ?? []);
      setAiRiesgos(data.riesgos ?? []);
    } catch (e) {
      setAiError(e instanceof Error ? e.message : "Error al analizar con IA.");
    } finally {
      setAiLoading(false);
    }
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!titulo.trim()) {
      setError("El título es obligatorio.");
      return;
    }
    setSubmitting(true);
    const result = await createPostAction({
      titulo,
      url,
      categoria,
      resumen,
      relevancia,
      etiquetas,
      prioridad,
      aplicacion_interna: aplicaciones,
    });
    // On success the action redirects; only errors return here.
    if (result?.error) {
      setError(result.error);
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={onSubmit}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "18px" }}>
        <h1 style={{ fontFamily: "'Poppins', sans-serif", fontSize: "22px", margin: 0, color: "#262626", letterSpacing: "-0.01em" }}>
          Publicar enlace
        </h1>
        <div style={{ display: "flex", gap: "8px" }}>
          <button type="button" onClick={() => router.push("/radar")} className="dg-btn dg-btn--ghost" style={{ fontSize: "13px" }}>
            Cancelar
          </button>
          <button type="submit" disabled={submitting} className="dg-btn dg-btn--primary" style={{ fontSize: "13px", opacity: submitting ? 0.7 : 1 }}>
            {submitting ? "Publicando…" : "Publicar"}
          </button>
        </div>
      </div>

      {error && (
        <div role="alert" style={{ background: "#FBEAEA", border: "1px solid #E9B7B8", color: "#980000", fontSize: "13px", borderRadius: "10px", padding: "10px 12px", marginBottom: "16px" }}>
          {error}
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "minmax(0,1fr) 320px", gap: "20px", alignItems: "start" }}>
        {/* MAIN FORM */}
        <div style={{ background: "#fff", border: "1px solid #E8E8E8", borderRadius: "14px", padding: "22px" }}>
          <div style={field}>
            <label style={label} htmlFor="url">URL del recurso</label>
            <div style={{ display: "flex", gap: "8px" }}>
              <input id="url" type="url" value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://…" style={{ ...input, flex: 1 }} />
              <button type="button" onClick={analizarConIA} disabled={aiLoading} className="dg-btn dg-btn--secondary" style={{ fontSize: "13px", whiteSpace: "nowrap" }}>
                {aiLoading ? <Loader2 size={15} className="spin" /> : <Sparkles size={15} color="#99CC06" />}
                {aiLoading ? "Analizando…" : "Analizar con IA"}
              </button>
            </div>
            {aiError && <p style={{ color: "#C62A2F", fontSize: "12px", margin: "6px 0 0" }}>{aiError}</p>}
          </div>

          <div style={field}>
            <label style={label} htmlFor="titulo">Título del recurso *</label>
            <input id="titulo" value={titulo} onChange={(e) => setTitulo(e.target.value)} required style={input} />
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", ...field }}>
            <div>
              <label style={label} htmlFor="categoria">Categoría</label>
              <select id="categoria" value={categoria} onChange={(e) => setCategoria(e.target.value)} style={input}>
                <option value="">Seleccioná…</option>
                {CATEGORIAS.map((c) => (
                  <option key={c.slug} value={c.slug}>{c.nombre}</option>
                ))}
              </select>
            </div>
            <div>
              <label style={label}>Prioridad</label>
              <div style={{ display: "flex", gap: "6px" }}>
                {PRIORIDADES.map((p) => (
                  <button
                    key={p.slug}
                    type="button"
                    onClick={() => setPrioridad(p.slug)}
                    title={p.nombre}
                    style={{
                      flex: 1,
                      padding: "9px 4px",
                      borderRadius: "9px",
                      border: prioridad === p.slug ? `2px solid ${p.color}` : "1px solid #E0DED9",
                      background: prioridad === p.slug ? `${p.color}1F` : "#fff",
                      fontSize: "11.5px",
                      fontWeight: 700,
                      color: "#404040",
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      gap: "4px",
                    }}
                  >
                    <span style={{ width: "10px", height: "10px", borderRadius: "50%", background: p.color }} />
                    {p.nombre}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div style={field}>
            <label style={label} htmlFor="resumen">Resumen breve</label>
            <textarea id="resumen" value={resumen} onChange={(e) => setResumen(e.target.value)} rows={4} placeholder="Síntesis del recurso (sumá uno propio para ganar puntos)" style={{ ...input, resize: "vertical" }} />
          </div>

          <div style={field}>
            <label style={label} htmlFor="relevancia">Por qué es relevante para I+D</label>
            <textarea id="relevancia" value={relevancia} onChange={(e) => setRelevancia(e.target.value)} rows={3} placeholder="Cómo se conecta con nuestra agenda de I+D" style={{ ...input, resize: "vertical" }} />
          </div>

          <div style={field}>
            <label style={label}>Etiquetas</label>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", marginBottom: "8px" }}>
              {etiquetas.map((t) => (
                <span key={t} style={{ display: "inline-flex", alignItems: "center", gap: "5px", background: "#F4F4F4", borderRadius: "999px", padding: "4px 10px", fontSize: "12.5px", fontWeight: 600, color: "#404040" }}>
                  #{t}
                  <button type="button" onClick={() => setEtiquetas(etiquetas.filter((x) => x !== t))} style={{ background: "none", border: "none", padding: 0, display: "flex", cursor: "pointer" }}>
                    <X size={12} color="#AAAAB4" />
                  </button>
                </span>
              ))}
            </div>
            <input
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === ",") {
                  e.preventDefault();
                  addTag(tagInput);
                }
              }}
              placeholder="Añadir etiqueta y Enter…"
              style={input}
            />
          </div>

          <div>
            <label style={label}>Posible aplicación interna</label>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
              {APLICACIONES_INTERNAS.map((a) => {
                const active = aplicaciones.includes(a);
                return (
                  <button
                    key={a}
                    type="button"
                    onClick={() => toggleAplicacion(a)}
                    style={{
                      padding: "7px 13px",
                      borderRadius: "999px",
                      fontSize: "12.5px",
                      fontWeight: 600,
                      border: active ? "1.5px solid #99CC06" : "1px solid #E0DED9",
                      background: active ? "rgba(153,204,6,0.12)" : "#fff",
                      color: "#404040",
                    }}
                  >
                    {a}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* RIGHT PANEL */}
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <div style={{ background: "#262626", borderRadius: "14px", padding: "18px", color: "#fff" }}>
            <div style={{ display: "inline-flex", alignItems: "center", gap: "6px", fontSize: "12px", fontWeight: 700, color: "#99CC06", marginBottom: "8px" }}>
              <Sparkles size={14} /> Análisis automático
            </div>
            <p style={{ fontSize: "12.5px", color: "rgba(255,255,255,0.75)", lineHeight: 1.5, margin: "0 0 12px" }}>
              La IA puede pre-rellenar resumen, etiquetas, aplicación y categoría. Revisá y ajustá antes de publicar.
            </p>
            {aiTags.length > 0 && (
              <div style={{ marginBottom: "12px" }}>
                <div style={{ fontSize: "11px", color: "rgba(255,255,255,0.6)", marginBottom: "6px" }}>Etiquetas sugeridas</div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                  {aiTags.map((t) => (
                    <span key={t} style={{ background: "rgba(255,255,255,0.1)", borderRadius: "999px", padding: "3px 9px", fontSize: "11.5px" }}>#{t.replace(/^#/, "")}</span>
                  ))}
                </div>
              </div>
            )}
            {aiRiesgos.length > 0 && (
              <div style={{ background: "rgba(198,42,47,0.18)", borderRadius: "10px", padding: "10px 12px" }}>
                <div style={{ display: "inline-flex", alignItems: "center", gap: "5px", fontSize: "11.5px", fontWeight: 700, color: "#FF9A9C", marginBottom: "4px" }}>
                  <AlertTriangle size={12} /> Riesgos / límites
                </div>
                <ul style={{ margin: 0, paddingLeft: "16px", fontSize: "12px", color: "rgba(255,255,255,0.85)", lineHeight: 1.5 }}>
                  {aiRiesgos.map((r, i) => <li key={i}>{r}</li>)}
                </ul>
              </div>
            )}
          </div>

          <div style={{ background: "rgba(153,204,6,0.10)", border: "1px solid rgba(153,204,6,0.30)", borderRadius: "14px", padding: "18px" }}>
            <div style={{ fontSize: "12px", fontWeight: 700, color: "#6b9000", marginBottom: "10px" }}>Puntos por este aporte</div>
            <Row label="Publicar enlace" pts={PUNTOS.publicar_enlace} />
            {resumen.trim() ? <Row label="Resumen propio" pts={PUNTOS.resumen_propio} /> : null}
            <div style={{ borderTop: "1px solid rgba(153,204,6,0.30)", marginTop: "8px", paddingTop: "8px", display: "flex", justifyContent: "space-between", fontWeight: 700, color: "#262626", fontSize: "13.5px" }}>
              <span>Total estimado</span>
              <span>+{puntosEstimados} pts</span>
            </div>
          </div>
        </div>
      </div>
    </form>
  );
}

function Row({ label, pts }: { label: string; pts: number }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px", color: "#404040", padding: "3px 0" }}>
      <span>{label}</span>
      <span style={{ fontWeight: 700 }}>+{pts}</span>
    </div>
  );
}

function deriveTitle(data: LinkSummary): string {
  const first = data.resumen.split(/[.\n]/)[0]?.trim() ?? "";
  return first.length > 80 ? first.slice(0, 77) + "…" : first;
}
