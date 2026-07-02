"use client";

import { useState } from "react";
import { Sparkles, Copy, Check, Printer, MessageCircle } from "lucide-react";
import type { WeeklyDigest as DigestData } from "@/lib/types";
import Button from "@/components/ui/Button";
import Modal from "@/components/ui/Modal";
import { useToast } from "@/components/ui/Toast";

type Periodo = "diario" | "semanal";

interface DigestResponse {
  ok: boolean;
  error?: string;
  cached?: boolean;
  digest?: DigestData;
  desde?: string;
  hasta?: string;
  postsCount?: number;
}

// El semanal guarda fechas YYYY-MM-DD; el diario ya viene formateado con hora.
const fmt = (v?: string) =>
  v && /^\d{4}-\d{2}-\d{2}$/.test(v)
    ? new Date(`${v}T00:00:00`).toLocaleDateString("es-AR")
    : (v ?? "");

/**
 * Botón + modal del resumen IA del foro. `periodo` elige la crónica: "semanal"
 * (Biblioteca, últimos 7 días del Radar) o "diario" (sidebar, últimas 24 h de
 * Radar + Datos random). Acciones: copiar, guardar PDF (print) y WhatsApp.
 */
export default function DigestButton({
  periodo,
  label,
  shareHref,
  block,
  size = "md",
}: {
  periodo: Periodo;
  label: string;
  /** Path propio que acompaña el texto compartido por WhatsApp. */
  shareHref: string;
  block?: boolean;
  size?: "sm" | "md";
}) {
  const toast = useToast();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<DigestResponse | null>(null);
  const [emptyMsg, setEmptyMsg] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  async function generate() {
    setLoading(true);
    try {
      const r = await fetch("/api/ai/digest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ periodo }),
      });
      const j: DigestResponse = await r.json();
      if (r.status === 400) {
        setEmptyMsg(j.error ?? "No hubo actividad en el período.");
        setData(null);
        setOpen(true);
        return;
      }
      if (!r.ok || !j.ok || !j.digest) {
        throw new Error(j.error ?? "No se pudo generar el resumen.");
      }
      setEmptyMsg(null);
      setData(j);
      setOpen(true);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Error al generar el resumen.");
    } finally {
      setLoading(false);
    }
  }

  function fullText(): string {
    if (!data?.digest) return "";
    const d = data.digest;
    const destacados = d.destacados.length
      ? `\n\nDestacados:\n${d.destacados.map((x) => `• ${x}`).join("\n")}`
      : "";
    return `${d.titulo} (${fmt(data.desde)} – ${fmt(data.hasta)})${destacados}\n\n${d.narrativa}`;
  }

  function copy() {
    navigator.clipboard.writeText(fullText()).then(
      () => {
        setCopied(true);
        toast.success("Resumen copiado al portapapeles.");
        setTimeout(() => setCopied(false), 1500);
      },
      () => toast.error("No se pudo copiar."),
    );
  }

  function printPdf() {
    window.print();
  }

  function shareWhatsApp() {
    if (!data?.digest) return;
    // wa.me abre WhatsApp con el texto listo: versión condensada porque el
    // límite práctico de la URL deja afuera la narrativa completa.
    const corto =
      data.digest.resumenCorto.trim() || data.digest.narrativa.slice(0, 500);
    const texto = `${corto}\n\n${window.location.origin}${shareHref}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(texto)}`, "_blank", "noopener");
  }

  return (
    <>
      <Button
        icon={<Sparkles size={16} aria-hidden="true" />}
        loading={loading}
        onClick={generate}
        block={block}
        size={size}
      >
        {label}
      </Button>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={data?.digest?.titulo ?? (periodo === "diario" ? "Resumen del día" : "Resumen semanal")}
        width={680}
        footer={
          data?.digest ? (
            <>
              <Button
                variant="outline"
                size="sm"
                icon={copied ? <Check size={15} aria-hidden="true" /> : <Copy size={15} aria-hidden="true" />}
                onClick={copy}
              >
                {copied ? "Copiado" : "Copiar"}
              </Button>
              <Button
                variant="outline"
                size="sm"
                icon={<Printer size={15} aria-hidden="true" />}
                onClick={printPdf}
              >
                Guardar PDF
              </Button>
              <Button
                variant="outline"
                size="sm"
                icon={<MessageCircle size={15} aria-hidden="true" />}
                onClick={shareWhatsApp}
              >
                Enviar por WhatsApp
              </Button>
            </>
          ) : undefined
        }
      >
        {emptyMsg ? (
          <p style={{ margin: 0, fontSize: "14px", color: "var(--fg-secondary)", lineHeight: 1.6 }}>
            {periodo === "diario" ? "Día tranquilo" : "Semana tranquila"}: {emptyMsg} Cuando el
            equipo vuelva a publicar, este resumen se arma solo.
          </p>
        ) : data?.digest ? (
          <div className="dg-print-area">
            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                alignItems: "center",
                gap: "8px",
                marginBottom: "14px",
              }}
            >
              <span
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "5px",
                  borderRadius: "var(--radius-pill)",
                  padding: "3px 10px",
                  fontSize: "11.5px",
                  fontWeight: 700,
                  color: "#6B9000",
                  background: "rgba(153,204,6,0.14)",
                }}
              >
                <Sparkles size={12} aria-hidden="true" /> Generado con IA
              </span>
              <span style={{ fontSize: "12px", color: "var(--fg-muted)" }}>
                {fmt(data.desde)} – {fmt(data.hasta)} · {data.postsCount ?? 0} aporte
                {(data.postsCount ?? 0) === 1 ? "" : "s"}
                {data.cached ? " · generado hoy (caché)" : ""}
              </span>
            </div>

            {data.digest.destacados.length > 0 && (
              <ul
                style={{
                  margin: "0 0 14px",
                  paddingLeft: "18px",
                  fontSize: "13.5px",
                  color: "var(--fg-primary)",
                  fontWeight: 600,
                  lineHeight: 1.7,
                }}
              >
                {data.digest.destacados.map((d, i) => (
                  <li key={i}>{d}</li>
                ))}
              </ul>
            )}

            {data.digest.narrativa.split(/\n{2,}/).map((p, i) => (
              <p
                key={i}
                style={{
                  margin: "0 0 12px",
                  fontSize: "14px",
                  color: "var(--dg-gray-700)",
                  lineHeight: 1.65,
                }}
              >
                {p}
              </p>
            ))}
          </div>
        ) : null}
      </Modal>
    </>
  );
}
