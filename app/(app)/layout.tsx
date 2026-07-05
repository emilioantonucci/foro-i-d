import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { rankForPoints } from "@/lib/points";
import { getUnreadCount } from "@/lib/data/notifications-bell";
import AppShell, { type ShellProfile } from "@/components/shell/AppShell";
import InactivityWarning from "@/components/shell/InactivityWarning";

// Warn from day 12 of inactivity; the penalty lands on day 15 (migration 0010).
const AVISO_DIAS = 12;
const PENALIZACION_DIAS = 15;
const DIA_MS = 86_400_000;

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Belt-and-suspenders: middleware already redirects, but never render a
  // protected layout without a user.
  if (!user) redirect("/login");

  // Profile row may not exist yet (before the DB migration is applied); fall
  // back to the auth user so the shell still renders.
  const { data: profileRow } = await supabase
    .from("profiles")
    .select("nombre, email, avatar_url, puntos, last_activity_at, last_penalty_at")
    .eq("id", user.id)
    .maybeSingle();

  const puntos = profileRow?.puntos ?? 0;

  // Count inicial de la campanita, server-side para que el badge no arranque
  // en 0 y salte al primer poll.
  const notifUnread = await getUnreadCount(user.id);

  // Same idle reference as apply_inactivity_penalty(): the most recent of the
  // last action and the last penalty, so banner and cron stay in sync.
  const idleRef = Math.max(
    profileRow?.last_activity_at
      ? new Date(profileRow.last_activity_at).getTime()
      : Date.now(),
    profileRow?.last_penalty_at
      ? new Date(profileRow.last_penalty_at).getTime()
      : 0,
  );
  const diasInactivo = Math.floor((Date.now() - idleRef) / DIA_MS);
  const banner =
    puntos > 0 && diasInactivo >= AVISO_DIAS ? (
      <InactivityWarning
        diasInactivo={diasInactivo}
        diasRestantes={Math.max(0, PENALIZACION_DIAS - diasInactivo)}
      />
    ) : undefined;
  const profile: ShellProfile = {
    id: user.id,
    nombre:
      profileRow?.nombre ??
      (user.user_metadata?.nombre as string | undefined) ??
      user.email ??
      "Colaborador",
    email: profileRow?.email ?? user.email ?? "",
    avatar_url: profileRow?.avatar_url ?? null,
    puntos,
    rango: rankForPoints(puntos).nombre,
  };

  return (
    <>
      <a href="#main" className="skip-link">
        Saltar al contenido
      </a>
      <AppShell profile={profile} notifUnread={notifUnread} banner={banner}>
        {children}
      </AppShell>
    </>
  );
}
