import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { ActivityEvent } from "@/lib/types";

/** Global activity feed (last 30 days), newest first — v_actividad_reciente
 *  already orders and filters the window server-side. */
export async function getRecentActivity(limit = 40): Promise<ActivityEvent[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("v_actividad_reciente")
    .select("*")
    .limit(limit);
  if (error || !data) return [];
  return data as ActivityEvent[];
}
