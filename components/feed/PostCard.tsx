import Link from "next/link";
import { MessageSquare, Link2, Sparkles, FileText } from "lucide-react";
import type { FeedPost } from "@/lib/data/posts";
import { timeAgo } from "@/lib/ui";
import Avatar from "@/components/ui/Avatar";
import Card from "@/components/ui/Card";
import { Semaphore, StatusBadge, CategoryPill, Hashtags } from "@/components/ui/tags";
import FeedVote from "./FeedVote";

export default function PostCard({ post }: { post: FeedPost }) {
  const autorNombre = post.autor?.nombre ?? "Colaborador";

  return (
    <Card as="article" pad="md" hover style={{ marginBottom: "14px" }}>
      {/* header */}
      <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "12px" }}>
        <Avatar name={autorNombre} size={32} title={autorNombre} />
        <div style={{ minWidth: 0, flex: 1 }}>
          <div style={{ fontSize: "13px", fontWeight: 700, color: "var(--fg-primary)" }}>
            {autorNombre}
          </div>
          <div style={{ fontSize: "11.5px", color: "var(--fg-muted)" }}>{timeAgo(post.created_at)}</div>
        </div>
        <Semaphore prioridad={post.prioridad} />
      </div>

      {/* tags */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: "7px", marginBottom: "10px" }}>
        <CategoryPill categoria={post.categoria} />
        <StatusBadge estado={post.estado} />
        {post.file_name && (
          <span
            title={post.file_name}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "5px",
              background: "var(--dg-gray-100)",
              borderRadius: "var(--radius-pill)",
              padding: "3px 10px",
              fontSize: "11.5px",
              fontWeight: 600,
              color: "var(--dg-gray-700)",
            }}
          >
            <FileText size={12} aria-hidden="true" /> Adjunto
          </span>
        )}
      </div>

      {/* title */}
      <Link href={`/post/${post.id}`}>
        <h3
          className="dg-clamp-2"
          style={{
            fontFamily: "var(--font-secondary)",
            fontSize: "17px",
            fontWeight: 700,
            color: "var(--fg-primary)",
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
          title={post.url}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "6px",
            fontSize: "12.5px",
            color: "var(--dg-info)",
            marginBottom: "10px",
            maxWidth: "100%",
          }}
        >
          <Link2 size={14} aria-hidden="true" style={{ flex: "none" }} />
          <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {prettyUrl(post.url)}
          </span>
        </a>
      )}

      {/* resumen */}
      {post.resumen && (
        <div
          style={{
            background: "rgba(153,204,6,0.10)",
            border: "1px solid rgba(153,204,6,0.30)",
            borderRadius: "var(--radius-md)",
            padding: "10px 12px",
            margin: "4px 0 10px",
          }}
        >
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "5px",
              fontSize: "11px",
              fontWeight: 700,
              color: "#6B9000",
              marginBottom: "4px",
            }}
          >
            <Sparkles size={12} aria-hidden="true" /> Resumen
          </div>
          <p className="dg-clamp-3" style={{ margin: 0, fontSize: "13px", color: "var(--dg-gray-700)", lineHeight: 1.5 }}>
            {post.resumen}
          </p>
        </div>
      )}

      {/* relevancia */}
      {post.relevancia && (
        <p
          className="dg-clamp-2"
          style={{
            margin: "0 0 8px",
            fontSize: "13px",
            color: "var(--fg-secondary)",
            lineHeight: 1.5,
            borderLeft: "3px solid var(--dg-green)",
            paddingLeft: "10px",
          }}
        >
          <strong style={{ color: "var(--dg-gray-700)" }}>Por qué es relevante: </strong>
          {post.relevancia}
        </p>
      )}

      <Hashtags etiquetas={post.etiquetas} />

      {/* footer */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "14px",
          marginTop: "14px",
          paddingTop: "12px",
          borderTop: "1px solid var(--dg-gray-100)",
          flexWrap: "wrap",
        }}
      >
        <FeedVote postId={post.id} counts={post.votosPorTipo} misVotos={post.misVotos} />
        <span
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "6px",
            fontSize: "13px",
            color: "var(--fg-secondary)",
          }}
        >
          <MessageSquare size={15} aria-hidden="true" /> {post.comentarios_count}
        </span>
        <Link
          href={`/post/${post.id}`}
          style={{ marginLeft: "auto", fontSize: "12.5px", fontWeight: 700, color: "var(--fg-primary)" }}
        >
          Ver debate →
        </Link>
      </div>
    </Card>
  );
}

function prettyUrl(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}
