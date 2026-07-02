import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { Dato, DatoComment } from "@/lib/types";

export interface DatoAutor {
  id: string;
  nombre: string | null;
  avatar_url: string | null;
  puntos: number;
}

export interface FeedDato extends Dato {
  autor: DatoAutor | null;
  likes_count: number;
  comentarios_count: number;
  liked: boolean; // current user already liked it
}

export type DatoSort = "recientes" | "mas_gustados" | "mas_comentados";

export interface DatoFilters {
  sort?: DatoSort;
  tipo?: string;
  q?: string;
  page?: number;
  pageSize?: number;
}

export interface DatoFeedResult {
  datos: FeedDato[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

/* eslint-disable @typescript-eslint/no-explicit-any */

/**
 * Paginated "Datos random" feed backed by the v_datos view (like/comment
 * counts as sortable columns), so sorting + pagination are correct over the
 * whole dataset.
 */
export async function getDatosFeed(filters: DatoFilters = {}): Promise<DatoFeedResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const page = Math.max(1, filters.page ?? 1);
  const pageSize = filters.pageSize ?? 8;
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  let q = supabase.from("v_datos").select("*", { count: "exact" });

  if (filters.tipo) q = q.eq("tipo", filters.tipo);
  if (filters.q) {
    const term = filters.q.replace(/[,()*%]/g, " ").trim();
    if (term) {
      q = q.or(`titulo.ilike.*${term}*,descripcion.ilike.*${term}*`);
    }
  }

  switch (filters.sort) {
    case "mas_gustados":
      q = q.order("likes_count", { ascending: false }).order("created_at", { ascending: false });
      break;
    case "mas_comentados":
      q = q.order("comentarios_count", { ascending: false }).order("created_at", { ascending: false });
      break;
    default:
      q = q.order("created_at", { ascending: false });
  }

  const { data, error, count } = await q.range(from, to);
  if (error || !data) {
    return { datos: [], total: 0, page, pageSize, totalPages: 0 };
  }

  // current user's likes on the visible page (for the filled heart)
  const ids = data.map((r: any) => r.id as string);
  const likedSet = new Set<string>();
  if (user && ids.length) {
    const { data: ml } = await supabase
      .from("datos_likes")
      .select("dato_id")
      .eq("user_id", user.id)
      .in("dato_id", ids);
    (ml ?? []).forEach((l: any) => likedSet.add(l.dato_id));
  }

  const datos: FeedDato[] = data.map((r: any) => ({
    id: r.id,
    user_id: r.user_id,
    titulo: r.titulo,
    tipo: r.tipo,
    url: r.url,
    descripcion: r.descripcion,
    etiquetas: r.etiquetas ?? [],
    created_at: r.created_at,
    updated_at: r.updated_at,
    file_path: r.file_path ?? null,
    file_name: r.file_name ?? null,
    autor: {
      id: r.user_id,
      nombre: r.autor_nombre ?? null,
      avatar_url: r.autor_avatar ?? null,
      puntos: r.autor_puntos ?? 0,
    },
    likes_count: r.likes_count ?? 0,
    comentarios_count: r.comentarios_count ?? 0,
    liked: likedSet.has(r.id),
  }));

  const total = count ?? 0;
  return { datos, total, page, pageSize, totalPages: Math.max(1, Math.ceil(total / pageSize)) };
}

export interface DatoDetail extends FeedDato {
  comentarios: (DatoComment & { autor: DatoAutor | null })[];
}

export async function getDato(id: string): Promise<DatoDetail | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data, error } = await supabase
    .from("datos")
    // `datos_likes` (PK = dato_id+user_id) is read by PostgREST as a junction,
    // so it also exposes a datos↔profiles m2m relationship. Pin the author embed
    // to the direct FK to disambiguate (PGRST201 otherwise).
    .select(
      `*,
       autor:profiles!datos_user_id_fkey(id,nombre,avatar_url,puntos),
       likes:datos_likes(user_id),
       comentarios:datos_comments(*, autor:profiles!datos_comments_user_id_fkey(id,nombre,avatar_url,puntos))`,
    )
    .eq("id", id)
    .maybeSingle();

  if (error || !data) return null;

  const likes = (data.likes ?? []) as { user_id: string }[];
  const comentarios = ((data.comentarios ?? []) as any[])
    .map((c) => ({
      ...c,
      autor: Array.isArray(c.autor) ? (c.autor[0] ?? null) : (c.autor ?? null),
    }))
    .sort((a, b) => +new Date(a.created_at) - +new Date(b.created_at));

  return {
    id: data.id,
    user_id: data.user_id,
    titulo: data.titulo,
    tipo: data.tipo,
    url: data.url,
    descripcion: data.descripcion,
    etiquetas: data.etiquetas ?? [],
    created_at: data.created_at,
    updated_at: data.updated_at,
    file_path: data.file_path ?? null,
    file_name: data.file_name ?? null,
    file_mime: data.file_mime ?? null,
    file_size: data.file_size ?? null,
    autor: Array.isArray(data.autor) ? (data.autor[0] ?? null) : (data.autor ?? null),
    likes_count: likes.length,
    comentarios_count: comentarios.length,
    liked: !!user && likes.some((l) => l.user_id === user.id),
    comentarios,
  };
}
/* eslint-enable @typescript-eslint/no-explicit-any */
