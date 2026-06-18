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

const DEFAULT_MODEL = "gemini-flash-latest";

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

/** Calls Gemini and returns the raw text (expected to be JSON). Retries on
 *  transient 503/429 with a short backoff. */
export async function callGeminiJSON(prompt: string): Promise<string> {
  const { apiKey, model } = getGeminiConfig();
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(
    model,
  )}:generateContent`;

  const MAX_ATTEMPTS = 3;
  let lastTransient: GeminiRequestError | null = null;

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    let res: Response;
    try {
      res = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": apiKey,
        },
        body: JSON.stringify({
          contents: [{ role: "user", parts: [{ text: prompt }] }],
          generationConfig: {
            responseMimeType: "application/json",
            temperature: 0.4,
          },
        }),
        cache: "no-store",
      });
    } catch {
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
      throw new GeminiRequestError(`La IA respondió con error ${res.status}. ${body.slice(0, 300)}`);
    }

    let json: unknown;
    try {
      json = await res.json();
    } catch {
      throw new GeminiOutputError("La IA devolvió una respuesta ilegible.");
    }

    /* eslint-disable @typescript-eslint/no-explicit-any */
    const parts = (json as any)?.candidates?.[0]?.content?.parts ?? [];
    const text = parts.map((p: any) => p?.text ?? "").join("").trim();
    /* eslint-enable @typescript-eslint/no-explicit-any */

    if (!text) throw new GeminiOutputError("La IA devolvió una respuesta vacía.");
    return text;
  }

  throw lastTransient ?? new GeminiRequestError("La IA no está disponible.");
}
