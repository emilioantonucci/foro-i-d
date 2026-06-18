import "server-only";
import { createClient } from "@/lib/supabase/server";

export interface CountRow {
  slug?: string;
  nombre: string;
  total: number;
  color?: string;
  orden?: number;
}
export interface TraccionRow {
  id: string;
  titulo: string;
  categoria: string | null;
  estado: string;
  prioridad: string;
  votos: number;
  comentarios: number;
  traccion: number;
}
export interface TopRow {
  id: string;
  nombre: string | null;
  puntos: number;
  rango: string;
}
export interface Pulso {
  publicaciones: number;
  usuarios_activos: number;
  votos: number;
  comentarios: number;
}

export interface DashboardData {
  usuariosRegistrados: number;
  publicacionesTotales: number;
  insumosGenerados: number;
  pulso: Pulso;
  porCategoria: CountRow[];
  porEstado: CountRow[];
  traccion: TraccionRow[];
  topContribuyentes: TopRow[];
}

export async function getDashboardData(): Promise<DashboardData> {
  const supabase = await createClient();
  const desde = new Date(Date.now() - 7 * 86_400_000).toISOString();
  const hasta = new Date().toISOString();

  const [profilesC, postsC, insumosC, pulso, cat, est, trac, top] = await Promise.all([
    supabase.from("profiles").select("id", { count: "exact", head: true }),
    supabase.from("posts").select("id", { count: "exact", head: true }),
    supabase.from("ai_outputs").select("id", { count: "exact", head: true }).in("tipo", ["sintesis", "oportunidad", "brief"]),
    supabase.rpc("dashboard_pulso", { p_desde: desde, p_hasta: hasta }),
    supabase.from("v_posts_por_categoria").select("*"),
    supabase.from("v_posts_por_estado").select("*"),
    supabase.from("v_posts_traccion").select("*").limit(8),
    supabase.from("v_top_contribuyentes").select("*").limit(6),
  ]);

  /* eslint-disable @typescript-eslint/no-explicit-any */
  const pulsoRow = (Array.isArray(pulso.data) ? pulso.data[0] : pulso.data) as Pulso | null;
  /* eslint-enable @typescript-eslint/no-explicit-any */

  return {
    usuariosRegistrados: profilesC.count ?? 0,
    publicacionesTotales: postsC.count ?? 0,
    insumosGenerados: insumosC.count ?? 0,
    pulso: pulsoRow ?? { publicaciones: 0, usuarios_activos: 0, votos: 0, comentarios: 0 },
    porCategoria: ((cat.data ?? []) as CountRow[]).filter((c) => c.total > 0),
    porEstado: (est.data ?? []) as CountRow[],
    traccion: ((trac.data ?? []) as TraccionRow[]).filter((t) => t.traccion > 0),
    topContribuyentes: (top.data ?? []) as TopRow[],
  };
}
