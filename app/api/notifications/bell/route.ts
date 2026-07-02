import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  getBellNotifications,
  getUnreadCount,
} from "@/lib/data/notifications-bell";

// Polling de la campanita del Topbar: lista + count de no vistas del usuario
// de la sesión. Dinámica de por sí (usa cookies vía createClient).
export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "No autenticado." }, { status: 401 });
  }

  const [items, unread] = await Promise.all([
    getBellNotifications(20),
    getUnreadCount(user.id),
  ]);
  return NextResponse.json({ items, unread });
}
