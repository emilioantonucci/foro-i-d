"use client";

import { useState } from "react";
import { Sparkles, Plus, X } from "lucide-react";
import { PREGUNTAS_LIMITS } from "@/lib/validation";
import Accordion from "@/components/ui/Accordion";
import Button from "@/components/ui/Button";
import { Input } from "@/components/ui/Field";
import { useToast } from "@/components/ui/Toast";

interface QuestionsEditorProps {
  value: string[];
  onChange: (v: string[]) => void;
  /** Sugerencias del análisis IA del recurso (chips adoptables). */
  suggestions?: string[];
  /** Contexto para generar con IA on-demand (POST /api/ai/engage). */
  titulo: string;
  resumen?: string;
}

/**
 * Editor de preguntas disparadoras (máx 2) en un acordeón colapsado: por
 * defecto la publicación sale SIN preguntas — es una elección del autor.
 * Las preguntas elegidas se muestran destacadas en el post y se responden
 * por los comentarios normales.
 */
export default function QuestionsEditor({
  value,
  onChange,
  suggestions = [],
  titulo,
  resumen,
}: QuestionsEditorProps) {
  const toast = useToast();
  const [generating, setGenerating] = useState(false);
  const [aiSuggestions, setAiSuggestions] = useState<string[]>([]);

  const allSuggestions = Array.from(new Set([...suggestions, ...aiSuggestions])).filter(
    (s) => s.trim() && !value.includes(s),
  );
  const canAdd = value.length < PREGUNTAS_LIMITS.max;

  function adopt(q: string) {
    if (canAdd) onChange([...value, q.slice(0, PREGUNTAS_LIMITS.largo)]);
  }
  function setPregunta(i: number, v: string) {
    const next = value.slice();
    next[i] = v;
    onChange(next);
  }
  function remove(i: number) {
    onChange(value.filter((_, idx) => idx !== i));
  }

  async function generarConIA() {
    if (titulo.trim().length < 5) {
      toast.error("Completá el título antes de generar preguntas con IA.");
      return;
    }
    setGenerating(true);
    try {
      const res = await fetch("/api/ai/engage", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ titulo: titulo.trim(), resumen: resumen?.trim() || undefined }),
      });
      const json = await res.json();
      if (!res.ok || !json.ok) throw new Error(json.error ?? "No se pudieron generar preguntas.");
      const preguntas = (json.data?.preguntas ?? []) as string[];
      if (!preguntas.length) {
        throw new Error("La IA no sugirió preguntas para este contenido. Escribilas manualmente.");
      }
      setAiSuggestions(preguntas.slice(0, 4));
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Error al generar preguntas.");
    } finally {
      setGenerating(false);
    }
  }

  return (
    <Accordion
      title="Preguntas disparadoras (opcional)"
      subtitle={`Hasta ${PREGUNTAS_LIMITS.max} preguntas destacadas en el post para abrir el debate.`}
      badge={
        value.length > 0 ? (
          <span
            style={{
              fontSize: "11.5px",
              fontWeight: 700,
              color: "#6B9000",
              background: "rgba(153,204,6,0.12)",
              borderRadius: "var(--radius-pill)",
              padding: "3px 9px",
              flex: "none",
            }}
          >
            {value.length} {value.length === 1 ? "pregunta" : "preguntas"}
          </span>
        ) : undefined
      }
    >
      <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
        {value.map((q, i) => (
          <div key={i} style={{ display: "flex", gap: "8px", alignItems: "center" }}>
            <Input
              aria-label={`Pregunta ${i + 1}`}
              value={q}
              maxLength={PREGUNTAS_LIMITS.largo}
              onChange={(e) => setPregunta(i, e.target.value)}
              placeholder="¿Qué implicancias tiene esto para…?"
              style={{ flex: 1 }}
            />
            <button
              type="button"
              onClick={() => remove(i)}
              aria-label={`Quitar pregunta ${i + 1}`}
              style={{ background: "none", border: "none", padding: "4px", display: "flex", cursor: "pointer" }}
            >
              <X size={15} color="var(--fg-muted)" aria-hidden="true" />
            </button>
          </div>
        ))}

        {allSuggestions.length > 0 && canAdd && (
          <div>
            <div style={{ fontSize: "12px", color: "var(--fg-muted)", marginBottom: "6px" }}>
              Sugerencias de la IA — tocá para usar:
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
              {allSuggestions.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => adopt(s)}
                  style={{
                    textAlign: "left",
                    background: "rgba(153,204,6,0.10)",
                    border: "1px dashed rgba(153,204,6,0.50)",
                    borderRadius: "var(--radius-md)",
                    padding: "7px 11px",
                    fontSize: "12.5px",
                    color: "var(--fg-primary)",
                    cursor: "pointer",
                  }}
                >
                  + {s}
                </button>
              ))}
            </div>
          </div>
        )}

        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
          {canAdd && (
            <Button type="button" variant="ghost" size="sm" onClick={() => onChange([...value, ""])}>
              <Plus size={14} aria-hidden="true" /> Escribir pregunta
            </Button>
          )}
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={generarConIA}
            loading={generating}
            icon={!generating ? <Sparkles size={14} color="#99CC06" aria-hidden="true" /> : undefined}
          >
            {generating ? "Generando…" : "Sugerir con IA"}
          </Button>
        </div>
      </div>
    </Accordion>
  );
}
