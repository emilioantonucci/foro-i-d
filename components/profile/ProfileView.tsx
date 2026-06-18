import Link from "next/link";
import type { FullProfile, ProfileStats } from "@/lib/data/profiles";
import type { FeedPost } from "@/lib/data/posts";
import { rankProgress } from "@/lib/points";
import { initials, avatarColor, timeAgo } from "@/lib/ui";
import { StatusBadge } from "@/components/ui/tags";

function Stat({ value, label }: { value: number; label: string }) {
  return (
    <div style={{ textAlign: "center", flex: 1 }}>
      <div style={{ fontFamily: "'Poppins', sans-serif", fontSize: "24px", fontWeight: 700, color: "#262626" }}>{value}</div>
      <div style={{ fontSize: "12px", color: "#737373", marginTop: "2px" }}>{label}</div>
    </div>
  );
}

export default function ProfileView({
  profile,
  stats,
  posts,
}: {
  profile: FullProfile;
  stats: ProfileStats;
  posts: FeedPost[];
}) {
  const nombre = profile.nombre ?? "Colaborador";
  const prog = rankProgress(profile.puntos);
  const desde = new Date(profile.fecha_registro).toLocaleDateString("es", { month: "long", year: "numeric" });

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
      {/* header */}
      <div style={{ background: "#fff", border: "1px solid #E8E8E8", borderRadius: "14px", padding: "24px", display: "flex", gap: "20px", alignItems: "flex-start", flexWrap: "wrap" }}>
        <span style={{ width: "76px", height: "76px", borderRadius: "50%", background: avatarColor(nombre), color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: "26px", flex: "none" }}>
          {initials(nombre)}
        </span>
        <div style={{ flex: 1, minWidth: "220px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
            <h1 style={{ fontFamily: "'Poppins', sans-serif", fontSize: "22px", margin: 0, color: "#262626" }}>{nombre}</h1>
            <span style={{ background: "rgba(153,204,6,0.16)", color: "#6b9000", borderRadius: "999px", padding: "3px 11px", fontSize: "12px", fontWeight: 700 }}>{profile.rango}</span>
          </div>
          <div style={{ fontSize: "13px", color: "#737373", marginTop: "4px" }}>
            {profile.area ? `${profile.area} · ` : ""}doinGlobal · se unió en {desde}
          </div>
          {profile.bio && <p style={{ fontSize: "14px", color: "#525252", lineHeight: 1.55, margin: "12px 0 0", maxWidth: "560px" }}>{profile.bio}</p>}
        </div>

        {/* rank progress */}
        <div style={{ width: "230px", flex: "none" }}>
          <div style={{ fontSize: "12px", color: "#737373", marginBottom: "6px" }}>
            {prog.next ? `${prog.current.nombre} → ${prog.next.nombre}` : `${prog.current.nombre} (máximo)`}
          </div>
          <div style={{ height: "8px", borderRadius: "999px", background: "#F0F0EE", overflow: "hidden" }}>
            <div style={{ width: `${prog.pct}%`, height: "100%", background: "#99CC06" }} />
          </div>
          <div style={{ fontSize: "12px", color: "#AAAAB4", marginTop: "6px" }}>
            {prog.next ? `Faltan ${prog.faltan.toLocaleString("es")} pts para ${prog.next.nombre}` : "Rango máximo alcanzado"}
          </div>
        </div>
      </div>

      {/* stats */}
      <div style={{ background: "#fff", border: "1px solid #E8E8E8", borderRadius: "14px", padding: "20px", display: "flex", gap: "12px" }}>
        <Stat value={profile.puntos} label="Puntos" />
        <Stat value={stats.aportes} label="Aportes" />
        <Stat value={stats.votos_recibidos} label="Votos recibidos" />
        <Stat value={stats.insignias} label="Insignias" />
        <Stat value={stats.insumos} label="Insumos IA" />
      </div>

      {/* recent contributions */}
      <div style={{ background: "#fff", border: "1px solid #E8E8E8", borderRadius: "14px", padding: "20px" }}>
        <div style={{ fontSize: "11px", letterSpacing: ".1em", textTransform: "uppercase", color: "#AAAAB4", fontWeight: 700, marginBottom: "14px" }}>
          Historial de aportes
        </div>
        {posts.length === 0 ? (
          <p style={{ fontSize: "13.5px", color: "#AAAAB4", margin: 0 }}>Sin publicaciones todavía.</p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            {posts.map((p) => (
              <div key={p.id} style={{ display: "flex", alignItems: "center", gap: "12px", paddingBottom: "12px", borderBottom: "1px solid #F4F4F4" }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <Link href={`/post/${p.id}`} style={{ fontSize: "14px", fontWeight: 700, color: "#262626" }}>{p.titulo}</Link>
                  <div style={{ fontSize: "12px", color: "#AAAAB4", marginTop: "2px" }}>{timeAgo(p.created_at)} · {p.votos_count} votos · {p.comentarios_count} comentarios</div>
                </div>
                <StatusBadge estado={p.estado} />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
