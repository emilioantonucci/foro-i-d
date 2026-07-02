import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { DigestPostInput } from "@/lib/gemini/prompts";

export interface WeeklyActivity {
  posts: DigestPostInput[];
  desde: string; // YYYY-MM-DD
  hasta: string; // YYYY-MM-DD
}

/**
 * Actividad de los últimos 7 días para el resumen semanal IA: hasta 40 posts
 * con autor y tracción, y los comentarios (hasta 60) de los 15 posts con más
 * interacción, para que la crónica pueda contar los debates.
 */
export async function getWeeklyActivityForAI(): Promise<WeeklyActivity> {
  const supabase = await createClient();
  const ahora = new Date();
  const hace7d = new Date(ahora.getTime() - 7 * 24 * 60 * 60 * 1000);

  const { data: posts } = await supabase
    .from("v_feed")
    .select("id,titulo,resumen,categoria,autor_nombre,votos_count,comentarios_count")
    .gte("created_at", hace7d.toISOString())
    .order("created_at", { ascending: false })
    .limit(40);

  const rows = posts ?? [];

  // Comentarios de los posts con más tracción (los debates que vale narrar).
  const topIds = [...rows]
    .sort(
      (a, b) =>
        b.votos_count + b.comentarios_count - (a.votos_count + a.comentarios_count),
    )
    .slice(0, 15)
    .map((p) => p.id as string);

  const comentariosPorPost: Record<string, { autor: string; texto: string }[]> = {};
  if (topIds.length) {
    const { data: comments } = await supabase
      .from("comments")
      .select("post_id,comentario,autor:profiles(nombre)")
      .in("post_id", topIds)
      .order("created_at", { ascending: true })
      .limit(60);
    for (const c of comments ?? []) {
      const autorRel = c.autor as { nombre: string | null } | { nombre: string | null }[] | null;
      const nombre =
        (Array.isArray(autorRel) ? autorRel[0]?.nombre : autorRel?.nombre) ?? "Colaborador";
      (comentariosPorPost[c.post_id as string] ??= []).push({
        autor: nombre,
        // truncado server-side: acota los tokens de entrada del prompt
        texto: (c.comentario as string).slice(0, 280),
      });
    }
  }

  return {
    posts: rows.map((p) => ({
      autor: (p.autor_nombre as string | null) ?? "Colaborador",
      titulo: p.titulo as string,
      categoria: p.categoria as string | null,
      resumen: p.resumen as string | null,
      votos: (p.votos_count as number) ?? 0,
      comentarios_count: (p.comentarios_count as number) ?? 0,
      comentarios: comentariosPorPost[p.id as string] ?? [],
    })),
    desde: hace7d.toISOString().slice(0, 10),
    hasta: ahora.toISOString().slice(0, 10),
  };
}
