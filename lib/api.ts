import "server-only";
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { checkAiRateLimit } from "@/lib/ratelimit";
import {
  GeminiConfigError,
  GeminiOutputError,
  GeminiRequestError,
} from "@/lib/gemini";

export async function requireUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return { supabase, user };
}

export function unauthorized() {
  return NextResponse.json({ ok: false, error: "No autorizado." }, { status: 401 });
}

/**
 * Aplica el límite de uso de IA por usuario. Devuelve una respuesta 429 lista
 * para retornar si se superó el límite, o `null` si puede continuar.
 */
export function aiRateLimitResponse(userId: string) {
  const rl = checkAiRateLimit(userId);
  if (rl.ok) return null;
  return NextResponse.json(
    {
      ok: false,
      error: `Estás usando la IA demasiado seguido. Probá de nuevo en ${rl.retryAfter}s.`,
    },
    { status: 429, headers: { "Retry-After": String(rl.retryAfter) } },
  );
}

export function aiErrorResponse(e: unknown) {
  if (e instanceof GeminiConfigError) {
    return NextResponse.json(
      { ok: false, error: "La IA no está configurada. Definí GEMINI_API_KEY en el servidor." },
      { status: 500 },
    );
  }
  if (e instanceof GeminiOutputError || e instanceof GeminiRequestError) {
    return NextResponse.json({ ok: false, error: e.message }, { status: 502 });
  }
  return NextResponse.json(
    { ok: false, error: "Ocurrió un error inesperado con la IA." },
    { status: 500 },
  );
}
