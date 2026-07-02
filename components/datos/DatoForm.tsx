"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { X } from "lucide-react";
import { DATO_TIPOS } from "@/lib/constants";
import { createDatoAction } from "@/app/(app)/actions";
import { DATO_LIMITS, type PollInput } from "@/lib/validation";
import { PUNTOS } from "@/lib/points";
import type { LinkSummary, PollSuggestion } from "@/lib/types";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Field, { Input, Textarea, Select } from "@/components/ui/Field";
import { useToast } from "@/components/ui/Toast";
import SourceInput, { type SourceFile, type SourceKind } from "@/components/publish/SourceInput";
import PollEditor from "@/components/engage/PollEditor";

function isValidUrl(value: string): boolean {
  try {
    new URL(value);
    return true;
  } catch {
    return false;
  }
}

export default function DatoForm() {
  const router = useRouter();
  const toast = useToast();
  const [titulo, setTitulo] = useState("");
  const [tipo, setTipo] = useState("otro");
  const [url, setUrl] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [etiquetas, setEtiquetas] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [file, setFile] = useState<SourceFile | null>(null);
  const [encuesta, setEncuesta] = useState<PollInput | null>(null);
  const [pollSuggestion, setPollSuggestion] = useState<PollSuggestion | null>(null);

  const [submitting, setSubmitting] = useState(false);
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [attempted, setAttempted] = useState(false);

  const show = (k: string) => touched[k] || attempted;
  const tituloError =
    show("titulo") && titulo.trim().length < 5
      ? "El título es muy corto (mínimo 5 caracteres)."
      : undefined;
  const urlError =
    show("url") && url.trim() !== "" && !isValidUrl(url.trim())
      ? "Ingresá una URL válida (https://…)."
      : undefined;

  const canSubmit = titulo.trim().length >= 5 && (url.trim() === "" || isValidUrl(url.trim()));

  function addTag(t: string) {
    const clean = t.trim().replace(/^#/, "").replace(/\s+/g, "");
    if (clean && !etiquetas.includes(clean)) setEtiquetas([...etiquetas, clean]);
    setTagInput("");
  }

  function onAnalyzed(data: LinkSummary, source: SourceKind) {
    if (!titulo.trim() && data.titulo?.trim()) setTitulo(data.titulo.trim());
    if (data.resumen) setDescripcion(data.resumen);
    setEtiquetas((prev) =>
      Array.from(
        new Set([...prev, ...(data.etiquetasSugeridas ?? []).map((t) => t.replace(/^#/, ""))]),
      ),
    );
    // Sugerir el tipo según la fuente, sin pisar una elección explícita.
    if (tipo === "otro") {
      if (source === "youtube") setTipo("video");
      else if (source === "pdf" || source === "docx") setTipo("articulo");
    }
    if (data.encuestaSugerida?.pregunta) setPollSuggestion(data.encuestaSugerida);
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setAttempted(true);
    if (!canSubmit) {
      toast.error("Revisá los campos marcados antes de publicar.");
      return;
    }
    setSubmitting(true);
    const result = await createDatoAction({
      titulo,
      tipo,
      url,
      descripcion,
      etiquetas,
      archivo: file ?? undefined,
      encuesta: encuesta ?? undefined,
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
    <form onSubmit={onSubmit} style={{ maxWidth: "720px" }}>
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
        <div>
          <h1 className="dg-page-title" style={{ margin: 0 }}>
            Compartir un dato
          </h1>
          <p className="dg-page-sub" style={{ margin: "4px 0 0" }}>
            Algo distendido para el conocimiento general: un libro, un video, un dato curioso.
            <span style={{ color: "#6B9000", fontWeight: 600 }}> +{PUNTOS.publicar_dato} pts</span>
          </p>
        </div>
        <div style={{ display: "flex", gap: "8px" }}>
          <Button type="button" variant="ghost" size="sm" onClick={() => router.push("/datos")}>
            Cancelar
          </Button>
          <Button type="submit" size="sm" loading={submitting}>
            Publicar
          </Button>
        </div>
      </div>

      <Card pad="lg">
        <div style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
          <Field
            id="dato-titulo"
            label="Título"
            required
            error={tituloError}
            count={{ value: titulo.length, max: DATO_LIMITS.titulo }}
          >
            <Input
              value={titulo}
              maxLength={DATO_LIMITS.titulo}
              onChange={(e) => setTitulo(e.target.value)}
              onBlur={() => setTouched((t) => ({ ...t, titulo: true }))}
              placeholder="Ej.: «Sapiens», de Yuval Noah Harari"
            />
          </Field>

          <Field id="dato-tipo" label="Tipo">
            <Select value={tipo} onChange={(e) => setTipo(e.target.value)}>
              {DATO_TIPOS.map((t) => (
                <option key={t.slug} value={t.slug}>
                  {t.nombre}
                </option>
              ))}
            </Select>
          </Field>

          <SourceInput
            idPrefix="dato"
            label="Enlace (opcional)"
            url={url}
            onUrlChange={setUrl}
            onUrlBlur={() => setTouched((t) => ({ ...t, url: true }))}
            urlError={urlError}
            rawTextFallback={descripcion}
            file={file}
            onFileChange={setFile}
            onAnalyzed={onAnalyzed}
            analyzeLabel="IA"
          />

          <Field
            id="dato-descripcion"
            label="Descripción"
            hint="Contá de qué se trata y por qué te pareció interesante."
            count={{ value: descripcion.length, max: DATO_LIMITS.descripcion }}
          >
            <Textarea
              value={descripcion}
              rows={5}
              maxLength={DATO_LIMITS.descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
              placeholder="Una breve reseña, un resumen o el dato en sí."
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
                      style={{ background: "none", border: "none", padding: 0, display: "flex", cursor: "pointer" }}
                    >
                      <X size={13} color="var(--fg-muted)" aria-hidden="true" />
                    </button>
                  </span>
                ))}
              </div>
            )}
            <label htmlFor="dato-tag-input" className="sr-only">
              Añadir etiqueta
            </label>
            <Input
              id="dato-tag-input"
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

          <PollEditor
            value={encuesta}
            onChange={setEncuesta}
            suggestion={pollSuggestion}
            titulo={titulo}
            resumen={descripcion}
          />
        </div>
      </Card>
    </form>
  );
}
