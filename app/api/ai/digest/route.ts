import { NextResponse } from "next/server";
import { requireUser, unauthorized, aiErrorResponse, aiRateLimitResponse } from "@/lib/api";
import { generateWeeklyDigest, generateDailyDigest, geminiModelName } from "@/lib/gemini";
import { getWeeklyActivityForAI, getDailyActivityForAI } from "@/lib/data/digest";
import type { WeeklyDigest } from "@/lib/types";

export type DigestPeriodo = "diario" | "semanal";

interface DigestPayload {
  periodo: DigestPeriodo;
  digest: WeeklyDigest;
  desde: string;
  hasta: string;
  postsCount: number;
}

// Caché compartida por período: el digest es el mismo para todo el equipo,
// así que una generación por franja alcanza (cuida la cuota del free tier).
// El diario refresca más seguido porque narra las últimas 24 h.
const CACHE_HORAS: Record<DigestPeriodo, number> = { semanal: 6, diario: 2 };

export async function POST(req: Request) {
  const { supabase, user } = await requireUser();
  if (!user) return unauthorized();

  const body = await req.json().catch(() => ({}));
  const periodo: DigestPeriodo = body?.periodo === "diario" ? "diario" : "semanal";

  const corte = new Date(Date.now() - CACHE_HORAS[periodo] * 60 * 60 * 1000).toISOString();
  const { data: cached } = await supabase
    .from("ai_outputs")
    .select("contenido")
    .eq("tipo", "digest")
    .eq("contenido->>periodo", periodo)
    .gte("created_at", corte)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (cached?.contenido) {
    return NextResponse.json({ ok: true, cached: true, ...(cached.contenido as DigestPayload) });
  }

  const limited = aiRateLimitResponse(user.id);
  if (limited) return limited;

  try {
    let payload: DigestPayload;
    if (periodo === "diario") {
      const { posts, datos, desde, hasta } = await getDailyActivityForAI();
      if (posts.length === 0 && datos.length === 0) {
        return NextResponse.json(
          { ok: false, error: "No hubo actividad en las últimas 24 horas." },
          { status: 400 },
        );
      }
      const digest = await generateDailyDigest({ posts, datos, desde, hasta });
      payload = { periodo, digest, desde, hasta, postsCount: posts.length + datos.length };
    } else {
      const { posts, desde, hasta } = await getWeeklyActivityForAI();
      if (posts.length === 0) {
        return NextResponse.json(
          { ok: false, error: "No hubo publicaciones en los últimos 7 días." },
          { status: 400 },
        );
      }
      const digest = await generateWeeklyDigest({ posts, desde, hasta });
      payload = { periodo, digest, desde, hasta, postsCount: posts.length };
    }

    // Auditoría + fuente de la caché. Best effort: si falla, el digest igual
    // se devuelve (solo se pierde la caché de esta franja).
    const { error: insertError } = await supabase.from("ai_outputs").insert({
      user_id: user.id,
      tipo: "digest",
      contenido: payload,
      modelo: geminiModelName(),
    });
    if (insertError) {
      console.warn(`[digest] no se pudo cachear el resumen: ${insertError.message}`);
    }

    return NextResponse.json({ ok: true, cached: false, ...payload });
  } catch (e) {
    return aiErrorResponse(e);
  }
}
