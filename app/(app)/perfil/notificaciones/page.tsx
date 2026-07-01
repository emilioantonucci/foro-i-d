import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import NotifPrefsForm from "@/components/profile/NotifPrefsForm";
import type { NotifPrefs } from "@/lib/types";

export const metadata = { title: "Notificaciones · Radar I+D" };

export default async function NotifPrefsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data } = await supabase
    .from("profiles")
    .select(
      "notif_email_enabled,notif_nueva_publicacion,notif_comentario,notif_resumen_semanal,notif_rango,notif_nuevo_dato",
    )
    .eq("id", user.id)
    .maybeSingle();

  // Defaults to ON if the columns aren't present yet (migration 0005 not applied).
  const prefs: NotifPrefs = {
    notif_email_enabled: data?.notif_email_enabled ?? true,
    notif_nueva_publicacion: data?.notif_nueva_publicacion ?? true,
    notif_comentario: data?.notif_comentario ?? true,
    notif_resumen_semanal: data?.notif_resumen_semanal ?? true,
    notif_rango: data?.notif_rango ?? true,
    notif_nuevo_dato: data?.notif_nuevo_dato ?? true,
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "16px", maxWidth: "640px" }}>
      <div>
        <Link
          href="/perfil"
          style={{ display: "inline-flex", alignItems: "center", gap: "6px", fontSize: "13px", color: "var(--fg-secondary)" }}
        >
          <ArrowLeft size={15} aria-hidden="true" /> Volver al perfil
        </Link>
        <h1 style={{ fontFamily: "var(--font-secondary)", fontSize: "22px", margin: "10px 0 4px", color: "var(--fg-primary)" }}>
          Notificaciones por email
        </h1>
        <p style={{ fontSize: "14px", color: "var(--fg-secondary)", margin: 0, lineHeight: 1.55 }}>
          Elegí qué avisos querés recibir en tu correo. Los cambios se guardan al instante.
        </p>
      </div>
      <NotifPrefsForm initial={prefs} />
    </div>
  );
}
