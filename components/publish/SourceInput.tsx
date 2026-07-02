"use client";

import { useRef, useState } from "react";
import { Sparkles, Paperclip, X, FileText } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import {
  FILE_MAX_BYTES,
  FILE_MIME_PDF,
  FILE_MIME_DOCX,
  type ALLOWED_FILE_MIMES,
} from "@/lib/validation";
import type { LinkSummary } from "@/lib/types";
import Field, { Input } from "@/components/ui/Field";
import Button from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";

/** Referencia al archivo ya subido a Storage (el server persiste esto). */
export interface SourceFile {
  path: string;
  name: string;
  mime: (typeof ALLOWED_FILE_MIMES)[number];
  size: number;
}

export type SourceKind = "web" | "pdf" | "docx" | "youtube";

interface SourceInputProps {
  idPrefix: string;
  url: string;
  onUrlChange: (v: string) => void;
  onUrlBlur?: () => void;
  urlError?: string;
  /** Texto ya escrito (resumen/descripción) usado como contexto si no hay URL ni archivo. */
  rawTextFallback?: string;
  file: SourceFile | null;
  onFileChange: (f: SourceFile | null) => void;
  onAnalyzed: (data: LinkSummary, source: SourceKind) => void;
  /** Etiqueta del botón de análisis (el DatoForm usa "IA"). */
  analyzeLabel?: string;
  /** Etiqueta del campo URL. */
  label?: string;
}

function prettySize(bytes: number): string {
  if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
  return `${Math.max(1, Math.round(bytes / 1024))}KB`;
}

function extFor(name: string): "pdf" | "docx" | null {
  const lower = name.toLowerCase();
  if (lower.endsWith(".pdf")) return "pdf";
  if (lower.endsWith(".docx")) return "docx";
  return null;
}

/**
 * URL + "Analizar con IA" + adjunto (PDF/Word). El archivo sube DIRECTO del
 * navegador al bucket privado `recursos` (carpeta {user.id}/ por RLS) — nunca
 * pasa por un server action (Vercel corta los bodies en 4.5MB).
 */
export default function SourceInput({
  idPrefix,
  url,
  onUrlChange,
  onUrlBlur,
  urlError,
  rawTextFallback,
  file,
  onFileChange,
  onAnalyzed,
  analyzeLabel = "Analizar con IA",
  label = "URL del recurso",
}: SourceInputProps) {
  const toast = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);

  async function handleFileSelected(selected: File) {
    const ext = extFor(selected.name);
    if (!ext) {
      toast.error("Solo se aceptan archivos PDF o Word (.docx).");
      return;
    }
    if (selected.size > FILE_MAX_BYTES) {
      toast.error("El archivo supera el máximo de 12MB.");
      return;
    }
    const mime = ext === "pdf" ? FILE_MIME_PDF : FILE_MIME_DOCX;

    setUploading(true);
    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Tu sesión expiró. Iniciá sesión de nuevo.");

      // RLS del bucket exige que la carpeta raíz sea el uid del que sube.
      const path = `${user.id}/${crypto.randomUUID()}.${ext}`;
      const { error } = await supabase.storage
        .from("recursos")
        .upload(path, selected, { contentType: mime, upsert: false });
      if (error) throw new Error("No se pudo subir el archivo. Probá de nuevo.");

      onFileChange({ path, name: selected.name, mime, size: selected.size });
      toast.success("Archivo subido · ya podés analizarlo con IA");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "No se pudo subir el archivo.");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  async function removeFile() {
    if (!file) return;
    onFileChange(null);
    // Best effort: limpiar el objeto huérfano (RLS solo permite borrar lo propio).
    try {
      await createClient().storage.from("recursos").remove([file.path]);
    } catch {
      /* huérfano aceptable */
    }
  }

  async function analizar() {
    if (!file && !url.trim() && !rawTextFallback?.trim()) {
      toast.error("Pegá una URL, subí un archivo o escribí un texto para analizar.");
      return;
    }
    setAnalyzing(true);
    try {
      const res = await fetch("/api/ai/summary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          url: url.trim() || undefined,
          rawText: file ? undefined : rawTextFallback?.trim() || undefined,
          filePath: file?.path,
          fileMime: file?.mime,
          fileName: file?.name,
        }),
      });
      const json = await res.json();
      if (!res.ok || !json.ok) throw new Error(json.error ?? "No se pudo analizar.");
      const source: SourceKind = file
        ? file.mime === FILE_MIME_PDF
          ? "pdf"
          : "docx"
        : /youtu\.?be/.test(url)
          ? "youtube"
          : "web";
      onAnalyzed(json.data as LinkSummary, source);
      toast.success("Análisis listo · revisá y ajustá los campos");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Error al analizar con IA.");
    } finally {
      setAnalyzing(false);
    }
  }

  return (
    <Field
      id={`${idPrefix}-url`}
      label={label}
      error={urlError}
      hint={
        !urlError
          ? "Pegá un enlace (o un video de YouTube), o subí un PDF/Word, y dejá que la IA pre-rellene los campos."
          : undefined
      }
    >
      <div>
        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
          <Input
            type="url"
            value={url}
            onChange={(e) => onUrlChange(e.target.value)}
            onBlur={onUrlBlur}
            placeholder="https://…"
            invalid={!!urlError}
            style={{ flex: 1, minWidth: "200px" }}
          />
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={analizar}
            loading={analyzing}
            icon={!analyzing ? <Sparkles size={15} color="#99CC06" aria-hidden="true" /> : undefined}
          >
            {analyzing ? "Analizando…" : analyzeLabel}
          </Button>
        </div>

        <div style={{ marginTop: "8px", display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
        <input
          ref={fileInputRef}
          id={`${idPrefix}-file`}
          type="file"
          accept=".pdf,.docx"
          className="sr-only"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) void handleFileSelected(f);
          }}
        />
        {file ? (
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "7px",
              background: "rgba(153,204,6,0.10)",
              border: "1px solid rgba(153,204,6,0.35)",
              borderRadius: "var(--radius-pill)",
              padding: "5px 8px 5px 12px",
              fontSize: "12.5px",
              fontWeight: 600,
              color: "var(--fg-primary)",
              maxWidth: "100%",
            }}
          >
            <FileText size={14} color="#6B9000" aria-hidden="true" style={{ flex: "none" }} />
            <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {file.name}
            </span>
            <span style={{ color: "var(--fg-muted)", fontWeight: 500, flex: "none" }}>
              {prettySize(file.size)}
            </span>
            <button
              type="button"
              onClick={() => void removeFile()}
              aria-label={`Quitar archivo ${file.name}`}
              style={{ background: "none", border: "none", padding: 0, display: "flex", cursor: "pointer" }}
            >
              <X size={14} color="var(--fg-muted)" aria-hidden="true" />
            </button>
          </span>
        ) : (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            loading={uploading}
            onClick={() => fileInputRef.current?.click()}
            icon={!uploading ? <Paperclip size={14} aria-hidden="true" /> : undefined}
          >
            {uploading ? "Subiendo…" : "Subir PDF o Word"}
          </Button>
        )}
          {!file && (
            <span style={{ fontSize: "12px", color: "var(--fg-muted)" }}>máx. 12MB</span>
          )}
        </div>
      </div>
    </Field>
  );
}
