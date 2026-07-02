import "server-only";
import { createClient } from "@/lib/supabase/server";

/** Fila de v_biblioteca (migration 0015) — lista compacta del repositorio. */
export interface BibliotecaRow {
  id: string;
  user_id: string;
  titulo: string;
  url: string | null;
  resumen: string | null;
  categoria: string | null;
  tipo_material: string | null;
  fecha_original: string | null;
  created_at: string;
  autor_nombre: string | null;
  votos_count: number;
  comentarios_count: number;
  interaccion: number;
}

export type BibliotecaSort = "recientes" | "fecha_original" | "interaccion";

export interface BibliotecaFilters {
  q?: string;
  categoria?: string;
  tipo?: string;
  /** Fecha de publicación en el foro (created_at), rango YYYY-MM-DD. */
  pubDesde?: string;
  pubHasta?: string;
  /** Fecha de publicación del recurso original, rango YYYY-MM-DD. */
  origDesde?: string;
  origHasta?: string;
  sort?: BibliotecaSort;
  page?: number;
  pageSize?: number;
}

export interface BibliotecaResult {
  rows: BibliotecaRow[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

const isDate = (s?: string): s is string => !!s && /^\d{4}-\d{2}-\d{2}$/.test(s);

// El equipo trabaja en hora argentina (sin DST): el rango de "publicado en el
// foro" se ancla a ese huso para que coincida con las fechas que muestra la
// tabla (created_at es timestamptz; compararlo en UTC corre el día de noche).
const TZ = "-03:00";

/**
 * Listado paginado sobre v_biblioteca. Igual que getFeed: los conteos son
 * columnas de la vista, así ordenar por interacción y paginar es correcto
 * sobre el dataset completo.
 */
export async function getBiblioteca(
  filters: BibliotecaFilters = {},
): Promise<BibliotecaResult> {
  const supabase = await createClient();

  const page = Math.max(1, filters.page ?? 1);
  const pageSize = filters.pageSize ?? 20;
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  let q = supabase.from("v_biblioteca").select("*", { count: "exact" });

  if (filters.categoria) q = q.eq("categoria", filters.categoria);
  if (filters.tipo) q = q.eq("tipo_material", filters.tipo);
  if (filters.q) {
    const term = filters.q.replace(/[,()*%]/g, " ").trim();
    if (term) q = q.or(`titulo.ilike.*${term}*,resumen.ilike.*${term}*`);
  }
  if (isDate(filters.pubDesde)) q = q.gte("created_at", `${filters.pubDesde}T00:00:00${TZ}`);
  if (isDate(filters.pubHasta)) q = q.lte("created_at", `${filters.pubHasta}T23:59:59${TZ}`);
  // fecha_original es date: comparación directa (excluye filas sin fecha).
  if (isDate(filters.origDesde)) q = q.gte("fecha_original", filters.origDesde);
  if (isDate(filters.origHasta)) q = q.lte("fecha_original", filters.origHasta);

  switch (filters.sort) {
    case "fecha_original":
      q = q
        .order("fecha_original", { ascending: false, nullsFirst: false })
        .order("created_at", { ascending: false });
      break;
    case "interaccion":
      q = q.order("interaccion", { ascending: false }).order("created_at", { ascending: false });
      break;
    default:
      q = q.order("created_at", { ascending: false });
  }

  const { data, error, count } = await q.range(from, to);
  if (error || !data) {
    return { rows: [], total: 0, page, pageSize, totalPages: 0 };
  }

  const total = count ?? 0;
  return {
    rows: data as BibliotecaRow[],
    total,
    page,
    pageSize,
    totalPages: Math.max(1, Math.ceil(total / pageSize)),
  };
}
