import Link from "next/link";
import { getFeed, type FeedSort } from "@/lib/data/posts";
import { getLeaderboard } from "@/lib/data/profiles";
import PostCard from "@/components/feed/PostCard";
import FeedControls from "@/components/feed/FeedControls";
import Pagination from "@/components/feed/Pagination";
import EmptyState from "@/components/ui/EmptyState";
import { initials, avatarColor } from "@/lib/ui";

export default async function RadarPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const sp = await searchParams;
  const sort = (sp.sort as FeedSort) ?? "recientes";
  const page = Math.max(1, parseInt(sp.page ?? "1", 10) || 1);

  const [feed, leaders] = await Promise.all([
    getFeed({ sort, categoria: sp.categoria, q: sp.q, page }),
    getLeaderboard(),
  ]);
  const { posts, totalPages, total } = feed;

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "minmax(0, 1fr) 300px",
        gap: "24px",
        alignItems: "start",
      }}
    >
      <div>
        <h1 style={{ fontFamily: "'Poppins', sans-serif", fontSize: "22px", margin: "0 0 4px", color: "#262626", letterSpacing: "-0.01em" }}>
          Radar de enlaces
        </h1>
        <p style={{ color: "#737373", fontSize: "14px", margin: "0 0 20px" }}>
          {sp.q
            ? `${total} resultado${total === 1 ? "" : "s"} para “${sp.q}”`
            : "Señales recientes del equipo de Investigación y Desarrollo."}
        </p>

        <FeedControls sort={sort} categoria={sp.categoria} q={sp.q} />

        {posts.length === 0 ? (
          <EmptyState
            title={sp.q ? "Sin resultados" : "Aún no hay publicaciones"}
            desc={
              sp.q
                ? "Probá con otros términos o limpiá la búsqueda."
                : "Sé el primero en compartir una señal de mercado, una herramienta o una oportunidad para I+D."
            }
            ctaHref={sp.q ? "/radar" : "/publicar"}
            ctaLabel={sp.q ? "Ver todo el radar" : "Publicar enlace"}
          />
        ) : (
          <>
            {posts.map((p) => (
              <PostCard key={p.id} post={p} />
            ))}
            <Pagination
              page={page}
              totalPages={totalPages}
              params={{ sort, categoria: sp.categoria, q: sp.q }}
            />
          </>
        )}
      </div>

      <aside
        style={{
          background: "#fff",
          border: "1px solid #E8E8E8",
          borderRadius: "14px",
          padding: "18px",
          position: "sticky",
          top: "84px",
        }}
      >
        <div style={{ fontSize: "11px", letterSpacing: ".1em", textTransform: "uppercase", color: "#AAAAB4", fontWeight: 700, marginBottom: "12px" }}>
          Top contribuyentes
        </div>
        {leaders.length === 0 ? (
          <p style={{ fontSize: "13px", color: "#AAAAB4", margin: 0 }}>Todavía sin actividad.</p>
        ) : (
          leaders.slice(0, 6).map((u, i) => (
            <Link
              key={u.id}
              href={`/perfil/${u.id}`}
              style={{ display: "flex", alignItems: "center", gap: "10px", padding: "7px 0" }}
            >
              <span style={{ width: "18px", fontSize: "12px", fontWeight: 700, color: "#AAAAB4" }}>{i + 1}</span>
              <span
                style={{
                  width: "30px",
                  height: "30px",
                  borderRadius: "50%",
                  background: avatarColor(u.nombre),
                  color: "#fff",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontWeight: 700,
                  fontSize: "11px",
                  flex: "none",
                }}
              >
                {initials(u.nombre)}
              </span>
              <span style={{ minWidth: 0, flex: 1 }}>
                <span style={{ display: "block", fontSize: "13px", fontWeight: 700, color: "#262626", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                  {u.nombre ?? "Colaborador"}
                </span>
                <span style={{ display: "block", fontSize: "11.5px", color: "#6b9000", fontWeight: 600 }}>
                  {u.rango}
                </span>
              </span>
              <span style={{ fontSize: "13px", fontWeight: 700, color: "#404040" }}>{u.puntos}</span>
            </Link>
          ))
        )}
      </aside>
    </div>
  );
}
