import Link from "next/link";
import { MessageSquare, Link2, Sparkles } from "lucide-react";
import type { FeedPost } from "@/lib/data/posts";
import { initials, avatarColor, timeAgo } from "@/lib/ui";
import { Semaphore, StatusBadge, CategoryPill, Hashtags } from "@/components/ui/tags";
import FeedVote from "./FeedVote";

export default function PostCard({ post }: { post: FeedPost }) {
  const autorNombre = post.autor?.nombre ?? "Colaborador";

  return (
    <article
      style={{
        background: "#fff",
        border: "1px solid #E8E8E8",
        borderRadius: "14px",
        padding: "18px 20px",
        marginBottom: "14px",
      }}
    >
      {/* header */}
      <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "12px" }}>
        <span
          style={{
            width: "32px",
            height: "32px",
            borderRadius: "50%",
            background: avatarColor(autorNombre),
            color: "#fff",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontWeight: 700,
            fontSize: "12px",
            flex: "none",
          }}
        >
          {initials(autorNombre)}
        </span>
        <div style={{ minWidth: 0, flex: 1 }}>
          <div style={{ fontSize: "13px", fontWeight: 700, color: "#262626" }}>{autorNombre}</div>
          <div style={{ fontSize: "11.5px", color: "#AAAAB4" }}>{timeAgo(post.created_at)}</div>
        </div>
        <Semaphore prioridad={post.prioridad} />
      </div>

      {/* tags */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: "7px", marginBottom: "10px" }}>
        <CategoryPill categoria={post.categoria} />
        <StatusBadge estado={post.estado} />
      </div>

      {/* title */}
      <Link href={`/post/${post.id}`}>
        <h3
          style={{
            fontFamily: "'Poppins', sans-serif",
            fontSize: "17px",
            fontWeight: 700,
            color: "#262626",
            margin: "0 0 8px",
            lineHeight: 1.3,
            letterSpacing: "-0.01em",
          }}
        >
          {post.titulo}
        </h3>
      </Link>

      {/* url */}
      {post.url && (
        <a
          href={post.url}
          target="_blank"
          rel="noopener noreferrer"
          style={{ display: "inline-flex", alignItems: "center", gap: "6px", fontSize: "12.5px", color: "#30587D", marginBottom: "10px" }}
        >
          <Link2 size={14} />
          {prettyUrl(post.url)}
        </a>
      )}

      {/* resumen */}
      {post.resumen && (
        <div
          style={{
            background: "rgba(153,204,6,0.10)",
            border: "1px solid rgba(153,204,6,0.30)",
            borderRadius: "10px",
            padding: "10px 12px",
            margin: "4px 0 10px",
          }}
        >
          <div style={{ display: "inline-flex", alignItems: "center", gap: "5px", fontSize: "11px", fontWeight: 700, color: "#6b9000", marginBottom: "4px" }}>
            <Sparkles size={12} /> Resumen
          </div>
          <p style={{ margin: 0, fontSize: "13px", color: "#404040", lineHeight: 1.5 }}>{post.resumen}</p>
        </div>
      )}

      {/* relevancia */}
      {post.relevancia && (
        <p style={{ margin: "0 0 8px", fontSize: "13px", color: "#525252", lineHeight: 1.5, borderLeft: "3px solid #99CC06", paddingLeft: "10px" }}>
          <strong style={{ color: "#404040" }}>Por qué es relevante: </strong>
          {post.relevancia}
        </p>
      )}

      <Hashtags etiquetas={post.etiquetas} />

      {/* footer */}
      <div style={{ display: "flex", alignItems: "center", gap: "14px", marginTop: "14px", paddingTop: "12px", borderTop: "1px solid #F4F4F4" }}>
        <FeedVote postId={post.id} counts={post.votosPorTipo} misVotos={post.misVotos} />
        <span style={{ display: "inline-flex", alignItems: "center", gap: "6px", fontSize: "13px", color: "#737373" }}>
          <MessageSquare size={15} /> {post.comentarios_count}
        </span>
        <Link
          href={`/post/${post.id}`}
          style={{ marginLeft: "auto", fontSize: "12.5px", fontWeight: 700, color: "#262626" }}
        >
          Ver debate →
        </Link>
      </div>
    </article>
  );
}

function prettyUrl(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}
