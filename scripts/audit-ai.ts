/**
 * Auditoría de modelos Gemini (free tier) para Radar I+D.
 *
 * Qué hace:
 *  1. Lista los modelos disponibles para la API key actual (endpoint ListModels)
 *     y muestra cuáles soportan `generateContent`.
 *  2. Ejecuta los 4 prompts REALES de la app (resumen, síntesis, oportunidades,
 *     brief) contra cada modelo Flash/Flash-Lite candidato, con la misma
 *     generationConfig que producción (responseMimeType JSON, temperature 0.4).
 *  3. Valida cada respuesta contra su schema Zod real y mide latencia, tokens de
 *     salida y campos poblados, para fundamentar la elección de modelo.
 *
 * Uso:  npm run audit:ai     (o: npx tsx scripts/audit-ai.ts)
 * Lee GEMINI_API_KEY desde .env.local. NUNCA imprime la key.
 */
import type { ZodType } from "zod";
import {
  summaryPrompt,
  synthesisPrompt,
  opportunitiesPrompt,
  briefPrompt,
} from "@/lib/gemini/prompts";
import {
  LinkSummarySchema,
  DebateSynthesisSchema,
  OpportunityReportSchema,
  BriefSchema,
} from "@/lib/gemini/schemas";

// --- entorno --------------------------------------------------------------
try {
  process.loadEnvFile(".env.local");
} catch {
  // .env.local opcional si las variables ya están en el entorno
}
const API_KEY = process.env.GEMINI_API_KEY;
if (!API_KEY) {
  console.error("✗ GEMINI_API_KEY no está en .env.local ni en el entorno.");
  process.exit(1);
}
const ENV_MODEL = process.env.GEMINI_MODEL?.trim();
const BASE = "https://generativelanguage.googleapis.com/v1beta";

// --- datos de ejemplo representativos -------------------------------------
const sampleSummary = {
  url: "https://www.weforum.org/agenda/2026/ai-tutors-higher-education-latam",
  rawText: `Un informe de 2026 analiza el uso de tutores basados en IA generativa en
universidades de América Latina. Señala mejoras en la retención de estudiantes de
primer año (de 68% a 79%) cuando se combinan tutorías humanas con asistentes de IA
disponibles 24/7. Advierte sobre riesgos de dependencia, sesgos en las respuestas y la
necesidad de capacitación docente. Incluye casos en México, Colombia y Argentina, y
recomienda marcos de gobernanza institucional para el uso responsable de estos sistemas.`,
};

const sampleSynthesis = {
  titulo: "Tutores con IA generativa en educación superior LATAM",
  resumen: "Informe sobre adopción de tutores de IA y su impacto en la retención.",
  comentarios: [
    "Me parece clave para nuestros programas online, pero necesitamos pensar la gobernanza de los datos de los alumnos.",
    "Coincido en el potencial. Mi duda es el costo de integración y si el plan gratuito alcanza para la escala que manejamos.",
    "Yo pondría foco en la capacitación docente primero; sin eso el riesgo de dependencia y sesgo es alto.",
    "¿No deberíamos correr un piloto en un solo certificado antes de comprometernos a toda la oferta?",
  ],
};

const samplePosts = [
  { titulo: "Tutores con IA generativa en educación superior LATAM", resumen: "Mejora la retención de primer año combinando tutoría humana + IA 24/7.", categoria: "Inteligencia artificial" },
  { titulo: "Regulación de IA en la UE y su impacto en LATAM", resumen: "El AI Act europeo empuja estándares que las instituciones de la región empiezan a adoptar.", categoria: "Regulación y normativa" },
  { titulo: "Microcredenciales y empleabilidad", resumen: "Crece la demanda de certificados cortos verificables.", categoria: "Tendencias de mercado" },
  { titulo: "Ciberseguridad en campus digitales", resumen: "Aumento de ataques de phishing dirigidos a estudiantes y personal administrativo.", categoria: "Ciberseguridad" },
  { titulo: "Analítica del aprendizaje para detección temprana de abandono", resumen: "Modelos predictivos que anticipan deserción usando datos del LMS.", categoria: "Innovación pedagógica" },
  { titulo: "Competidor lanza maestría 100% asincrónica con IA", resumen: "Un competidor regional ofrece tutoría automatizada y evaluación adaptativa.", categoria: "Competencia" },
  { titulo: "Legaltech: automatización de convenios académicos", resumen: "Herramientas que generan y revisan convenios institucionales.", categoria: "Legaltech" },
  { titulo: "Compliance de datos estudiantiles bajo nuevas normativas", resumen: "Requisitos de consentimiento y retención de datos personales en plataformas educativas.", categoria: "Compliance" },
];

