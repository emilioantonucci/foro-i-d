"use client";

import { useState } from "react";
import { Sparkles, Plus, X, Trash2 } from "lucide-react";
import { POLL_LIMITS, type PollInput } from "@/lib/validation";
import type { PollSuggestion } from "@/lib/types";
import Accordion from "@/components/ui/Accordion";
import Button from "@/components/ui/Button";
import { Input } from "@/components/ui/Field";
import { useToast } from "@/components/ui/Toast";

interface PollEditorProps {
  value: PollInput | null;
  onChange: (v: PollInput | null) => void;
  /** Sugerencia del análisis IA del recurso (si el usuario ya analizó). */
  suggestion?: PollSuggestion | null;
  /** Contexto para generar con IA on-demand (POST /api/ai/engage). */
  titulo: string;
  resumen?: string;
}

/**
 * Editor de encuesta opcional (2 a 4 opciones, estilo Instagram) dentro de un
 * acordeón colapsado: por defecto la publicación sale SIN encuesta.
 */
export default function PollEditor({
  value,
  onChange,
  suggestion,
  titulo,
  resumen,
}: PollEditorProps) {
  const toast = useToast();
  const [generating, setGenerating] = useState(false);

  const poll = value;

  function start(base?: PollSuggestion | null) {
    onChange({
      pregunta: base?.pregunta?.slice(0, POLL_LIMITS.pregunta) ?? "",
      opciones: (base?.opciones?.length ? base.opciones : ["", ""])
        .slice(0, POLL_LIMITS.maxOpciones)
        .map((o) => o.slice(0, POLL_LIMITS.opcion)),
    });
  }

  async function generarConIA() {
    // Si el análisis del recurso ya trajo una sugerencia, usarla sin gastar
    // otra llamada al free tier.
    if (suggestion?.pregunta && (suggestion.opciones?.length ?? 0) >= 2) {
      start(suggestion);
      return;
    }
    if (titulo.trim().length < 5) {
      toast.error("Completá el título antes de generar la encuesta con IA.");
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
      if (!res.ok || !json.ok) throw new Error(json.error ?? "No se pudo generar la encuesta.");
      const enc = json.data?.encuesta as PollSuggestion | null;
      if (!enc?.pregunta || (enc.opciones?.length ?? 0) < 2) {
        throw new Error("La IA no sugirió una encuesta para este contenido. Creala manualmente.");
      }
      start(enc);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Error al generar la encuesta.");
    } finally {
      setGenerating(false);
    }
  }

  function setPregunta(v: string) {
    if (poll) onChange({ ...poll, pregunta: v });
  }
  function setOpcion(i: number, v: string) {
    if (!poll) return;
    const opciones = poll.opciones.slice();
    opciones[i] = v;
    onChange({ ...poll, opciones });
  }
  function addOpcion() {
    if (poll && poll.opciones.length < POLL_LIMITS.maxOpciones) {
      onChange({ ...poll, opciones: [...poll.opciones, ""] });
    }
  }
  function removeOpcion(i: number) {
    if (poll && poll.opciones.length > 2) {
      onChange({ ...poll, opciones: poll.opciones.filter((_, idx) => idx !== i) });
    }
  }

  return (
    <Accordion
      title="Encuesta (opcional)"
      subtitle="Una votación rápida estilo red social, de 2 a 4 opciones."
      badge={
        poll ? (
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
            Encuesta lista
          </span>
        ) : undefined
      }
    >
      {!poll ? (
        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
          <Button type="button" variant="secondary" size="sm" onClick={() => start()}>
            <Plus size={14} aria-hidden="true" /> Crear manualmente
          </Button>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={generarConIA}
            loading={generating}
            icon={!generating ? <Sparkles size={14} color="#99CC06" aria-hidden="true" /> : undefined}
          >
            {generating ? "Generando…" : "Generar con IA"}
          </Button>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          <div>
            <label
              htmlFor="poll-pregunta"
              style={{ display: "block", fontSize: "12.5px", fontWeight: 700, marginBottom: "5px", color: "var(--fg-primary)" }}
            >
              Pregunta
            </label>
            <Input
              id="poll-pregunta"
              value={poll.pregunta}
              maxLength={POLL_LIMITS.pregunta}
              onChange={(e) => setPregunta(e.target.value)}
              placeholder="¿Qué opinás sobre…?"
            />
          </div>

          {poll.opciones.map((op, i) => (
            <div key={i} style={{ display: "flex", gap: "8px", alignItems: "center" }}>
              <Input
                aria-label={`Opción ${i + 1}`}
                value={op}
                maxLength={POLL_LIMITS.opcion}
                onChange={(e) => setOpcion(i, e.target.value)}
                placeholder={`Opción ${i + 1}`}
                style={{ flex: 1 }}
              />
              {poll.opciones.length > 2 && (
                <button
                  type="button"
                  onClick={() => removeOpcion(i)}
                  aria-label={`Quitar opción ${i + 1}`}
                  style={{ background: "none", border: "none", padding: "4px", display: "flex", cursor: "pointer" }}
                >
                  <X size={15} color="var(--fg-muted)" aria-hidden="true" />
                </button>
              )}
            </div>
          ))}

          <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
            {poll.opciones.length < POLL_LIMITS.maxOpciones && (
              <Button type="button" variant="ghost" size="sm" onClick={addOpcion}>
                <Plus size={14} aria-hidden="true" /> Agregar opción
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
              {generating ? "Generando…" : "Regenerar con IA"}
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => onChange(null)}
              icon={<Trash2 size={14} aria-hidden="true" />}
            >
              Quitar encuesta
            </Button>
          </div>
        </div>
      )}
    </Accordion>
  );
}
