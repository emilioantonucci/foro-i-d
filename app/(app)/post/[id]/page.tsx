import Link from "next/link";
import { notFound } from "next/navigation";
import { Link2, ArrowLeft } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getPost } from "@/lib/data/posts";
import { getPoll } from "@/lib/data/polls";
import PollWidget from "@/components/polls/PollWidget";
import TriggerQuestions from "@/components/engage/TriggerQuestions";
import VoteButtons from "@/components/post/VoteButtons";
import CommentThread from "@/components/post/CommentThread";
import GovernanceControls from "@/components/post/GovernanceControls";
import AiSynthesis from "@/components/post/AiSynthesis";
import BriefGenerator from "@/components/post/BriefGenerator";
import FileAttachment from "@/components/publish/FileAttachment";
import { Semaphore, StatusBadge, CategoryPill, Hashtags } from "@/components/ui/tags";
import Card from "@/components/ui/Card";
import Avatar from "@/components/ui/Avatar";
import { ESTADOS, tipoMaterialBySlug } from "@/lib/constants";
import { timeAgo } from "@/lib/ui";

export default async function PostPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const post = await getPost(id);
  if (!post) notFound();
  const poll = await getPoll({ postId: id });

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
  const userVotes = user
    ? post.votos.filter((v) => v.user_id === user.id).map((v) => v.tipo_voto)
    : [];

  const autorNombre = post.autor?.nombre ?? "Colaborador";
  const currentOrden = ESTADOS.find((e) => e.slug === post.estado)?.orden ?? 1;
  const tipoMaterial = tipoMaterialBySlug(post.tipo_material);
  const fechaOriginal = post.fecha_original
    ? new Date(`${post.fecha_original}T00:00:00`).toLocaleDateString("es-AR")
    : null;

  // El bucket `recursos` es privado: la descarga usa una signed URL efímera.
  let fileUrl: string | null = null;
  if (post.file_path) {
    const { data: signed } = await supabase.storage
      .from("recursos")
      .createSignedUrl(post.file_path, 3600, { download: post.file_name ?? true });
    fileUrl = signed?.signedUrl ?? null;
  }

  return (
    <div>
      <Link
        href="/radar"
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: "6px",
          fontSize: "13px",
          color: "var(--fg-secondary)",
          fontWeight: 600,
        }}
      >
        <ArrowLeft size={15} aria-hidden="true" /> Volver al radar
      </Link>

      <div className="dg-two-col" style={{ marginTop: "14px" }}>
        {/* MAIN */}
        <div>
          <Card as="article" pad="lg">
            <div style={{ display: "flex", alignItems: "center", gap: "11px", marginBottom: "16px" }}>
              <Avatar name={autorNombre} size={38} title={autorNombre} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: "14px", fontWeight: 700, color: "var(--fg-primary)" }}>
                  {autorNombre}
                </div>
                <div style={{ fontSize: "12px", color: "var(--fg-muted)" }}>
                  {timeAgo(post.created_at)}
                </div>
              </div>
              <Semaphore prioridad={post.prioridad} />
            </div>

            <div style={{ display: "flex", flexWrap: "wrap", gap: "7px", alignItems: "center", marginBottom: "12px" }}>
              <CategoryPill categoria={post.categoria} />
              <StatusBadge estado={post.estado} />
              {tipoMaterial && (
                <span
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    borderRadius: "var(--radius-pill)",
                    padding: "3px 10px",
                    fontSize: "11.5px",
                    fontWeight: 700,
                    color: tipoMaterial.color,
                    background: `${tipoMaterial.color}1A`,
                  }}
                >
                  {tipoMaterial.nombre}
                </span>
              )}
              {fechaOriginal && (
                <span style={{ fontSize: "12px", color: "var(--fg-muted)" }}>
                  Publicado originalmente: {fechaOriginal}
                </span>
              )}
            </div>

            <h1
              style={{
                fontFamily: "var(--font-secondary)",
                fontSize: "25px",
                lineHeight: 1.2,
                margin: "0 0 12px",
                color: "var(--fg-primary)",
                letterSpacing: "-0.01em",
              }}
            >
              {post.titulo}
            </h1>

            {post.url && (
              <a
                href={post.url}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "7px",
                  fontSize: "13.5px",
                  color: "var(--dg-info)",
                  marginBottom: "14px",
                  wordBreak: "break-all",
                }}
              >
                <Link2 size={15} aria-hidden="true" style={{ flex: "none" }} /> {post.url}
              </a>
            )}

            {fileUrl && post.file_name && (
              <div>
                <FileAttachment url={fileUrl} name={post.file_name} size={post.file_size} />
              </div>
            )}

            {post.resumen && (
              <p style={{ fontSize: "15px", color: "var(--dg-gray-700)", lineHeight: 1.6, margin: "8px 0 14px" }}>
                {post.resumen}
              </p>
            )}

            {post.relevancia && (
              <div style={{ borderLeft: "3px solid var(--dg-green)", paddingLeft: "14px", margin: "0 0 16px" }}>
                <div
                  style={{
                    fontSize: "11px",
                    fontWeight: 700,
                    color: "#6B9000",
                    textTransform: "uppercase",
                    letterSpacing: ".08em",
                    marginBottom: "4px",
                  }}
                >
                  Por qué es relevante para I+D
                </div>
                <p style={{ margin: 0, fontSize: "14px", color: "var(--fg-secondary)", lineHeight: 1.55 }}>
                  {post.relevancia}
                </p>
              </div>
            )}

            {post.aplicacion_interna?.length > 0 && (
              <div style={{ display: "flex", flexWrap: "wrap", gap: "7px", marginBottom: "8px" }}>
                {post.aplicacion_interna.map((a) => (
                  <span
                    key={a}
                    style={{
                      background: "var(--dg-gray-100)",
                      borderRadius: "var(--radius-pill)",
                      padding: "4px 11px",
                      fontSize: "12px",
                      fontWeight: 600,
                      color: "var(--dg-gray-700)",
                    }}
                  >
                    {a}
                  </span>
                ))}
              </div>
            )}

            <TriggerQuestions preguntas={post.preguntas ?? []} />

            {poll && <PollWidget poll={poll} />}

            <Hashtags etiquetas={post.etiquetas} />

            <div style={{ marginTop: "18px", paddingTop: "16px", borderTop: "1px solid var(--dg-gray-100)" }}>
              <VoteButtons postId={post.id} counts={counts} userVotes={userVotes} />
            </div>
          </Card>

          <div style={{ marginTop: "16px" }}>
            <AiSynthesis postId={post.id} />
          </div>

          <Card pad="lg" style={{ marginTop: "16px" }}>
            <CommentThread postId={post.id} comments={post.comentarios} />
          </Card>
        </div>

        {/* RIGHT RAIL */}
        <div className="dg-two-col__rail" style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          {isMod && (
            <GovernanceControls
              postId={post.id}
              estado={post.estado}
              prioridad={post.prioridad}
              categoria={post.categoria}
              marcadoRelevante={post.marcado_relevante}
            />
          )}

          <Card pad="md">
            <div className="dg-section-label" style={{ marginBottom: "12px" }}>
              Estado del contenido
            </div>
            <ol style={{ listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column", gap: "10px" }}>
              {ESTADOS.map((e) => {
                const done = e.orden <= currentOrden;
                const isCurrent = e.slug === post.estado;
                return (
                  <li key={e.slug} style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    <span
                      style={{
                        width: "10px",
                        height: "10px",
                        borderRadius: "50%",
                        background: done ? e.color : "var(--border-strong)",
                        flex: "none",
                      }}
                    />
                    <span
                      style={{
                        fontSize: "13px",
                        fontWeight: isCurrent ? 700 : 500,
                        color: isCurrent
                          ? "var(--fg-primary)"
                          : done
                            ? "var(--fg-secondary)"
                            : "var(--fg-muted)",
                      }}
                    >
                      {e.nombre}
                      {isCurrent && <span className="sr-only"> (estado actual)</span>}
                    </span>
                  </li>
                );
              })}
            </ol>
          </Card>

          <BriefGenerator postId={post.id} />
        </div>
      </div>
    </div>
  );
}