interface Feature {
  key: string;
  prompt: string;
  schema: ZodType<unknown>;
}
const FEATURES: Feature[] = [
  { key: "resumen", prompt: summaryPrompt(sampleSummary), schema: LinkSummarySchema },
  { key: "sintesis", prompt: synthesisPrompt(sampleSynthesis), schema: DebateSynthesisSchema },
  { key: "oportunidades", prompt: opportunitiesPrompt({ posts: samplePosts }), schema: OpportunityReportSchema },
  { key: "brief", prompt: briefPrompt({ posts: samplePosts }), schema: BriefSchema },
];

// Modelos gratuitos candidatos (free tier 2026 = solo Flash / Flash-Lite).
// Solo se prueban los que efectivamente aparezcan en ListModels para esta key.
const PREFERRED = [
  "gemini-flash-latest",
  "gemini-flash-lite-latest",
  "gemini-2.5-flash",
  "gemini-2.5-flash-lite",
  "gemini-2.0-flash",
  "gemini-2.0-flash-lite",
  "gemini-3-flash",
  "gemini-3-flash-lite",
  "gemini-3.1-flash-lite",
];

// --- helpers --------------------------------------------------------------
function stripFences(s: string): string {
  return s.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "").trim();
}
function countPopulated(obj: unknown): number {
  if (!obj || typeof obj !== "object") return 0;
  let n = 0;
  for (const v of Object.values(obj as Record<string, unknown>)) {
    if (typeof v === "string" && v.trim()) n++;
    else if (Array.isArray(v) && v.length) n++;
    else if (v && typeof v === "object") n++;
  }
  return n;
}
function shortErr(body: string): string {
  try {
    const j = JSON.parse(body);
    return (j?.error?.status || j?.error?.message || body).toString().slice(0, 60);
  } catch {
    return body.slice(0, 60);
  }
}
const pad = (s: string | number, n: number) => String(s).padEnd(n);
const padL = (s: string | number, n: number) => String(s).padStart(n);
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

interface CallResult {
  status: number;
  ms: number;
  valid: boolean;
  populated: number;
  schemaFields: number;
  chars: number;
  outTok?: number;
  inTok?: number;
  note: string;
}

