import { Suspense } from "react";
import Link from "next/link";
import { Radar as RadarIcon, SearchX } from "lucide-react";
import { getFeed, type FeedSort } from "@/lib/data/posts";
import { getLeaderboard } from "@/lib/data/profiles";
import SectionTabs from "@/components/feed/SectionTabs";
import PostCard from "@/components/feed/PostCard";
import FeedControls from "@/components/feed/FeedControls";
import Pagination from "@/components/feed/Pagination";
import EmptyState from "@/components/ui/EmptyState";
import Card from "@/components/ui/Card";
import Avatar from "@/components/ui/Avatar";
import ActivityRail from "@/components/feed/ActivityRail";
import { SkelRail } from "@/components/ui/skeletons";

export default async function RadarPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const sp = await searchParams;
  const sort = (sp.sort as FeedSort) ?? "recientes";
  const page = Math.max(1, parseInt(sp.page ?? "1", 10) || 1);

  const feed = await getFeed({ sort, categoria: sp.categoria, q: sp.q, page });
  const { posts, totalPages, total } = feed;

  return (
    <div className="dg-two-col">
      <div>
        <SectionTabs />
        <h1 className="dg-page-title">Radar de enlaces</h1>
        <p className="dg-page-sub">
          {sp.q
            ? `${total} resultado${total === 1 ? "" : "s"} para “${sp.q}”`
            : "Señales recientes del equipo de Investigación y Desarrollo."}
        </p>

        <FeedControls sort={sort} categoria={sp.categoria} q={sp.q} />

        {posts.length === 0 ? (
          <EmptyState
            icon={sp.q ? SearchX : RadarIcon}
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

      <div className="dg-two-col__rail">
        <div style={{ position: "sticky", top: "84px", display: "grid", gap: "14px" }}>
          <Suspense fallback={<SkelRail />}>
            <LeaderRail />
          </Suspense>
          <Suspense fallback={<SkelRail rows={8} />}>
            <ActivityRail />
          </Suspense>
        </div>
      </div>
    </div>
  );
}

async function LeaderRail() {
  const leaders = await getLeaderboard();
  return (
    <Card pad="md">
      <div className="dg-section-label" style={{ marginBottom: "12px" }}>
        Top contribuyentes
      </div>
      {leaders.length === 0 ? (
        <p style={{ fontSize: "13px", color: "var(--fg-muted)", margin: 0 }}>
          Todavía sin actividad.
        </p>
      ) : (
        leaders.slice(0, 6).map((u, i) => (
          <Link
            key={u.id}
            href={`/perfil/${u.id}`}
            style={{ display: "flex", alignItems: "center", gap: "10px", padding: "7px 0" }}
          >
            <span style={{ width: "18px", fontSize: "12px", fontWeight: 700, color: "var(--fg-muted)" }}>
              {i + 1}
            </span>
            <Avatar name={u.nombre} src={u.avatar_url} size={30} title={u.nombre ?? "Colaborador"} />
            <span style={{ minWidth: 0, flex: 1 }}>
              <span
                style={{
                  display: "block",
                  fontSize: "13px",
                  fontWeight: 700,
                  color: "var(--fg-primary)",
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
              >
                {u.nombre ?? "Colaborador"}
              </span>
              <span style={{ display: "block", fontSize: "11.5px", color: "#6B9000", fontWeight: 600 }}>
                {u.rango}
              </span>
            </span>
            <span style={{ fontSize: "13px", fontWeight: 700, color: "var(--dg-gray-700)" }}>
              {u.puntos}
            </span>
          </Link>
        ))
      )}
    </Card>
  );
}
