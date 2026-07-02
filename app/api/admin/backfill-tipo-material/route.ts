import { NextResponse } from "next/server";
import { requireUser, unauthorized, aiErrorResponse, aiRateLimitResponse } from "@/lib/api";
import { classifyMaterials } from "@/lib/gemini";
import { tipoMaterialBySlug } from "@/lib/constants";

const BATCH = 20;

/**
 * Backfill del tipo de material: clasifica en lote (1 llamada a Gemini ≈ 20
 * posts) las publicaciones que aún no tienen tipo. Solo admin/moderador; la
 * RLS posts_update ya les permite actualizar cualquier post. El cliente lo
 * llama en loop hasta que `restantes` llegue a 0.
 */
export async function POST() {
  const { supabase, user } = await requireUser();
  if (!user) return unauthorized();

  const { data: me } = await supabase
    .from("profiles")
    .select("rol")
    .eq("id", user.id)
    .maybeSingle();
  if (me?.rol !== "admin" && me?.rol !== "moderador") {
    return NextResponse.json(
      { ok: false, error: "Solo administradores o moderadores." },
      { status: 403 },
    );
  }

  const limited = aiRateLimitResponse(user.id);
  if (limited) return limited;

  const { data: pendientes, count } = await supabase
    .from("posts")
    .select("id,titulo,resumen", { count: "exact" })
    .is("tipo_material", null)
    .order("created_at", { ascending: false })
    .limit(BATCH);

  const total = count ?? 0;
  if (!pendientes || pendientes.length === 0) {
    return NextResponse.json({ ok: true, procesados: 0, restantes: 0 });
  }

  try {
    const { clasificaciones } = await classifyMaterials({ posts: pendientes });

    const idsValidos = new Set(pendientes.map((p) => p.id as string));
    let procesados = 0;
    for (const c of clasificaciones) {
      const tipo = tipoMaterialBySlug(c.tipoMaterial)?.slug;
      // ids inventados o slugs inválidos se saltean: quedan para otra pasada
      if (!tipo || !idsValidos.has(c.id)) continue;
      const { error } = await supabase
        .from("posts")
        .update({ tipo_material: tipo })
        .eq("id", c.id);
      if (!error) procesados++;
    }

    return NextResponse.json({
      ok: true,
      procesados,
      restantes: Math.max(0, total - procesados),
    });
  } catch (e) {
    return aiErrorResponse(e);
  }
}
