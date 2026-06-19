import { z } from "zod";

// Defaults make the schemas tolerant to minor model omissions (MVP resilience).

export const LinkSummarySchema = z.object({
  titulo: z.string().default(""),
  resumen: z.string().default(""),
  ideasClave: z.array(z.string()).default([]),
  aplicacionIyD: z.string().default(""),
  riesgos: z.array(z.string()).default([]),
  etiquetasSugeridas: z.array(z.string()).default([]),
  categoriaSugerida: z.string().default(""),
});

export const DebateSynthesisSchema = z.object({
  argumentos: z.array(z.string()).default([]),
  consenso: z.string().default(""),
  tension: z.string().default(""),
  proximasAcciones: z.array(z.string()).default([]),
  decisionRecomendada: z.string().default(""),
});

export const OpportunitySchema = z.object({
  tipo: z.string().default(""),
  titulo: z.string().default(""),
  justificacion: z.string().default(""),
});

export const OpportunityReportSchema = z.object({
  oportunidades: z.array(OpportunitySchema).default([]),
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
