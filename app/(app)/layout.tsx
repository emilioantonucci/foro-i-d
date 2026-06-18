import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { rankForPoints } from "@/lib/points";
import AppShell, { type ShellProfile } from "@/components/shell/AppShell";

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
    .select("nombre, email, puntos")
    .eq("id", user.id)
    .maybeSingle();

  const puntos = profileRow?.puntos ?? 0;
  const profile: ShellProfile = {
    id: user.id,
    nombre:
      profileRow?.nombre ??
      (user.user_metadata?.nombre as string | undefined) ??
      user.email ??
      "Colaborador",
    email: profileRow?.email ?? user.email ?? "",
    puntos,
    rango: rankForPoints(puntos).nombre,
  };

  return <AppShell profile={profile}>{children}</AppShell>;
}
