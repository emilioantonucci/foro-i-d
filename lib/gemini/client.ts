import "server-only";

/**
 * Isolated Gemini access layer. ONLY Gemini (Google AI Studio free tier).
 * The API key is read from the environment and never logged or sent to the
 * client. Calls go through the public REST endpoint (no SDK dependency),
 * authenticating with the `x-goog-api-key` header.
 */

export class GeminiConfigError extends Error {}
export class GeminiRequestError extends Error {}
export class GeminiOutputError extends Error {}

// Modelo gratuito FIJO. No usar el alias `-latest`: salta de versión sin aviso y
// puede degradar latencia/estabilidad (auditado: gemini-flash-latest dio 503 y ~76s).
// gemini-3.1-flash-lite es free tier, estable (~2s) y válido en los 4 features.
// Verificado en scripts/audit-ai.ts. Fallback equivalente estable: gemini-2.5-flash-lite.
const DEFAULT_MODEL = "gemini-3.1-flash-lite";

// Corta requests colgadas (el fetch no tenía timeout explícito).
const REQUEST_TIMEOUT_MS = 30_000;
// Acota la salida (el feature más largo, brief, usa ~700 tokens) sin truncar.
const MAX_OUTPUT_TOKENS = 2048;

export function getGeminiConfig() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new GeminiConfigError("GEMINI_API_KEY no está configurada en el servidor.");
  }
  const model = process.env.GEMINI_MODEL?.trim() || DEFAULT_MODEL;
  return { apiKey, model };
}

export function geminiModelName(): string {
  return process.env.GEMINI_MODEL?.trim() || DEFAULT_MODEL;
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** Multimodal request part: prompt text, inline document (base64) or a
 *  Gemini-native file reference (e.g. a public YouTube URL). */
export type GeminiPart =
  | { text: string }
  | { inline_data: { mime_type: string; data: string } }
  | { file_data: { file_uri: string } };

export interface GeminiCallOpts {
  /** Override del tope de salida (el summary extendido usa 4096). */
  maxOutputTokens?: number;
  /** Override del timeout — solo para llamadas pesadas (PDF/YouTube). */
  timeoutMs?: number;
}

/** Calls Gemini and returns the raw text (expected to be JSON). Retries on
 *  transient 503/429 with a short backoff. Accepts a plain prompt or a
 *  multimodal parts array (text + PDF inline / YouTube file_data). */
export async function callGeminiJSON(
  input: string | GeminiPart[],
  opts: GeminiCallOpts = {},
): Promise<string> {
  const parts: GeminiPart[] = typeof input === "string" ? [{ text: input }] : input;
  const maxOutputTokens = opts.maxOutputTokens ?? MAX_OUTPUT_TOKENS;
  const timeoutMs = opts.timeoutMs ?? REQUEST_TIMEOUT_MS;
  const { apiKey, model } = getGeminiConfig();
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(
    model,
  )}:generateContent`;

  const MAX_ATTEMPTS = 3;
  let lastTransient: GeminiRequestError | null = null;

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    const startedAt = Date.now();
    let res: Response;
    try {
      res = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": apiKey,
        },
        body: JSON.stringify({
          contents: [{ role: "user", parts }],
          generationConfig: {
            responseMimeType: "application/json",
            temperature: 0.4,
            maxOutputTokens,
          },
        }),
        cache: "no-store",
        signal: AbortSignal.timeout(timeoutMs),
      });
    } catch (e) {
      // Timeout/abort -> transitorio (reintentable); cualquier otra cosa -> conexión.
      const aborted =
        e instanceof Error && (e.name === "TimeoutError" || e.name === "AbortError");
      if (aborted) {
        lastTransient = new GeminiRequestError(
          "La IA tardó demasiado en responder. Probá de nuevo en unos segundos.",
        );
        if (attempt < MAX_ATTEMPTS) {
          await sleep(800 * attempt);
          continue;
        }
        throw lastTransient;
      }
      throw new GeminiRequestError("No se pudo conectar con el servicio de IA.");
    }

    // Transient: model overloaded (503) or rate limited (429) -> retry.
    if (res.status === 503 || res.status === 429) {
      lastTransient = new GeminiRequestError(
        res.status === 429
          ? "Límite de uso de la IA alcanzado. Probá de nuevo en unos minutos."
          : "La IA está con alta demanda en este momento. Probá de nuevo en unos segundos.",
      );
      if (attempt < MAX_ATTEMPTS) {
        await sleep(1200 * attempt);
        continue;
      }
      throw lastTransient;
    }

    if (!res.ok) {
      const body = await res.text().catch(() => "");
      // No filtramos el cuerpo crudo de Gemini al cliente: log server-side + mensaje genérico.
      console.error(`[gemini] ${model} HTTP ${res.status}: ${body.slice(0, 300)}`);
      throw new GeminiRequestError(
        `El servicio de IA respondió con un error (${res.status}). Probá de nuevo en unos minutos.`,
      );
    }

    let json: unknown;
    try {
      json = await res.json();
    } catch {
      throw new GeminiOutputError("La IA devolvió una respuesta ilegible.");
    }

    /* eslint-disable @typescript-eslint/no-explicit-any */
    const outParts = (json as any)?.candidates?.[0]?.content?.parts ?? [];
    const text = outParts.map((p: any) => p?.text ?? "").join("").trim();
    /* eslint-enable @typescript-eslint/no-explicit-any */

    if (!text) throw new GeminiOutputError("La IA devolvió una respuesta vacía.");
    console.log(`[gemini] ${model} ok (${Date.now() - startedAt}ms, intento ${attempt})`);
    return text;
  }

  throw lastTransient ?? new GeminiRequestError("La IA no está disponible.");
}
