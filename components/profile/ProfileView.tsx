import Link from "next/link";
import { FileText } from "lucide-react";
import type { FullProfile, ProfileStats } from "@/lib/data/profiles";
import type { FeedPost } from "@/lib/data/posts";
import { rankProgress } from "@/lib/points";
import { timeAgo } from "@/lib/ui";
import Avatar from "@/components/ui/Avatar";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import EmptyState from "@/components/ui/EmptyState";
import { StatusBadge } from "@/components/ui/tags";

function Stat({ value, label }: { value: number; label: string }) {
  return (
    <div style={{ textAlign: "center" }}>
      <div style={{ fontFamily: "var(--font-secondary)", fontSize: "24px", fontWeight: 700, color: "var(--fg-primary)" }}>
        {value}
      </div>
      <div style={{ fontSize: "12px", color: "var(--fg-secondary)", marginTop: "2px" }}>{label}</div>
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
  const desde = new Date(profile.fecha_registro).toLocaleDateString("es", {
    month: "long",
    year: "numeric",
  });

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
      {/* header */}
      <Card pad="lg" style={{ display: "flex", gap: "20px", alignItems: "flex-start", flexWrap: "wrap" }}>
        <Avatar name={nombre} size={76} title={nombre} />
        <div style={{ flex: 1, minWidth: "220px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
            <h1 style={{ fontFamily: "var(--font-secondary)", fontSize: "22px", margin: 0, color: "var(--fg-primary)" }}>
              {nombre}
            </h1>
            <Badge color="#6B9000">{profile.rango}</Badge>
          </div>
          <div style={{ fontSize: "13px", color: "var(--fg-secondary)", marginTop: "4px" }}>
            {profile.area ? `${profile.area} · ` : ""}doinGlobal · se unió en {desde}
          </div>
          {profile.bio && (
            <p style={{ fontSize: "14px", color: "var(--fg-secondary)", lineHeight: 1.55, margin: "12px 0 0", maxWidth: "560px" }}>
              {profile.bio}
            </p>
          )}
        </div>

        {/* rank progress */}
        <div style={{ width: "230px", flex: "none", minWidth: "200px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", color: "var(--fg-secondary)", marginBottom: "6px" }}>
            <span>{prog.next ? `${prog.current.nombre} → ${prog.next.nombre}` : `${prog.current.nombre} (máximo)`}</span>
            <span style={{ fontWeight: 700, color: "var(--fg-primary)" }}>{Math.round(prog.pct)}%</span>
          </div>
          <div
            role="progressbar"
            aria-valuenow={Math.round(prog.pct)}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label="Progreso al siguiente rango"
            style={{ height: "8px", borderRadius: "var(--radius-pill)", background: "var(--dg-gray-100)", overflow: "hidden" }}
          >
            <div style={{ width: `${prog.pct}%`, height: "100%", background: "var(--dg-green)" }} />
          </div>
          <div style={{ fontSize: "12px", color: "var(--fg-muted)", marginTop: "6px" }}>
            {prog.next
              ? `Faltan ${prog.faltan.toLocaleString("es")} pts para ${prog.next.nombre}`
              : "Rango máximo alcanzado"}
          </div>
        </div>
      </Card>

      {/* stats */}
      <Card
        pad="md"
        style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(90px, 1fr))", gap: "12px" }}
      >
        <Stat value={profile.puntos} label="Puntos" />
        <Stat value={stats.aportes} label="Aportes" />
        <Stat value={stats.votos_recibidos} label="Votos recibidos" />
        <Stat value={stats.insignias} label="Insignias" />
        <Stat value={stats.insumos} label="Insumos IA" />
      </Card>

      {/* recent contributions */}
      <Card pad="md">
        <div className="dg-section-label" style={{ marginBottom: "14px" }}>
          Historial de aportes
        </div>
        {posts.length === 0 ? (
          <EmptyState
            icon={FileText}
            title="Sin publicaciones todavía"
            desc="Las señales que compartas van a aparecer acá."
          />
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            {posts.map((p) => (
              <div
                key={p.id}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "12px",
                  paddingBottom: "12px",
                  borderBottom: "1px solid var(--dg-gray-100)",
                }}
              >
                <div style={{ flex: 1, minWidth: 0 }}>
                  <Link href={`/post/${p.id}`} style={{ fontSize: "14px", fontWeight: 700, color: "var(--fg-primary)" }}>
                    {p.titulo}
                  </Link>
                  <div style={{ fontSize: "12px", color: "var(--fg-muted)", marginTop: "2px" }}>
                    {timeAgo(p.created_at)} · {p.votos_count} votos · {p.comentarios_count} comentarios
                  </div>
                </div>
                <StatusBadge estado={p.estado} />
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
