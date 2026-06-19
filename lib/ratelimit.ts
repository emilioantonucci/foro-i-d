import "server-only";

/**
 * Limitador de tasa en memoria (ventana fija). Limita una `key` a `limit`
 * solicitudes por `windowMs`.
 *
 * IMPORTANTE: el estado vive en el proceso. En serverless (Vercel) cada
 * instancia/lambda tiene su propio contador, por lo que NO es una cuota global
 * dura: sirve como freno a clics repetidos y ráfagas dentro de una instancia
 * caliente (que es el caso de abuso más común). Para un límite global
 * garantizado haría falta un store compartido (Postgres, Upstash/Redis).
 */
interface Window {
  count: number;
  resetAt: number;
}
const windows = new Map<string, Window>();

export interface RateLimitResult {
  ok: boolean;
  /** Segundos hasta que se libere la ventana (0 si ok). */
  retryAfter: number;
}

export function rateLimit(key: string, limit: number, windowMs: number): RateLimitResult {
  const now = Date.now();

  // Barrido oportunista para que el Map no crezca sin límite.
  if (windows.size > 5000) {
    for (const [k, w] of windows) if (now >= w.resetAt) windows.delete(k);
  }

  const w = windows.get(key);
  if (!w || now >= w.resetAt) {
    windows.set(key, { count: 1, resetAt: now + windowMs });
    return { ok: true, retryAfter: 0 };
  }
  if (w.count < limit) {
    w.count += 1;
    return { ok: true, retryAfter: 0 };
  }
  return { ok: false, retryAfter: Math.max(1, Math.ceil((w.resetAt - now) / 1000)) };
}

// Límite de las rutas de IA: por usuario. Suficiente para el uso normal
// (resumen + síntesis + brief + oportunidades varias veces) y corta el abuso
// por clics repetidos sin malgastar la cuota gratis del modelo.
const AI_LIMIT = 10;
const AI_WINDOW_MS = 60_000;

export function checkAiRateLimit(userId: string): RateLimitResult {
  return rateLimit(`ai:${userId}`, AI_LIMIT, AI_WINDOW_MS);
}
