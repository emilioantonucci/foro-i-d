import "server-only";
import type { ZodType } from "zod";
import {
  callGeminiJSON,
  geminiModelName,
  GeminiOutputError,
  type GeminiPart,
  type GeminiCallOpts,
} from "./client";
import {
  LinkSummarySchema,
  EngagementSchema,
  DebateSynthesisSchema,
  WeeklyDigestSchema,
  MaterialClassificationSchema,
  BriefSchema,
} from "./schemas";
import {
  summaryPrompt,
  engagePrompt,
  synthesisPrompt,
  weeklyDigestPrompt,
  dailyDigestPrompt,
  classifyMaterialsPrompt,
  briefPrompt,
  type DigestPostInput,
  type DigestDatoInput,
} from "./prompts";
import type {
  LinkSummary,
  Engagement,
  DebateSynthesis,
  WeeklyDigest,
  Brief,
} from "@/lib/types";

export { geminiModelName };
export {
  GeminiConfigError,
  GeminiRequestError,
  GeminiOutputError,
} from "./client";

function stripFences(s: string): string {
  return s
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();
}

async function runStructured<T>(
  input: string | GeminiPart[],
  schema: ZodType<T>,
  opts?: GeminiCallOpts,
): Promise<T> {
  for (let attempt = 0; attempt < 2; attempt++) {
    const raw = await callGeminiJSON(input, opts);
    try {
      return schema.parse(JSON.parse(stripFences(raw)));
    } catch (e) {
      // Log why we're retrying (the raw is AI output, not user secrets) so a
      // persistent "formato inesperado" is debuggable instead of a black box.
      console.warn(
        `[gemini] parse/validación falló (intento ${attempt + 1}/2): ${
          e instanceof Error ? e.message : "error desconocido"
        } · raw: ${stripFences(raw).slice(0, 200)}`,
      );
    }
  }
  throw new GeminiOutputError("La IA devolvió un formato inesperado.");
}

export function generateSummary(input: {
  url?: string;
  rawText?: string;
  /** PDF subido, en base64 — viaja como inline_data (soporte nativo). */
  pdfBase64?: string;
  /** Video público de YouTube — viaja como file_data (soporte nativo). */
  youtubeUrl?: string;
  /** Marca que el rawText salió de un .docx (ajusta la consigna). */
  fromDocx?: boolean;
}): Promise<LinkSummary> {
  const source = input.pdfBase64
    ? "pdf"
    : input.youtubeUrl
      ? "youtube"
      : input.fromDocx
        ? "docx"
        : "web";
  const parts: GeminiPart[] = [
    { text: summaryPrompt({ url: input.url, rawText: input.rawText, source }) },
  ];
  if (input.pdfBase64) {
    parts.push({ inline_data: { mime_type: "application/pdf", data: input.pdfBase64 } });
  } else if (input.youtubeUrl) {
    parts.push({ file_data: { file_uri: input.youtubeUrl } });
  }
  const heavy = source === "pdf" || source === "youtube";
  // 4096: el schema extendido (encuesta + preguntas) más un documento largo
  // truncaban con el tope global de 2048.
  return runStructured(parts, LinkSummarySchema, {
    maxOutputTokens: 4096,
    ...(heavy ? { timeoutMs: 60_000 } : {}),
  });
}

export function generateEngagement(input: {
  titulo: string;
  resumen?: string;
}): Promise<Engagement> {
  return runStructured(engagePrompt(input), EngagementSchema);
}

export function synthesizeDebate(input: {
  titulo: string;
  resumen?: string | null;
  comentarios: string[];
}): Promise<DebateSynthesis> {
  return runStructured(synthesisPrompt(input), DebateSynthesisSchema);
}

export function generateWeeklyDigest(input: {
  posts: DigestPostInput[];
  desde: string;
  hasta: string;
}): Promise<WeeklyDigest> {
  // 1200 palabras ≈ 2500-3000 tokens: el tope default (2048) cortaría el JSON
  // a mitad de string y rompería el parse.
  return runStructured(weeklyDigestPrompt(input), WeeklyDigestSchema, {
    maxOutputTokens: 4096,
    timeoutMs: 60_000,
  });
}

export function generateDailyDigest(input: {
  posts: DigestPostInput[];
  datos: DigestDatoInput[];
  desde: string;
  hasta: string;
}): Promise<WeeklyDigest> {
  return runStructured(dailyDigestPrompt(input), WeeklyDigestSchema, {
    maxOutputTokens: 4096,
    timeoutMs: 60_000,
  });
}

export function classifyMaterials(input: {
  posts: { id: string; titulo: string; resumen?: string | null }[];
}): Promise<{ clasificaciones: { id: string; tipoMaterial: string }[] }> {
  return runStructured(classifyMaterialsPrompt(input), MaterialClassificationSchema);
}

export function generateBrief(input: {
  posts: { titulo: string; resumen?: string | null; categoria?: string | null }[];
}): Promise<Brief> {
  return runStructured(briefPrompt(input), BriefSchema);
}
