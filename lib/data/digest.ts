import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { DigestPostInput, DigestDatoInput } from "@/lib/gemini/prompts";

export interface WeeklyActivity {
  posts: DigestPostInput[];
  desde: string; // YYYY-MM-DD
  hasta: string; // YYYY-MM-DD
}

export interface DailyActivity {
  posts: DigestPostInput[];
  datos: DigestDatoInput[];
  desde: string; // fecha+hora legible (rango de 24 h)
  hasta: string;
}

type Supabase = Awaited<ReturnType<typeof createClient>>;

const fmtFechaHora = (d: Date) =>
  d.toLocaleString("es-AR", {
    timeZone: "America/Argentina/Buenos_Aires",
    day: "numeric",
    month: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

/** Posts de v_feed desde `desde`, con los comentarios de los de más tracción
 *  (truncados a 280 chars para acotar los tokens de entrada del prompt). */
async function getPostsActivity(
  supabase: Supabase,
  desde: Date,
  topConComentarios: number,
): Promise<DigestPostInput[]> {
  const { data: posts } = await supabase
    .from("v_feed")
    .select("id,titulo,resumen,categoria,autor_nombre,votos_count,comentarios_count")
    .gte("created_at", desde.toISOString())
    .order("created_at", { ascending: false })
    .limit(40);

  const rows = posts ?? [];

  const topIds = [...rows]
    .sort(
      (a, b) =>
        b.votos_count + b.comentarios_count - (a.votos_count + a.comentarios_count),
    )
    .slice(0, topConComentarios)
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
        texto: (c.comentario as string).slice(0, 280),
      });
    }
  }

  return rows.map((p) => ({
    autor: (p.autor_nombre as string | null) ?? "Colaborador",
    titulo: p.titulo as string,
    categoria: p.categoria as string | null,
    resumen: p.resumen as string | null,
    votos: (p.votos_count as number) ?? 0,
    comentarios_count: (p.comentarios_count as number) ?? 0,
    comentarios: comentariosPorPost[p.id as string] ?? [],
  }));
}

/** Datos random de v_datos desde `desde`, con comentarios de los más activos. */
async function getDatosActivity(supabase: Supabase, desde: Date): Promise<DigestDatoInput[]> {
  const { data: datos } = await supabase
    .from("v_datos")
    .select("id,titulo,tipo,descripcion,autor_nombre,likes_count,comentarios_count")
    .gte("created_at", desde.toISOString())
    .order("created_at", { ascending: false })
    .limit(20);

  const rows = datos ?? [];

  const topIds = rows
    .filter((d) => (d.comentarios_count as number) > 0)
    .slice(0, 8)
    .map((d) => d.id as string);

  const comentariosPorDato: Record<string, { autor: string; texto: string }[]> = {};
  if (topIds.length) {
    const { data: comments } = await supabase
      .from("datos_comments")
      .select("dato_id,comentario,autor:profiles(nombre)")
      .in("dato_id", topIds)
      .order("created_at", { ascending: true })
      .limit(40);
    for (const c of comments ?? []) {
      const autorRel = c.autor as { nombre: string | null } | { nombre: string | null }[] | null;
      const nombre =
        (Array.isArray(autorRel) ? autorRel[0]?.nombre : autorRel?.nombre) ?? "Colaborador";
      (comentariosPorDato[c.dato_id as string] ??= []).push({
        autor: nombre,
        texto: (c.comentario as string).slice(0, 280),
      });
    }
  }

  return rows.map((d) => ({
    autor: (d.autor_nombre as string | null) ?? "Colaborador",
    titulo: d.titulo as string,
    tipo: d.tipo as string | null,
    descripcion: d.descripcion as string | null,
    likes: (d.likes_count as number) ?? 0,
    comentarios_count: (d.comentarios_count as number) ?? 0,
    comentarios: comentariosPorDato[d.id as string] ?? [],
  }));
}

/**
 * Actividad de los últimos 7 días para el resumen semanal IA: hasta 40 posts
 * del Radar con autor y tracción, y los comentarios de los 15 con más
 * interacción, para que la crónica pueda contar los debates.
 */
export async function getWeeklyActivityForAI(): Promise<WeeklyActivity> {
  const supabase = await createClient();
  const ahora = new Date();
  const hace7d = new Date(ahora.getTime() - 7 * 24 * 60 * 60 * 1000);

  return {
    posts: await getPostsActivity(supabase, hace7d, 15),
    desde: hace7d.toISOString().slice(0, 10),
    hasta: ahora.toISOString().slice(0, 10),
  };
}

/**
 * Actividad de las últimas 24 horas para el "Resumen del día": posts del
 * Radar + datos random, con sus debates. Ventana móvil (no día calendario)
 * para que a la mañana temprano también haya material que narrar.
 */
export async function getDailyActivityForAI(): Promise<DailyActivity> {
  const supabase = await createClient();
  const ahora = new Date();
  const hace24h = new Date(ahora.getTime() - 24 * 60 * 60 * 1000);

  const [posts, datos] = await Promise.all([
    getPostsActivity(supabase, hace24h, 10),
    getDatosActivity(supabase, hace24h),
  ]);

  return {
    posts,
    datos,
    desde: fmtFechaHora(hace24h),
    hasta: fmtFechaHora(ahora),
  };
}
