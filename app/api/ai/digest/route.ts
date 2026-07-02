import { NextResponse } from "next/server";
import { requireUser, unauthorized, aiErrorResponse, aiRateLimitResponse } from "@/lib/api";
import { generateWeeklyDigest, geminiModelName } from "@/lib/gemini";
import { getWeeklyActivityForAI } from "@/lib/data/digest";
import type { WeeklyDigest } from "@/lib/types";

interface DigestPayload {
  digest: WeeklyDigest;
  desde: string;
  hasta: string;
  postsCount: number;
}

export async function POST() {
  const { supabase, user } = await requireUser();
  if (!user) return unauthorized();

  // Caché compartida de 6 h: el resumen es el mismo para todo el equipo, así
  // que una generación por franja alcanza (cuida la cuota del free tier).
  const hace6h = new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString();
  const { data: cached } = await supabase
    .from("ai_outputs")
    .select("contenido")
    .eq("tipo", "digest")
    .gte("created_at", hace6h)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (cached?.contenido) {
    return NextResponse.json({ ok: true, cached: true, ...(cached.contenido as DigestPayload) });
  }

  const limited = aiRateLimitResponse(user.id);
  if (limited) return limited;

  const { posts, desde, hasta } = await getWeeklyActivityForAI();
  if (posts.length === 0) {
    return NextResponse.json(
      { ok: false, error: "No hubo publicaciones en los últimos 7 días." },
      { status: 400 },
    );
  }

  try {
    const digest = await generateWeeklyDigest({ posts, desde, hasta });
    const payload: DigestPayload = { digest, desde, hasta, postsCount: posts.length };

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
