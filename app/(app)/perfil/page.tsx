import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getProfile, getProfileStats } from "@/lib/data/profiles";
import { getPostsByUser } from "@/lib/data/posts";
import ProfileView from "@/components/profile/ProfileView";
import EditProfile from "@/components/profile/EditProfile";

export default async function PerfilPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [profile, stats, posts] = await Promise.all([
    getProfile(user.id),
    getProfileStats(user.id),
    getPostsByUser(user.id),
  ]);

  if (!profile) {
    return (
      <p style={{ color: "#737373", fontSize: "14px" }}>
        Tu perfil aún no está disponible. Aplicá la migración de base de datos (Paso 3) y volvé a iniciar sesión.
      </p>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
      <ProfileView profile={profile} stats={stats} posts={posts} />
      <EditProfile
        nombre={profile.nombre ?? ""}
        bio={profile.bio ?? ""}
        area={profile.area ?? ""}
        perfilCompleto={profile.perfil_completo}
      />
    </div>
  );
}
