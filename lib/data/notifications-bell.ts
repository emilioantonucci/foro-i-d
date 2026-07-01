import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { BellNotification } from "@/lib/types";

// Campanita in-app (migration 0011). Distinto de lib/notifications/ (emails):
// acá no hay fan-out, la fuente es v_notificaciones (activity_events ajenos,
// últimos 15 días) y el "visto" es el cursor profiles.notif_seen_at.

/** Notificaciones del usuario actual, más recientes primero — la vista ya
 *  filtra la ventana de 15 días y excluye la actividad propia. */
export async function getBellNotifications(limit = 20): Promise<BellNotification[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("v_notificaciones")
    .select("*")
    .limit(limit);
  if (error || !data) return [];
  return data as BellNotification[];
}

/** Cantidad de notificaciones posteriores al último "visto" del usuario. */
export async function getUnreadCount(userId: string): Promise<number> {
  const supabase = await createClient();
  const { data: prof } = await supabase
    .from("profiles")
    .select("notif_seen_at")
    .eq("id", userId)
    .maybeSingle();
  // Sin fila o sin cursor (migración no aplicada aún): no inventar no-vistas.
  if (!prof?.notif_seen_at) return 0;

  const { count, error } = await supabase
    .from("v_notificaciones")
    .select("id", { count: "exact", head: true })
    .gt("created_at", prof.notif_seen_at);
  if (error) return 0;
  return count ?? 0;
}
