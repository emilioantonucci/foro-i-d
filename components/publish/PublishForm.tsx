"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Sparkles, X, AlertTriangle } from "lucide-react";
import { CATEGORIAS, PRIORIDADES, APLICACIONES_INTERNAS } from "@/lib/constants";
import { PUNTOS } from "@/lib/points";
import { createPostAction } from "@/app/(app)/actions";
import { PUBLISH_LIMITS, type PollInput } from "@/lib/validation";
import type { LinkSummary, PollSuggestion } from "@/lib/types";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Field, { Input, Textarea, Select } from "@/components/ui/Field";
import { useToast } from "@/components/ui/Toast";
import SourceInput, { type SourceFile } from "@/components/publish/SourceInput";
import PollEditor from "@/components/engage/PollEditor";
import QuestionsEditor from "@/components/engage/QuestionsEditor";

function isValidUrl(value: string): boolean {
  try {
    new URL(value);
    return true;
  } catch {
    return false;
  }
}

export default function PublishForm() {
  const router = useRouter();
  const toast = useToast();
  const [url, setUrl] = useState("");
  const [titulo, setTitulo] = useState("");
  const [categoria, setCategoria] = useState("");
  const [prioridad, setPrioridad] = useState("media");
  const [resumen, setResumen] = useState("");
  const [relevancia, setRelevancia] = useState("");
  const [etiquetas, setEtiquetas] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [aplicaciones, setAplicaciones] = useState<string[]>([]);
  const [file, setFile] = useState<SourceFile | null>(null);

  const [aiRiesgos, setAiRiesgos] = useState<string[]>([]);
  const [aiTags, setAiTags] = useState<string[]>([]);
  const [encuesta, setEncuesta] = useState<PollInput | null>(null);
  const [pollSuggestion, setPollSuggestion] = useState<PollSuggestion | null>(null);
  const [preguntas, setPreguntas] = useState<string[]>([]);
  const [questionSuggestions, setQuestionSuggestions] = useState<string[]>([]);

  const [submitting, setSubmitting] = useState(false);
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [attempted, setAttempted] = useState(false);

  const puntosEstimados = PUNTOS.publicar_enlace + (resumen.trim() ? PUNTOS.resumen_propio : 0);

  const show = (k: string) => touched[k] || attempted;
  const tituloError =
    show("titulo") && titulo.trim().length < 5
      ? "El título es muy corto (mínimo 5 caracteres)."
      : undefined;
  const urlError =
    show("url") && url.trim() !== "" && !isValidUrl(url.trim())
      ? "Ingresá una URL válida (https://…)."
      : undefined;
  const categoriaError =
    show("categoria") && !categoria ? "Elegí una categoría." : undefined;

  const canSubmit =
    titulo.trim().length >= 5 && (url.trim() === "" || isValidUrl(url.trim())) && !!categoria;

  function addTag(t: string) {
    const clean = t.trim().replace(/^#/, "").replace(/\s+/g, "");
    if (clean && !etiquetas.includes(clean)) setEtiquetas([...etiquetas, clean]);
    setTagInput("");
  }
  function toggleAplicacion(a: string) {
    setAplicaciones((prev) => (prev.includes(a) ? prev.filter((x) => x !== a) : [...prev, a]));
  }

  function onAnalyzed(data: LinkSummary) {
    if (!titulo.trim()) {
      const aiTitle = data.titulo.trim();
      if (aiTitle) setTitulo(aiTitle);
      else if (data.resumen) setTitulo(deriveTitle(data));
    }
    if (data.resumen) setResumen(data.resumen);
    if (data.aplicacionIyD) setRelevancia(data.aplicacionIyD);
    if (data.categoriaSugerida) {
      const match = CATEGORIAS.find(
        (c) => c.nombre.toLowerCase() === data.categoriaSugerida.toLowerCase(),
      );
      if (match) setCategoria(match.slug);
    }
    setEtiquetas((prev) =>
      Array.from(
        new Set([...prev, ...(data.etiquetasSugeridas ?? []).map((t) => t.replace(/^#/, ""))]),
      ),
    );
    setAiTags(data.etiquetasSugeridas ?? []);
    setAiRiesgos(data.riesgos ?? []);
    if (data.encuestaSugerida?.pregunta) setPollSuggestion(data.encuestaSugerida);
    if (data.preguntasSugeridas?.length) setQuestionSuggestions(data.preguntasSugeridas);
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setAttempted(true);
    if (!canSubmit) {
      toast.error("Revisá los campos marcados antes de publicar.");
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
      archivo: file ?? undefined,
      encuesta: encuesta ?? undefined,
      preguntas,
    });
    // On success the action redirects; only errors return here.
    if (result?.error) {
      toast.error(result.error);
      setSubmitting(false);
    }
  }

  const labelStyle: React.CSSProperties = {
    display: "block",
    fontSize: "13px",
    fontWeight: 700,
    color: "var(--fg-primary)",
    marginBottom: "6px",
  };

  return (
    <form onSubmit={onSubmit}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: "12px",
          flexWrap: "wrap",
          marginBottom: "18px",
        }}
      >
        <h1 className="dg-page-title" style={{ margin: 0 }}>
          Publicar enlace
        </h1>
        <div style={{ display: "flex", gap: "8px" }}>
          <Button type="button" variant="ghost" size="sm" onClick={() => router.push("/radar")}>
            Cancelar
          </Button>
          <Button type="submit" size="sm" loading={submitting}>
            Publicar
          </Button>
        </div>
      </div>

      <div className="dg-two-col--wide-rail">
        {/* MAIN FORM */}
        <Card pad="lg">
          <div style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
            <SourceInput
              idPrefix="publish"
              url={url}
              onUrlChange={setUrl}
              onUrlBlur={() => setTouched((t) => ({ ...t, url: true }))}
              urlError={urlError}
              rawTextFallback={resumen}
              file={file}
              onFileChange={setFile}
              onAnalyzed={onAnalyzed}
            />

            <Field
              id="titulo"
              label="Título del recurso"
              required
              error={tituloError}
              count={{ value: titulo.length, max: PUBLISH_LIMITS.titulo }}
            >
              <Input
                value={titulo}
                maxLength={PUBLISH_LIMITS.titulo}
                onChange={(e) => setTitulo(e.target.value)}
                onBlur={() => setTouched((t) => ({ ...t, titulo: true }))}
                placeholder="Un título claro y descriptivo"
              />
            </Field>

            <div className="dg-grid-halves">
              <Field id="categoria" label="Categoría" required error={categoriaError}>
                <Select
                  value={categoria}
                  onChange={(e) => setCategoria(e.target.value)}
                  onBlur={() => setTouched((t) => ({ ...t, categoria: true }))}
                >
                  <option value="">Seleccioná…</option>
                  {CATEGORIAS.map((c) => (
                    <option key={c.slug} value={c.slug}>
                      {c.nombre}
                    </option>
                  ))}
                </Select>
              </Field>

              <div>
                <span style={labelStyle}>Prioridad</span>
                <div style={{ display: "flex", gap: "6px" }} role="group" aria-label="Prioridad">
                  {PRIORIDADES.map((p) => {
                    const active = prioridad === p.slug;
                    return (
                      <button
                        key={p.slug}
                        type="button"
                        onClick={() => setPrioridad(p.slug)}
                        aria-pressed={active}
                        title={p.nombre}
                        style={{
                          flex: 1,
                          padding: "9px 4px",
                          borderRadius: "var(--radius-md)",
                          border: active ? `2px solid ${p.color}` : "1px solid var(--border-default)",
                          background: active ? `${p.color}1F` : "var(--dg-white)",
                          fontSize: "11.5px",
                          fontWeight: 700,
                          color: "var(--fg-primary)",
                          cursor: "pointer",
                          display: "flex",
                          flexDirection: "column",
                          alignItems: "center",
                          gap: "4px",
                        }}
                      >
                        <span style={{ width: "10px", height: "10px", borderRadius: "50%", background: p.color }} />
                        {p.nombre}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            <Field
              id="resumen"
              label="Resumen breve"
              hint="Sumá un resumen propio para ganar puntos."
              count={{ value: resumen.length, max: PUBLISH_LIMITS.resumen }}
            >
              <Textarea
                value={resumen}
                rows={4}
                maxLength={PUBLISH_LIMITS.resumen}
                onChange={(e) => setResumen(e.target.value)}
                placeholder="Síntesis del recurso"
              />
            </Field>

            <Field
              id="relevancia"
              label="Por qué es relevante para I+D"
              count={{ value: relevancia.length, max: PUBLISH_LIMITS.relevancia }}
            >
              <Textarea
                value={relevancia}
                rows={3}
                maxLength={PUBLISH_LIMITS.relevancia}
                onChange={(e) => setRelevancia(e.target.value)}
                placeholder="Cómo se conecta con nuestra agenda de I+D"
              />
            </Field>

            <div>
              <span style={labelStyle}>Etiquetas</span>
              {etiquetas.length > 0 && (
                <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", marginBottom: "8px" }}>
                  {etiquetas.map((t) => (
                    <span
                      key={t}
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "5px",
                        background: "var(--dg-gray-100)",
                        borderRadius: "var(--radius-pill)",
                        padding: "4px 6px 4px 10px",
                        fontSize: "12.5px",
                        fontWeight: 600,
                        color: "var(--dg-gray-700)",
                      }}
                    >
                      #{t}
                      <button
                        type="button"
                        onClick={() => setEtiquetas(etiquetas.filter((x) => x !== t))}
                        aria-label={`Quitar etiqueta ${t}`}
                        style={{
                          background: "none",
                          border: "none",
                          padding: 0,
                          display: "flex",
                          cursor: "pointer",
                        }}
                      >
                        <X size={13} color="var(--fg-muted)" aria-hidden="true" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
              <label htmlFor="tag-input" className="sr-only">
                Añadir etiqueta
              </label>
              <Input
                id="tag-input"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === ",") {
                    e.preventDefault();
                    addTag(tagInput);
                  }
                }}
                placeholder="Escribí una etiqueta y presioná Enter…"
              />
            </div>

            <div>
              <span style={labelStyle}>Posible aplicación interna</span>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                {APLICACIONES_INTERNAS.map((a) => {
                  const active = aplicaciones.includes(a);
                  return (
                    <button
                      key={a}
                      type="button"
                      onClick={() => toggleAplicacion(a)}
                      aria-pressed={active}
                      style={{
                        padding: "7px 13px",
                        borderRadius: "var(--radius-pill)",
                        fontSize: "12.5px",
                        fontWeight: 600,
                        cursor: "pointer",
                        border: active ? "1.5px solid #99CC06" : "1px solid var(--border-default)",
                        background: active ? "rgba(153,204,6,0.12)" : "var(--dg-white)",
                        color: "var(--fg-primary)",
                      }}
                    >
                      {a}
                    </button>
                  );
                })}
              </div>
            </div>

            <PollEditor
              value={encuesta}
              onChange={setEncuesta}
              suggestion={pollSuggestion}
              titulo={titulo}
              resumen={resumen}
            />

            <QuestionsEditor
              value={preguntas}
              onChange={setPreguntas}
              suggestions={questionSuggestions}
              titulo={titulo}
              resumen={resumen}
            />
          </div>
        </Card>

        {/* RIGHT PANEL */}
        <div className="dg-two-col__rail" style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <div style={{ background: "var(--dg-black)", borderRadius: "var(--radius-lg)", padding: "18px", color: "var(--dg-white)" }}>
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                fontSize: "12px",
                fontWeight: 700,
                color: "var(--dg-green)",
                marginBottom: "8px",
              }}
            >
              <Sparkles size={14} aria-hidden="true" /> Análisis automático
            </div>
            <p style={{ fontSize: "12.5px", color: "rgba(255,255,255,0.75)", lineHeight: 1.5, margin: "0 0 12px" }}>
              La IA puede pre-rellenar resumen, etiquetas, aplicación y categoría. Revisá y ajustá
              antes de publicar.
            </p>
            {aiTags.length > 0 && (
              <div style={{ marginBottom: "12px" }}>
                <div style={{ fontSize: "11px", color: "rgba(255,255,255,0.6)", marginBottom: "6px" }}>
                  Etiquetas sugeridas
                </div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                  {aiTags.map((t) => (
                    <span
                      key={t}
                      style={{
                        background: "rgba(255,255,255,0.1)",
                        borderRadius: "var(--radius-pill)",
                        padding: "3px 9px",
                        fontSize: "11.5px",
                      }}
                    >
                      #{t.replace(/^#/, "")}
                    </span>
                  ))}
                </div>
              </div>
            )}
            {aiRiesgos.length > 0 && (
              <div style={{ background: "rgba(198,42,47,0.18)", borderRadius: "var(--radius-md)", padding: "10px 12px" }}>
                <div
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "5px",
                    fontSize: "11.5px",
                    fontWeight: 700,
                    color: "#FF9A9C",
                    marginBottom: "4px",
                  }}
                >
                  <AlertTriangle size={12} aria-hidden="true" /> Riesgos / límites
                </div>
                <ul style={{ margin: 0, paddingLeft: "16px", fontSize: "12px", color: "rgba(255,255,255,0.85)", lineHeight: 1.5 }}>
                  {aiRiesgos.map((r, i) => (
                    <li key={i}>{r}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          <Card pad="md" accent>
            <div style={{ fontSize: "12px", fontWeight: 700, color: "#6B9000", marginBottom: "10px" }}>
              Puntos por este aporte
            </div>
            <Row label="Publicar enlace" pts={PUNTOS.publicar_enlace} />
            {resumen.trim() ? <Row label="Resumen propio" pts={PUNTOS.resumen_propio} /> : null}
            <div
              style={{
                borderTop: "1px solid rgba(153,204,6,0.30)",
                marginTop: "8px",
                paddingTop: "8px",
                display: "flex",
                justifyContent: "space-between",
                fontWeight: 700,
                color: "var(--fg-primary)",
                fontSize: "13.5px",
              }}
            >
              <span>Total estimado</span>
              <span>+{puntosEstimados} pts</span>
            </div>
          </Card>
        </div>
      </div>
    </form>
  );
}

function Row({ label, pts }: { label: string; pts: number }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px", color: "var(--dg-gray-700)", padding: "3px 0" }}>
      <span>{label}</span>
      <span style={{ fontWeight: 700 }}>+{pts}</span>
    </div>
  );
}

function deriveTitle(data: LinkSummary): string {
  const first = data.resumen.split(/[.\n]/)[0]?.trim() ?? "";
  return first.length > 80 ? first.slice(0, 77) + "…" : first;
}