async function callModel(model: string, feature: Feature): Promise<CallResult> {
  const url = `${BASE}/models/${encodeURIComponent(model)}:generateContent`;
  const body = JSON.stringify({
    contents: [{ role: "user", parts: [{ text: feature.prompt }] }],
    generationConfig: { responseMimeType: "application/json", temperature: 0.4 },
  });

  for (let attempt = 1; attempt <= 2; attempt++) {
    const t0 = performance.now();
    let res: Response;
    try {
      res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-goog-api-key": API_KEY! },
        body,
      });
    } catch {
      return { status: 0, ms: Math.round(performance.now() - t0), valid: false, populated: 0, schemaFields: 0, chars: 0, note: "network" };
    }
    const ms = Math.round(performance.now() - t0);

    if ((res.status === 429 || res.status === 503) && attempt === 1) {
      await sleep(4000);
      continue;
    }
    if (!res.ok) {
      const txt = await res.text().catch(() => "");
      return { status: res.status, ms, valid: false, populated: 0, schemaFields: 0, chars: 0, note: shortErr(txt) };
    }

    /* eslint-disable @typescript-eslint/no-explicit-any */
    const json: any = await res.json().catch(() => null);
    const parts = json?.candidates?.[0]?.content?.parts ?? [];
    const raw: string = parts.map((p: any) => p?.text ?? "").join("").trim();
    const usage = json?.usageMetadata;
    /* eslint-enable @typescript-eslint/no-explicit-any */

    let valid = false;
    let populated = 0;
    let schemaFields = 0;
    let note = "ok";
    try {
      const parsed = JSON.parse(stripFences(raw));
      const parsedResult = feature.schema.safeParse(parsed);
      valid = parsedResult.success;
      populated = countPopulated(parsed);
      schemaFields = parsedResult.success ? countPopulated(parsedResult.data) : 0;
      if (!parsedResult.success) note = "schema✗";
    } catch {
      note = raw ? "json✗" : "vacío";
    }
    return {
      status: res.status,
      ms,
      valid,
      populated,
      schemaFields,
      chars: raw.length,
      outTok: usage?.candidatesTokenCount,
      inTok: usage?.promptTokenCount,
      note,
    };
  }
  return { status: 429, ms: 0, valid: false, populated: 0, schemaFields: 0, chars: 0, note: "429 x2" };
}

