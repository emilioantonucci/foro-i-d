import Link from "next/link";
import { redirect } from "next/navigation";
import { Bell, ChevronRight } from "lucide-react";
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
      <ProfileView profile={profile} stats={stats} posts={posts} editable />
      <EditProfile
        nombre={profile.nombre ?? ""}
        bio={profile.bio ?? ""}
        area={profile.area ?? ""}
        perfilCompleto={profile.perfil_completo}
      />
      <Link
        href="/perfil/notificaciones"
        className="dg-card dg-card--pad-md"
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: "12px",
          textDecoration: "none",
        }}
      >
        <span style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <Bell size={18} color="#6B9000" aria-hidden="true" />
          <span>
            <span style={{ display: "block", fontSize: "14px", fontWeight: 700, color: "var(--fg-primary)" }}>
              Notificaciones por email
            </span>
            <span style={{ display: "block", fontSize: "12.5px", color: "var(--fg-secondary)" }}>
              Elegí qué avisos recibís en tu correo.
            </span>
          </span>
        </span>
        <ChevronRight size={18} color="#8A8A90" aria-hidden="true" />
      </Link>
    </div>
  );
}
