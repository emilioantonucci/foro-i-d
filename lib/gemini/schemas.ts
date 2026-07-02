import { z } from "zod";

// Defaults make the schemas tolerant to minor model omissions (MVP resilience).

export const PollSuggestionSchema = z.object({
  pregunta: z.string().default(""),
  opciones: z.array(z.string()).default([]),
});

export const LinkSummarySchema = z.object({
  titulo: z.string().default(""),
  resumen: z.string().default(""),
  ideasClave: z.array(z.string()).default([]),
  aplicacionIyD: z.string().default(""),
  riesgos: z.array(z.string()).default([]),
  etiquetasSugeridas: z.array(z.string()).default([]),
  categoriaSugerida: z.string().default(""),
  // Sugerencias de interacción (encuesta + preguntas disparadoras). Vienen en
  // la misma llamada para no gastar cuota extra del free tier.
  encuestaSugerida: PollSuggestionSchema.nullish().default(null),
  preguntasSugeridas: z.array(z.string()).default([]),
  // Biblioteca de links: fecha de publicación del recurso original y tipo de
  // material. .catch() tolera valores fuera de forma (el form los re-valida).
  fechaOriginal: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .nullish()
    .default(null)
    .catch(null),
  tipoMaterial: z.string().default("").catch(""),
});

/** Respuesta de /api/ai/engage (encuesta + preguntas on-demand). */
export const EngagementSchema = z.object({
  encuesta: PollSuggestionSchema.nullish().default(null),
  preguntas: z.array(z.string()).default([]),
});

export const DebateSynthesisSchema = z.object({
  argumentos: z.array(z.string()).default([]),
  consenso: z.string().default(""),
  tension: z.string().default(""),
  proximasAcciones: z.array(z.string()).default([]),
  decisionRecomendada: z.string().default(""),
});

/** Corta por palabras: el "candado" duro del límite de 1500 del digest. */
function truncarPalabras(s: string, max: number): string {
  const palabras = s.trim().split(/\s+/);
  return palabras.length <= max ? s.trim() : `${palabras.slice(0, max).join(" ")}…`;
}

/** Resumen semanal IA (/api/ai/digest). El prompt pide 1200 palabras; acá se
 *  garantiza el tope duro de 1500 y el largo apto para wa.me del corto. */
export const WeeklyDigestSchema = z.object({
  titulo: z.string().default("Resumen semanal de I+D").catch("Resumen semanal de I+D"),
  narrativa: z
    .string()
    .default("")
    .catch("")
    .transform((s) => truncarPalabras(s, 1500)),
  destacados: z
    .array(z.string())
    .default([])
    .catch([])
    .transform((a) => a.slice(0, 6)),
  resumenCorto: z
    .string()
    .default("")
    .catch("")
    .transform((s) => s.slice(0, 700)),
});

/** Respuesta del clasificador batch de tipo de material (backfill). */
export const MaterialClassificationSchema = z.object({
  clasificaciones: z
    .array(
      z.object({
        id: z.string().default(""),
        tipoMaterial: z.string().default(""),
      }),
    )
    .default([])
    .catch([]),
});

export const BriefSchema = z.object({
  tituloOportunidad: z.string().default(""),
  contexto: z.string().default(""),
  evidenciaInterna: z.array(z.string()).default([]),
  hipotesisMercado: z.string().default(""),
  aplicacionAcademica: z.string().default(""),
  aplicacionComercial: z.string().default(""),
  riesgos: z.array(z.string()).default([]),
  proximosPasos: z.array(z.string()).default([]),
});