interface ModelMeta {
  name: string;
  methods: string[];
  inLimit?: number;
  outLimit?: number;
}
async function listModels(): Promise<ModelMeta[]> {
  const res = await fetch(`${BASE}/models?pageSize=200`, {
    headers: { "x-goog-api-key": API_KEY! },
  });
  if (!res.ok) {
    const txt = await res.text().catch(() => "");
    console.error(`✗ No se pudo listar modelos (HTTP ${res.status}). ${shortErr(txt)}`);
    return [];
  }
  /* eslint-disable @typescript-eslint/no-explicit-any */
  const json: any = await res.json();
  return (json.models ?? []).map((m: any): ModelMeta => ({
    name: String(m.name).replace(/^models\//, ""),
    methods: m.supportedGenerationMethods ?? [],
    inLimit: m.inputTokenLimit,
    outLimit: m.outputTokenLimit,
  }));
  /* eslint-enable @typescript-eslint/no-explicit-any */
}

// --- main -----------------------------------------------------------------
async function main() {
  console.log("\n════════════════════════════════════════════════════════════════════");
  console.log("  AUDITORÍA DE MODELOS GEMINI — Radar I+D");
  console.log(`  Modelo en uso (GEMINI_MODEL): ${ENV_MODEL || "(no seteado → default gemini-flash-latest)"}`);
  console.log("════════════════════════════════════════════════════════════════════\n");

  // 1) Modelos disponibles para esta key
  const models = await listModels();
  const genModels = models.filter((m) => m.methods.includes("generateContent"));
  const availableNames = new Set(genModels.map((m) => m.name));

  console.log(`Modelos con generateContent disponibles para esta key: ${genModels.length}`);
  const flashModels = genModels.filter((m) => /flash/i.test(m.name));
  console.log("\nModelos Flash / Flash-Lite (free tier):");
  for (const m of flashModels) {
    console.log(`  • ${pad(m.name, 34)} in:${padL(m.inLimit ?? "?", 8)}  out:${padL(m.outLimit ?? "?", 7)}`);
  }

  // 2) Candidatos a probar. Si se pasan modelos por argv, se usan esos
  //    (intersección con los disponibles); si no, se usa la lista PREFERRED.
  const argModels = process.argv.slice(2).map((s) => s.trim()).filter(Boolean);
  let candidates: string[];
  if (argModels.length) {
    const missing = argModels.filter((n) => !availableNames.has(n));
    if (missing.length) console.log(`\n⚠ No disponibles para esta key (se omiten): ${missing.join(", ")}`);
    candidates = argModels.filter((n) => availableNames.has(n));
  } else {
    candidates = PREFERRED.filter((n) => availableNames.has(n));
    if (ENV_MODEL && availableNames.has(ENV_MODEL) && !candidates.includes(ENV_MODEL)) {
      candidates.unshift(ENV_MODEL);
    }
    if (candidates.length === 0) {
      candidates = flashModels.slice(0, 6).map((m) => m.name);
    }
  }
  console.log(`\nProbando ${candidates.length} modelo(s) × ${FEATURES.length} features = ${candidates.length * FEATURES.length} llamadas...\n`);

  // 3) Ejecutar matriz (model × feature), secuencial para no gatillar rate limits
  type Row = { model: string; feature: string } & CallResult;
  const rows: Row[] = [];
  for (const model of candidates) {
    for (const feature of FEATURES) {
      process.stdout.write(`  → ${pad(model, 30)} ${pad(feature.key, 14)} `);
      const r = await callModel(model, feature);
      rows.push({ model, feature: feature.key, ...r });
      const flag = r.valid ? "✓" : "✗";
      console.log(`${flag}  HTTP ${padL(r.status, 3)}  ${padL(r.ms, 6)}ms  campos:${padL(r.schemaFields, 2)}  outTok:${padL(r.outTok ?? "-", 4)}  ${r.note}`);
      await sleep(400);
    }
  }

  // 4) Tabla por feature
  console.log("\n──────────────────────────────────────────────────────────────────────");
  console.log("  DETALLE POR FEATURE");
  console.log("──────────────────────────────────────────────────────────────────────");
  for (const feature of FEATURES) {
    console.log(`\n[${feature.key}]`);
    console.log(`  ${pad("modelo", 30)} ${pad("válido", 7)} ${pad("ms", 7)} ${pad("campos", 7)} ${pad("outTok", 7)} nota`);
    for (const r of rows.filter((x) => x.feature === feature.key)) {
      console.log(`  ${pad(r.model, 30)} ${pad(r.valid ? "✓" : "✗", 7)} ${padL(r.ms, 6)} ${padL(r.schemaFields, 6)}  ${padL(r.outTok ?? "-", 6)}  ${r.note}`);
    }
  }

  // 5) Ranking por modelo
  console.log("\n──────────────────────────────────────────────────────────────────────");
  console.log("  RESUMEN POR MODELO");
  console.log("──────────────────────────────────────────────────────────────────────");
  console.log(`  ${pad("modelo", 30)} ${pad("válidos", 8)} ${pad("lat.media", 10)} ${pad("outTok tot", 11)}`);
  const summary = candidates.map((model) => {
    const mr = rows.filter((x) => x.model === model);
    const okRows = mr.filter((x) => x.status === 200);
    const valid = mr.filter((x) => x.valid).length;
    const avgMs = okRows.length ? Math.round(okRows.reduce((a, b) => a + b.ms, 0) / okRows.length) : 0;
    const outTot = mr.reduce((a, b) => a + (b.outTok ?? 0), 0);
    return { model, valid, total: mr.length, avgMs, outTot };
  });
  // Orden: más válidos primero, luego menor latencia
  summary.sort((a, b) => b.valid - a.valid || a.avgMs - b.avgMs);
  for (const s of summary) {
    console.log(`  ${pad(s.model, 30)} ${pad(`${s.valid}/${s.total}`, 8)} ${padL(`${s.avgMs}ms`, 9)} ${padL(s.outTot, 10)}`);
  }

  const best = summary[0];
  console.log("\n──────────────────────────────────────────────────────────────────────");
  if (best && best.valid === best.total) {
    console.log(`  ✓ Mejor candidato (válido en todo, menor latencia): ${best.model}`);
  } else if (best) {
    console.log(`  ⚠ Ningún modelo validó los ${FEATURES.length} features. Mejor parcial: ${best.model} (${best.valid}/${best.total})`);
  } else {
    console.log("  ✗ No se pudo evaluar ningún modelo.");
  }
  console.log("──────────────────────────────────────────────────────────────────────\n");
}

main().catch((e) => {
  console.error("Error en la auditoría:", e);
  process.exit(1);
});
