import Link from "next/link";
import { notFound } from "next/navigation";
import { Link2 } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getPost } from "@/lib/data/posts";
import VoteButtons from "@/components/post/VoteButtons";
import CommentThread from "@/components/post/CommentThread";
import GovernanceControls from "@/components/post/GovernanceControls";
import AiSynthesis from "@/components/post/AiSynthesis";
import BriefGenerator from "@/components/post/BriefGenerator";
import { Semaphore, StatusBadge, CategoryPill, Hashtags } from "@/components/ui/tags";
import { ESTADOS } from "@/lib/constants";
import { initials, avatarColor, timeAgo } from "@/lib/ui";

export default async function PostPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const post = await getPost(id);
  if (!post) notFound();

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { data: me } = user
    ? await supabase.from("profiles").select("rol").eq("id", user.id).maybeSingle()
    : { data: null };
  const isMod = me?.rol === "admin" || me?.rol === "moderador";

  const counts: Record<string, number> = {};
  post.votos.forEach((v) => {
    counts[v.tipo_voto] = (counts[v.tipo_voto] ?? 0) + 1;
  });
  const userVotes = user ? post.votos.filter((v) => v.user_id === user.id).map((v) => v.tipo_voto) : [];

  const autorNombre = post.autor?.nombre ?? "Colaborador";
  const currentOrden = ESTADOS.find((e) => e.slug === post.estado)?.orden ?? 1;

  return (
    <div>
      <Link href="/radar" style={{ fontSize: "13px", color: "#737373", fontWeight: 600 }}>
        ← Volver al radar
      </Link>

      <div style={{ display: "grid", gridTemplateColumns: "minmax(0,1fr) 300px", gap: "24px", alignItems: "start", marginTop: "14px" }}>
        {/* MAIN */}
        <div>
          <article style={{ background: "#fff", border: "1px solid #E8E8E8", borderRadius: "14px", padding: "24px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "11px", marginBottom: "16px" }}>
              <span style={{ width: "38px", height: "38px", borderRadius: "50%", background: avatarColor(autorNombre), color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: "14px", flex: "none" }}>
                {initials(autorNombre)}
              </span>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: "14px", fontWeight: 700, color: "#262626" }}>{autorNombre}</div>
                <div style={{ fontSize: "12px", color: "#AAAAB4" }}>{timeAgo(post.created_at)}</div>
              </div>
              <Semaphore prioridad={post.prioridad} />
            </div>

            <div style={{ display: "flex", flexWrap: "wrap", gap: "7px", marginBottom: "12px" }}>
              <CategoryPill categoria={post.categoria} />
              <StatusBadge estado={post.estado} />
            </div>

            <h1 style={{ fontFamily: "'Poppins', sans-serif", fontSize: "25px", lineHeight: 1.2, margin: "0 0 12px", color: "#262626", letterSpacing: "-0.01em" }}>
              {post.titulo}
            </h1>

            {post.url && (
              <a href={post.url} target="_blank" rel="noopener noreferrer" style={{ display: "inline-flex", alignItems: "center", gap: "7px", fontSize: "13.5px", color: "#30587D", marginBottom: "14px" }}>
                <Link2 size={15} /> {post.url}
              </a>
            )}

            {post.resumen && (
              <p style={{ fontSize: "15px", color: "#404040", lineHeight: 1.6, margin: "8px 0 14px" }}>{post.resumen}</p>
            )}

            {post.relevancia && (
              <div style={{ borderLeft: "3px solid #99CC06", paddingLeft: "14px", margin: "0 0 16px" }}>
                <div style={{ fontSize: "11px", fontWeight: 700, color: "#6b9000", textTransform: "uppercase", letterSpacing: ".08em", marginBottom: "4px" }}>
                  Por qué es relevante para I+D
                </div>
                <p style={{ margin: 0, fontSize: "14px", color: "#525252", lineHeight: 1.55 }}>{post.relevancia}</p>
              </div>
            )}

            {post.aplicacion_interna?.length > 0 && (
              <div style={{ display: "flex", flexWrap: "wrap", gap: "7px", marginBottom: "8px" }}>
                {post.aplicacion_interna.map((a) => (
                  <span key={a} style={{ background: "#F4F4F4", borderRadius: "999px", padding: "4px 11px", fontSize: "12px", fontWeight: 600, color: "#404040" }}>{a}</span>
                ))}
              </div>
            )}

            <Hashtags etiquetas={post.etiquetas} />

            <div style={{ marginTop: "18px", paddingTop: "16px", borderTop: "1px solid #F4F4F4" }}>
              <VoteButtons postId={post.id} counts={counts} userVotes={userVotes} />
            </div>
          </article>

          <div style={{ marginTop: "16px" }}>
            <AiSynthesis postId={post.id} />
          </div>

          <div style={{ background: "#fff", border: "1px solid #E8E8E8", borderRadius: "14px", padding: "22px", marginTop: "16px" }}>
            <CommentThread postId={post.id} comments={post.comentarios} />
          </div>
        </div>

        {/* RIGHT RAIL */}
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          {isMod && (
            <GovernanceControls
              postId={post.id}
              estado={post.estado}
              prioridad={post.prioridad}
              categoria={post.categoria}
              marcadoRelevante={post.marcado_relevante}
            />
          )}

          <div style={{ background: "#fff", border: "1px solid #E8E8E8", borderRadius: "14px", padding: "18px" }}>
            <div style={{ fontSize: "11px", letterSpacing: ".1em", textTransform: "uppercase", color: "#AAAAB4", fontWeight: 700, marginBottom: "12px" }}>
              Estado del contenido
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              {ESTADOS.map((e) => {
                const done = e.orden <= currentOrden;
                const isCurrent = e.slug === post.estado;
                return (
                  <div key={e.slug} style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    <span style={{ width: "10px", height: "10px", borderRadius: "50%", background: done ? e.color : "#E0DED9", flex: "none" }} />
                    <span style={{ fontSize: "13px", fontWeight: isCurrent ? 700 : 500, color: isCurrent ? "#262626" : done ? "#525252" : "#AAAAB4" }}>
                      {e.nombre}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          <BriefGenerator postId={post.id} />
        </div>
      </div>
    </div>
  );
}
