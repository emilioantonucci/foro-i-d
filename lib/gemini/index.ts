import "server-only";
import type { ZodType } from "zod";
import { callGeminiJSON, geminiModelName, GeminiOutputError } from "./client";
import {
  LinkSummarySchema,
  DebateSynthesisSchema,
  OpportunityReportSchema,
  BriefSchema,
} from "./schemas";
import {
  summaryPrompt,
  synthesisPrompt,
  opportunitiesPrompt,
  briefPrompt,
} from "./prompts";
import type {
  LinkSummary,
  DebateSynthesis,
  OpportunityReport,
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

async function runStructured<T>(prompt: string, schema: ZodType<T>): Promise<T> {
  for (let attempt = 0; attempt < 2; attempt++) {
    const raw = await callGeminiJSON(prompt);
    try {
      return schema.parse(JSON.parse(stripFences(raw)));
    } catch {
      // retry once on parse/validation failure
    }
  }
  throw new GeminiOutputError("La IA devolvió un formato inesperado.");
}

export function generateSummary(input: {
  url?: string;
  rawText?: string;
}): Promise<LinkSummary> {
  return runStructured(summaryPrompt(input), LinkSummarySchema);
}

export function synthesizeDebate(input: {
  titulo: string;
  resumen?: string | null;
  comentarios: string[];
}): Promise<DebateSynthesis> {
  return runStructured(synthesisPrompt(input), DebateSynthesisSchema);
}

export function detectOpportunities(input: {
  posts: { titulo: string; resumen?: string | null; categoria?: string | null }[];
}): Promise<OpportunityReport> {
  return runStructured(opportunitiesPrompt(input), OpportunityReportSchema);
}

export function generateBrief(input: {
  posts: { titulo: string; resumen?: string | null; categoria?: string | null }[];
}): Promise<Brief> {
  return runStructured(briefPrompt(input), BriefSchema);
}
