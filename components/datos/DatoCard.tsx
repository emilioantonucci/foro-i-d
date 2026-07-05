import Link from "next/link";
import { MessageSquare, Link2, FileText, BarChart3 } from "lucide-react";
import type { FeedDato } from "@/lib/data/datos";
import { datoTipoBySlug } from "@/lib/constants";
import { timeAgo } from "@/lib/ui";
import Avatar from "@/components/ui/Avatar";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import { Hashtags } from "@/components/ui/tags";
import LikeButton from "./LikeButton";

export default function DatoCard({ dato }: { dato: FeedDato }) {
  const autorNombre = dato.autor?.nombre ?? "Colaborador";
  const tipo = datoTipoBySlug(dato.tipo);

  return (
    <Card as="article" pad="md" hover style={{ marginBottom: "14px" }}>
      {/* header */}
      <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "12px" }}>
        <Avatar name={autorNombre} src={dato.autor?.avatar_url} size={32} title={autorNombre} />
        <div style={{ minWidth: 0, flex: 1 }}>
          <div style={{ fontSize: "13px", fontWeight: 700, color: "var(--fg-primary)" }}>
            {autorNombre}
          </div>
          <div style={{ fontSize: "11.5px", color: "var(--fg-muted)" }}>{timeAgo(dato.created_at)}</div>
        </div>
        {dato.file_name && (
          <span
            title={dato.file_name}
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
        {dato.has_poll && (
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "5px",
              background: "rgba(153,204,6,0.12)",
              borderRadius: "var(--radius-pill)",
              padding: "3px 10px",
              fontSize: "11.5px",
              fontWeight: 600,
              color: "#6B9000",
            }}
          >
            <BarChart3 size={12} aria-hidden="true" /> Encuesta
          </span>
        )}
        {tipo && <Badge color={tipo.color}>{tipo.nombre}</Badge>}
      </div>

      {/* title */}
      <Link href={`/datos/${dato.id}`}>
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
          {dato.titulo}
        </h3>
      </Link>

      {/* url */}
      {dato.url && (
        <a
          href={dato.url}
          target="_blank"
          rel="noopener noreferrer"
          title={dato.url}
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
            {prettyUrl(dato.url)}
          </span>
        </a>
      )}

      {/* descripción */}
      {dato.descripcion && (
        <p className="dg-clamp-3" style={{ margin: "0 0 8px", fontSize: "13px", color: "var(--dg-gray-700)", lineHeight: 1.5 }}>
          {dato.descripcion}
        </p>
      )}

      <Hashtags etiquetas={dato.etiquetas} />

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
        <LikeButton datoId={dato.id} count={dato.likes_count} liked={dato.liked} size="sm" />
        <span
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "6px",
            fontSize: "13px",
            color: "var(--fg-secondary)",
          }}
        >
          <MessageSquare size={15} aria-hidden="true" /> {dato.comentarios_count}
        </span>
        <Link
          href={`/datos/${dato.id}`}
          style={{ marginLeft: "auto", fontSize: "12.5px", fontWeight: 700, color: "var(--fg-primary)" }}
        >
          Ver / comentar →
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
