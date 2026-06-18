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
import { initials, avatarColor } from "@/lib/ui";

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
    user ? supabase.from("user_badges").select("badge_id").eq("user_id", user.id) : Promise.resolve({ data: [] }),
  ]);
  const badges = badgesRes.data ?? [];
  const myBadgeIds = new Set((myBadgesRes.data ?? []).map((b: { badge_id: string }) => b.badge_id));

  return (
    <div>
      <h1 style={{ fontFamily: "'Poppins', sans-serif", fontSize: "22px", margin: "0 0 4px", color: "#262626", letterSpacing: "-0.01em" }}>
        Ranking de contribución
      </h1>
      <p style={{ color: "#737373", fontSize: "14px", margin: "0 0 22px" }}>
        Puntos, los 7 rangos de participación e insignias del equipo.
      </p>

      {/* 7 rangos */}
      <div style={{ background: "#fff", border: "1px solid #E8E8E8", borderRadius: "14px", padding: "20px", marginBottom: "18px" }}>
        <div style={{ fontSize: "11px", letterSpacing: ".1em", textTransform: "uppercase", color: "#AAAAB4", fontWeight: 700, marginBottom: "16px" }}>
          Los 7 rangos de participación
        </div>
        <div style={{ display: "flex", gap: "10px", overflowX: "auto", paddingBottom: "4px" }}>
          {RANKS.map((r) => {
            const Icon = RANK_ICON[r.nombre] ?? Eye;
            const isMine = r.nombre === miRango;
            return (
              <div
                key={r.nombre}
                style={{
                  flex: "1 0 130px",
                  textAlign: "center",
                  padding: "14px 10px",
                  borderRadius: "12px",
                  background: isMine ? "rgba(153,204,6,0.14)" : "#FAFAFA",
                  border: isMine ? "1.5px solid #99CC06" : "1px solid #F0F0EE",
                }}
              >
                <Icon size={22} color={isMine ? "#6b9000" : "#8a8a90"} />
                <div style={{ fontSize: "13px", fontWeight: 700, color: "#262626", marginTop: "8px" }}>{r.nombre}</div>
                <div style={{ fontSize: "12px", color: "#AAAAB4", marginTop: "2px" }}>
                  {isMine ? "tú · " : ""}{r.min.toLocaleString("es")} pts
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "minmax(0,1fr) 320px", gap: "18px", alignItems: "start" }}>
        {/* leaderboard */}
        <div style={{ background: "#fff", border: "1px solid #E8E8E8", borderRadius: "14px", padding: "8px 4px", overflow: "hidden" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13.5px" }}>
            <thead>
              <tr style={{ color: "#AAAAB4", fontSize: "11px", textTransform: "uppercase", letterSpacing: ".06em" }}>
                <th style={{ textAlign: "left", padding: "12px 14px" }}>#</th>
                <th style={{ textAlign: "left", padding: "12px 14px" }}>Persona</th>
                <th style={{ textAlign: "left", padding: "12px 14px" }}>Rango</th>
                <th style={{ textAlign: "right", padding: "12px 14px" }}>Aportes</th>
                <th style={{ textAlign: "right", padding: "12px 14px" }}>Coment.</th>
                <th style={{ textAlign: "right", padding: "12px 14px" }}>Insignias</th>
                <th style={{ textAlign: "right", padding: "12px 14px" }}>Puntos</th>
              </tr>
            </thead>
            <tbody>
              {leaders.length === 0 ? (
                <tr><td colSpan={7} style={{ padding: "24px", textAlign: "center", color: "#AAAAB4" }}>Todavía sin participación.</td></tr>
              ) : (
                leaders.map((u, i) => {
                  const isMe = u.id === user?.id;
                  return (
                    <tr key={u.id} style={{ borderTop: "1px solid #F4F4F4", background: isMe ? "rgba(153,204,6,0.08)" : "transparent" }}>
                      <td style={{ padding: "11px 14px", fontWeight: 700, color: "#AAAAB4" }}>{i + 1}</td>
                      <td style={{ padding: "11px 14px" }}>
                        <Link href={`/perfil/${u.id}`} style={{ display: "flex", alignItems: "center", gap: "9px" }}>
                          <span style={{ width: "28px", height: "28px", borderRadius: "50%", background: avatarColor(u.nombre), color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: "11px", flex: "none" }}>
                            {initials(u.nombre)}
                          </span>
                          <span style={{ fontWeight: 700, color: "#262626" }}>{u.nombre ?? "Colaborador"}{isMe ? " · tú" : ""}</span>
                        </Link>
                      </td>
                      <td style={{ padding: "11px 14px", color: "#6b9000", fontWeight: 600 }}>{u.rango}</td>
                      <td style={{ padding: "11px 14px", textAlign: "right", color: "#525252" }}>{u.aportes}</td>
                      <td style={{ padding: "11px 14px", textAlign: "right", color: "#525252" }}>{u.comentarios}</td>
                      <td style={{ padding: "11px 14px", textAlign: "right", color: "#525252" }}>{u.insignias}</td>
                      <td style={{ padding: "11px 14px", textAlign: "right", fontWeight: 700, color: "#262626" }}>{u.puntos.toLocaleString("es")}</td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* badges */}
        <div style={{ background: "#fff", border: "1px solid #E8E8E8", borderRadius: "14px", padding: "18px" }}>
          <div style={{ fontSize: "11px", letterSpacing: ".1em", textTransform: "uppercase", color: "#AAAAB4", fontWeight: 700, marginBottom: "14px" }}>
            Insignias del programa
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
            {badges.map((b: { id: string; nombre: string; descripcion: string | null }) => {
              const unlocked = myBadgeIds.has(b.id);
              return (
                <div
                  key={b.id}
                  title={b.descripcion ?? ""}
                  style={{
                    background: unlocked ? "rgba(153,204,6,0.12)" : "#FAFAFA",
                    border: unlocked ? "1px solid rgba(153,204,6,0.4)" : "1px solid #F0F0EE",
                    borderRadius: "10px",
                    padding: "12px",
                    opacity: unlocked ? 1 : 0.55,
                  }}
                >
                  <div style={{ fontSize: "12.5px", fontWeight: 700, color: "#262626", lineHeight: 1.25 }}>{b.nombre}</div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
