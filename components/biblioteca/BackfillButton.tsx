"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Wand2 } from "lucide-react";
import Button from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/**
 * Herramienta de admin/mod: clasifica con IA el tipo de material de las
 * publicaciones existentes que no lo tienen, en lotes, hasta terminar.
 * La pausa entre lotes respeta el rate limit de IA por usuario.
 */
export default function BackfillButton() {
  const router = useRouter();
  const toast = useToast();
  const [running, setRunning] = useState(false);
  const [progress, setProgress] = useState<string | null>(null);
  const cancelled = useRef(false);

  async function run() {
    setRunning(true);
    cancelled.current = false;
    let totalProcesados = 0;
    try {
      for (;;) {
        if (cancelled.current) break;
        const r = await fetch("/api/admin/backfill-tipo-material", { method: "POST" });
        const j = await r.json();
        if (r.status === 429) {
          // rate limit de IA: esperar lo que pida el servidor y reintentar
          const wait = parseInt(r.headers.get("Retry-After") ?? "10", 10);
          setProgress(`Esperando ${wait}s por el límite de IA…`);
          await sleep((wait + 1) * 1000);
          continue;
        }
        if (!r.ok || !j.ok) throw new Error(j.error ?? "No se pudo clasificar.");
        totalProcesados += j.procesados;
        if (j.restantes <= 0) break;
        setProgress(`${totalProcesados} clasificadas · ${j.restantes} pendientes…`);
        await sleep(7000);
      }
      toast.success(
        totalProcesados > 0
          ? `Listo: ${totalProcesados} publicaciones clasificadas.`
          : "No había publicaciones sin clasificar.",
      );
      router.refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Error en la clasificación.");
    } finally {
      setRunning(false);
      setProgress(null);
    }
  }

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: "10px",
        flexWrap: "wrap",
        marginTop: "22px",
        paddingTop: "14px",
        borderTop: "1px dashed var(--border-default)",
      }}
    >
      <Button
        variant="outline"
        size="sm"
        icon={<Wand2 size={15} aria-hidden="true" />}
        loading={running}
        onClick={run}
      >
        Clasificar publicaciones antiguas con IA
      </Button>
      <span style={{ fontSize: "12px", color: "var(--fg-muted)" }}>
        {progress ?? "Asigna el tipo de material a las publicaciones que no lo tienen (solo admins)."}
      </span>
    </div>
  );
}
