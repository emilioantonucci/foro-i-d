import "server-only";
import { createClient } from "@/lib/supabase/server";

export interface LeaderboardRow {
  id: string;
  nombre: string | null;
  avatar_url: string | null;
  puntos: number;
  rango: string;
  aportes: number;
  comentarios: number;
  insignias: number;
}

export async function getLeaderboard(): Promise<LeaderboardRow[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("v_top_contribuyentes")
    .select("*")
    .limit(100);
  if (error || !data) return [];
  return data as LeaderboardRow[];
}

export interface FullProfile {
  id: string;
  nombre: string | null;
  email: string | null;
  rol: string;
  avatar_url: string | null;
  bio: string | null;
  area: string | null;
  puntos: number;
  perfil_completo: boolean;
  fecha_registro: string;
  rango: string;
}

export async function getProfile(id: string): Promise<FullProfile | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("v_profiles")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  return (data as FullProfile) ?? null;
}

export interface ProfileStats {
  aportes: number;
  comentarios: number;
  insignias: number;
  votos_recibidos: number;
  insumos: number;
}

export async function getProfileStats(id: string): Promise<ProfileStats> {
  const supabase = await createClient();
  const [aportes, comentarios, insignias, insumos] = await Promise.all([
    supabase.from("posts").select("id", { count: "exact", head: true }).eq("user_id", id),
    supabase.from("comments").select("id", { count: "exact", head: true }).eq("user_id", id),
    supabase.from("user_badges").select("badge_id", { count: "exact", head: true }).eq("user_id", id),
    supabase
      .from("ai_outputs")
      .select("id", { count: "exact", head: true })
      .eq("user_id", id)
      .in("tipo", ["sintesis", "oportunidad", "brief"]),
  ]);

  // votes received on the user's posts
  const { data: postIds } = await supabase.from("posts").select("id").eq("user_id", id);
  let votos_recibidos = 0;
  if (postIds && postIds.length) {
    const ids = postIds.map((p) => p.id);
    const { count } = await supabase
      .from("votes")
      .select("id", { count: "exact", head: true })
      .in("post_id", ids);
    votos_recibidos = count ?? 0;
  }

  return {
    aportes: aportes.count ?? 0,
    comentarios: comentarios.count ?? 0,
    insignias: insignias.count ?? 0,
    insumos: insumos.count ?? 0,
    votos_recibidos,
  };
}
