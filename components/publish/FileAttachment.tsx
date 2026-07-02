import { FileText, Download } from "lucide-react";

/** Botón de descarga del recurso adjunto (recibe la signed URL ya generada
 *  server-side — el bucket `recursos` es privado). */
export default function FileAttachment({
  url,
  name,
  size,
}: {
  url: string;
  name: string;
  size?: number | null;
}) {
  const pretty =
    size && size > 0
      ? size >= 1024 * 1024
        ? `${(size / (1024 * 1024)).toFixed(1)}MB`
        : `${Math.max(1, Math.round(size / 1024))}KB`
      : null;
  return (
    <a
      href={url}
      download={name}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "9px",
        border: "1px solid var(--border-default)",
        borderRadius: "var(--radius-md)",
        padding: "9px 14px",
        fontSize: "13px",
        fontWeight: 600,
        color: "var(--fg-primary)",
        marginBottom: "14px",
        maxWidth: "100%",
      }}
    >
      <FileText size={16} color="#6B9000" aria-hidden="true" style={{ flex: "none" }} />
      <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
        {name}
      </span>
      {pretty && (
        <span style={{ color: "var(--fg-muted)", fontWeight: 500, flex: "none" }}>{pretty}</span>
      )}
      <Download size={15} color="var(--fg-muted)" aria-hidden="true" style={{ flex: "none" }} />
    </a>
  );
}
