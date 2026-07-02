import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { Post, Comment } from "@/lib/types";

export interface FeedAuthor {
  id: string;
  nombre: string | null;
  avatar_url: string | null;
  puntos: number;
}

export interface FeedPost extends Post {
  autor: FeedAuthor | null;
  votos_count: number;
  comentarios_count: number;
  votosPorTipo: Record<string, number>;
  misVotos: string[];
  has_poll?: boolean;
}

export type FeedSort =
  | "recientes"
  | "mas_votadas"
  | "mas_comentadas"
  | "alta_prioridad";

export interface FeedFilters {
  sort?: FeedSort;
  categoria?: string;
  estado?: string;
  prioridad?: string;
  q?: string;
  page?: number;
  pageSize?: number;
}

export interface FeedResult {
  posts: FeedPost[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

/* eslint-disable @typescript-eslint/no-explicit-any */
function mapRow(r: any): FeedPost {
  return {
    ...(r as Post),
    autor: Array.isArray(r.autor) ? (r.autor[0] ?? null) : (r.autor ?? null),
    votos_count: r.votos?.[0]?.count ?? 0,
    comentarios_count: r.comentarios?.[0]?.count ?? 0,
    votosPorTipo: {},
    misVotos: [],
  };
}

/**
 * Paginated feed backed by the v_feed view (counts as sortable columns),
 * so sorting + pagination are correct over the whole dataset.
 */
export async function getFeed(filters: FeedFilters = {}): Promise<FeedResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const page = Math.max(1, filters.page ?? 1);
  const pageSize = filters.pageSize ?? 8;
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  let q = supabase.from("v_feed").select("*", { count: "exact" });

  if (filters.categoria) q = q.eq("categoria", filters.categoria);
  if (filters.estado) q = q.eq("estado", filters.estado);
  if (filters.prioridad) q = q.eq("prioridad", filters.prioridad);
  if (filters.q) {
    const term = filters.q.replace(/[,()*%]/g, " ").trim();
    if (term) {
      q = q.or(`titulo.ilike.*${term}*,resumen.ilike.*${term}*,relevancia.ilike.*${term}*`);
    }
  }

  switch (filters.sort) {
    case "mas_votadas":
      q = q.order("votos_count", { ascending: false }).order("created_at", { ascending: false });
      break;
    case "mas_comentadas":
      q = q.order("comentarios_count", { ascending: false }).order("created_at", { ascending: false });
      break;
    case "alta_prioridad":
      q = q.order("prioridad_orden", { ascending: false }).order("created_at", { ascending: false });
      break;
    default:
      q = q.order("created_at", { ascending: false });
  }

  const { data, error, count } = await q.range(from, to);
  if (error || !data) {
    return { posts: [], total: 0, page, pageSize, totalPages: 0 };
  }

  // current user's votes on the visible page (for inline vote highlighting)
  const ids = data.map((r: any) => r.id as string);
  const misVotosMap: Record<string, string[]> = {};
  if (user && ids.length) {
    const { data: mv } = await supabase
      .from("votes")
      .select("post_id,tipo_voto")
      .eq("user_id", user.id)
      .in("post_id", ids);
    (mv ?? []).forEach((v: any) => {
      (misVotosMap[v.post_id] ??= []).push(v.tipo_voto);
    });
  }

  const posts: FeedPost[] = data.map((r: any) => ({
    id: r.id,
    user_id: r.user_id,
    titulo: r.titulo,
    url: r.url,
    resumen: r.resumen,
    relevancia: r.relevancia,
    categoria: r.categoria,
    etiquetas: r.etiquetas ?? [],
    estado: r.estado,
    prioridad: r.prioridad,
    aplicacion_interna: r.aplicacion_interna ?? [],
    marcado_relevante: r.marcado_relevante,
    created_at: r.created_at,
    updated_at: r.updated_at,
    file_path: r.file_path ?? null,
    file_name: r.file_name ?? null,
    has_poll: r.has_poll ?? false,
    fecha_original: r.fecha_original ?? null,
    tipo_material: r.tipo_material ?? null,
    autor: {
      id: r.user_id,
      nombre: r.autor_nombre ?? null,
      avatar_url: r.autor_avatar ?? null,
      puntos: r.autor_puntos ?? 0,
    },
    votos_count: r.votos_count ?? 0,
    comentarios_count: r.comentarios_count ?? 0,
    votosPorTipo: { util: r.util_count ?? 0, prioritario: r.prioritario_count ?? 0 },
    misVotos: misVotosMap[r.id] ?? [],
  }));

  const total = count ?? 0;
  return { posts, total, page, pageSize, totalPages: Math.max(1, Math.ceil(total / pageSize)) };
}

export interface PostDetail extends FeedPost {
  votos: { id: string; user_id: string; tipo_voto: string }[];
  comentarios: (Comment & { autor: FeedAuthor | null })[];
}

export async function getPost(id: string): Promise<PostDetail | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("posts")
    .select(
      `*,
       autor:profiles(id,nombre,avatar_url,puntos),
       votos:votes(id,user_id,tipo_voto),
       comentarios:comments(*, autor:profiles(id,nombre,avatar_url,puntos))`,
    )
    .eq("id", id)
    .maybeSingle();

  if (error || !data) return null;

  const votos = (data.votos ?? []) as PostDetail["votos"];
  const comentarios = ((data.comentarios ?? []) as any[])
    .map((c) => ({
      ...c,
      autor: Array.isArray(c.autor) ? (c.autor[0] ?? null) : (c.autor ?? null),
    }))
    .sort((a, b) => +new Date(a.created_at) - +new Date(b.created_at));

  return {
    ...mapRow(data),
    votos_count: votos.length,
    comentarios_count: comentarios.length,
    votos,
    comentarios,
  };
}

export async function getPostsByUser(userId: string, limitN = 12): Promise<FeedPost[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("posts")
    .select(`*, autor:profiles(id,nombre,avatar_url,puntos), comentarios:comments(count), votos:votes(count)`)
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(limitN);
  if (error || !data) return [];
  return data.map(mapRow);
}

/** Recent posts as compact text for the AI opportunity/brief features. */
export async function getRecentPostsForAI(limitN = 40) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("posts")
    .select("id,titulo,resumen,relevancia,categoria,etiquetas,estado,prioridad,created_at")
    .order("created_at", { ascending: false })
    .limit(limitN);
  return data ?? [];
}
/* eslint-enable @typescript-eslint/no-explicit-any */
