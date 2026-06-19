import Link from "next/link";
import {
  Eye,
  Footprints,
  BookmarkCheck,
  LineChart,
  Star,
  Compass,
  GraduationCap,
  type LucideIcon,
} from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getLeaderboard } from "@/lib/data/profiles";
import { RANKS, rankForPoints } from "@/lib/points";
import Card from "@/components/ui/Card";
import Avatar from "@/components/ui/Avatar";

const RANK_ICON: Record<string, LucideIcon> = {
  Observador: Eye,
  Explorador: Footprints,
  Curador: BookmarkCheck,
  Analista: LineChart,
  Referente: Star,
  "Estratega I+D": Compass,
  "Mentor de Innovación": GraduationCap,
};

export default async function RankingPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { data: me } = user
    ? await supabase.from("profiles").select("puntos").eq("id", user.id).maybeSingle()
    : { data: null };
  const miRango = rankForPoints(me?.puntos ?? 0).nombre;

  const [leaders, badgesRes, myBadgesRes] = await Promise.all([
    getLeaderboard(),
    supabase.from("badges").select("*").order("nombre"),
    user
      ? supabase.from("user_badges").select("badge_id").eq("user_id", user.id)
      : Promise.resolve({ data: [] }),
  ]);
  const badges = badgesRes.data ?? [];
  const myBadgeIds = new Set(
    (myBadgesRes.data ?? []).map((b: { badge_id: string }) => b.badge_id),
  );

  return (
    <div>
      <h1 className="dg-page-title">Ranking de contribución</h1>
      <p className="dg-page-sub">
        Puntos, los 7 rangos de participación e insignias del equipo.
      </p>

      {/* 7 rangos */}
      <Card pad="lg" style={{ marginBottom: "18px" }}>
        <div className="dg-section-label" style={{ marginBottom: "16px" }}>
          Los 7 rangos de participación
        </div>
        <div className="dg-hscroll" style={{ display: "flex", gap: "10px", paddingBottom: "4px" }}>
          {RANKS.map((r) => {
            const Icon = RANK_ICON[r.nombre] ?? Eye;
            const isMine = r.nombre === miRango;
            return (
              <div
                key={r.nombre}
                aria-current={isMine ? "true" : undefined}
                style={{
                  flex: "1 0 130px",
                  textAlign: "center",
                  padding: "14px 10px",
                  borderRadius: "var(--radius-md)",
                  background: isMine ? "rgba(153,204,6,0.14)" : "var(--dg-gray-50)",
                  border: isMine ? "1.5px solid var(--dg-green)" : "1px solid var(--dg-gray-100)",
                }}
              >
                <Icon size={22} color={isMine ? "#6B9000" : "#8A8A90"} aria-hidden="true" />
                <div style={{ fontSize: "13px", fontWeight: 700, color: "var(--fg-primary)", marginTop: "8px" }}>
                  {r.nombre}
                </div>
                <div style={{ fontSize: "12px", color: "var(--fg-muted)", marginTop: "2px" }}>
                  {isMine ? "vos · " : ""}
                  {r.min.toLocaleString("es")} pts
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      <div className="dg-two-col--wide-rail">
        {/* leaderboard */}
        <div>
          {/* Desktop: table */}
          <Card pad="sm" className="dg-only-desktop">
            <table className="dg-lb-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Persona</th>
                  <th>Rango</th>
                  <th className="num">Aportes</th>
                  <th className="num">Coment.</th>
                  <th className="num">Insignias</th>
                  <th className="num">Puntos</th>
                </tr>
              </thead>
              <tbody>
                {leaders.length === 0 ? (
                  <tr>
                    <td colSpan={7} style={{ padding: "24px", textAlign: "center", color: "var(--fg-muted)" }}>
                      Todavía sin participación.
                    </td>
                  </tr>
                ) : (
                  leaders.map((u, i) => {
                    const isMe = u.id === user?.id;
                    return (
                      <tr key={u.id} className={isMe ? "me" : undefined}>
                        <td style={{ fontWeight: 700, color: "var(--fg-muted)" }}>{i + 1}</td>
                        <td>
                          <Link href={`/perfil/${u.id}`} style={{ display: "flex", alignItems: "center", gap: "9px" }}>
                            <Avatar name={u.nombre} size={28} title={u.nombre ?? "Colaborador"} />
                            <span style={{ fontWeight: 700, color: "var(--fg-primary)" }}>
                              {u.nombre ?? "Colaborador"}
                              {isMe ? " · vos" : ""}
                            </span>
                          </Link>
                        </td>
                        <td style={{ color: "#6B9000", fontWeight: 600 }}>{u.rango}</td>
                        <td className="num" style={{ color: "var(--fg-secondary)" }}>{u.aportes}</td>
                        <td className="num" style={{ color: "var(--fg-secondary)" }}>{u.comentarios}</td>
                        <td className="num" style={{ color: "var(--fg-secondary)" }}>{u.insignias}</td>
                        <td className="num" style={{ fontWeight: 700, color: "var(--fg-primary)" }}>
                          {u.puntos.toLocaleString("es")}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </Card>

          {/* Mobile: stacked cards */}
          <div className="dg-lb-cards">
            {leaders.length === 0 ? (
              <Card pad="md">
                <p style={{ margin: 0, fontSize: "13px", color: "var(--fg-muted)", textAlign: "center" }}>
                  Todavía sin participación.
                </p>
              </Card>
            ) : (
              leaders.map((u, i) => {
                const isMe = u.id === user?.id;
                return (
                  <Link
                    key={u.id}
                    href={`/perfil/${u.id}`}
                    className={`dg-card dg-card--pad-md ${isMe ? "dg-card--accent" : ""}`.trim()}
                    style={{ display: "block" }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                      <span style={{ width: "20px", fontWeight: 700, color: "var(--fg-muted)" }}>{i + 1}</span>
                      <Avatar name={u.nombre} size={34} title={u.nombre ?? "Colaborador"} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontWeight: 700, color: "var(--fg-primary)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                          {u.nombre ?? "Colaborador"}
                          {isMe ? " · vos" : ""}
                        </div>
                        <div style={{ fontSize: "12px", color: "#6B9000", fontWeight: 600 }}>{u.rango}</div>
                      </div>
                      <div style={{ fontWeight: 700, color: "var(--fg-primary)" }}>{u.puntos.toLocaleString("es")} pts</div>
                    </div>
                    <div style={{ display: "flex", gap: "16px", marginTop: "10px", fontSize: "12px", color: "var(--fg-secondary)" }}>
                      <span>{u.aportes} aportes</span>
                      <span>{u.comentarios} coment.</span>
                      <span>{u.insignias} insignias</span>
                    </div>
                  </Link>
                );
              })
            )}
          </div>
        </div>

        {/* badges */}
        <div className="dg-two-col__rail">
          <Card pad="md">
            <div className="dg-section-label" style={{ marginBottom: "14px" }}>
              Insignias del programa
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
              {badges.map((b: { id: string; nombre: string; descripcion: string | null }) => {
                const unlocked = myBadgeIds.has(b.id);
                return (
                  <div
                    key={b.id}
                    style={{
                      background: unlocked ? "rgba(153,204,6,0.12)" : "var(--dg-gray-50)",
                      border: unlocked
                        ? "1px solid rgba(153,204,6,0.4)"
                        : "1px solid var(--dg-gray-100)",
                      borderRadius: "var(--radius-md)",
                      padding: "12px",
                      opacity: unlocked ? 1 : 0.7,
                    }}
                  >
                    <div style={{ fontSize: "12.5px", fontWeight: 700, color: "var(--fg-primary)", lineHeight: 1.25 }}>
                      {b.nombre}
                    </div>
                    {b.descripcion && (
                      <div style={{ fontSize: "11.5px", color: "var(--fg-secondary)", lineHeight: 1.4, marginTop: "4px" }}>
                        {b.descripcion}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
