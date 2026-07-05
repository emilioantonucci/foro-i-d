"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ZoomOut, ZoomIn } from "lucide-react";
import Button from "@/components/ui/Button";

/** Lado del recuadre en px (área que "entra" como foto). */
const VIEWPORT = 288;
/** Resolución del recorte final (cuadrado). */
const OUTPUT = 512;
const MIN_ZOOM = 1;
const MAX_ZOOM = 4;

interface Offset {
  x: number;
  y: number;
}

/**
 * Recuadre estilo redes sociales: la imagen se puede arrastrar y hacer zoom
 * dentro de un marco circular; solo lo que queda dentro del cuadro del marco se
 * exporta. El clamp impide que la imagen deje de cubrir el marco (no se puede
 * arrastrar "fuera de los parámetros"). Devuelve un Blob WebP de 512×512.
 */
export default function ImageCropper({
  file,
  onCancel,
  onConfirm,
}: {
  file: File;
  onCancel: () => void;
  /** Puede ser async: el cropper espera a que termine (subida) antes de
   *  soltar el estado de "guardando". Si rechaza, permite reintentar. */
  onConfirm: (blob: Blob) => void | Promise<void>;
}) {
  const [url, setUrl] = useState<string | null>(null);
  const [natural, setNatural] = useState<{ w: number; h: number } | null>(null);
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState<Offset>({ x: 0, y: 0 });
  const [saving, setSaving] = useState(false);

  const imgRef = useRef<HTMLImageElement>(null);
  const drag = useRef<{ px: number; py: number; ox: number; oy: number } | null>(null);

  // Object URL de la imagen elegida (se revoca al desmontar / cambiar archivo).
  useEffect(() => {
    const u = URL.createObjectURL(file);
    setUrl(u);
    return () => URL.revokeObjectURL(u);
  }, [file]);

  const baseScale = natural
    ? Math.max(VIEWPORT / natural.w, VIEWPORT / natural.h)
    : 1;
  const scale = baseScale * zoom;
  const dispW = natural ? natural.w * scale : VIEWPORT;
  const dispH = natural ? natural.h * scale : VIEWPORT;

  const clamp = useCallback(
    (o: Offset, w: number, h: number): Offset => ({
      x: Math.min(0, Math.max(VIEWPORT - w, o.x)),
      y: Math.min(0, Math.max(VIEWPORT - h, o.y)),
    }),
    [],
  );

  function onImgLoad(e: React.SyntheticEvent<HTMLImageElement>) {
    const img = e.currentTarget;
    const w = img.naturalWidth;
    const h = img.naturalHeight;
    setNatural({ w, h });
    const bs = Math.max(VIEWPORT / w, VIEWPORT / h);
    const dw = w * bs;
    const dh = h * bs;
    // Centrado inicial.
    setZoom(1);
    setOffset({ x: (VIEWPORT - dw) / 2, y: (VIEWPORT - dh) / 2 });
  }

  // ---- arrastrar (pointer events, con pointer capture) ----
  function onPointerDown(e: React.PointerEvent) {
    if (!natural) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    drag.current = { px: e.clientX, py: e.clientY, ox: offset.x, oy: offset.y };
  }
  function onPointerMove(e: React.PointerEvent) {
    if (!drag.current) return;
    const next = {
      x: drag.current.ox + (e.clientX - drag.current.px),
      y: drag.current.oy + (e.clientY - drag.current.py),
    };
    setOffset(clamp(next, dispW, dispH));
  }
  function onPointerUp(e: React.PointerEvent) {
    drag.current = null;
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {
      /* noop */
    }
  }

  // Cambio de zoom manteniendo fijo el punto bajo el centro del marco.
  const applyZoom = useCallback(
    (nextZoom: number) => {
      if (!natural) return;
      const z = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, nextZoom));
      const c = VIEWPORT / 2;
      const s0 = baseScale * zoom;
      const s1 = baseScale * z;
      const nx = (c - offset.x) / s0;
      const ny = (c - offset.y) / s0;
      const next = { x: c - nx * s1, y: c - ny * s1 };
      const w = natural.w * s1;
      const h = natural.h * s1;
      setZoom(z);
      setOffset(clamp(next, w, h));
    },
    [natural, baseScale, zoom, offset, clamp],
  );

  function onWheel(e: React.WheelEvent) {
    if (!natural) return;
    e.preventDefault();
    applyZoom(zoom * (e.deltaY < 0 ? 1.08 : 0.92));
  }

  async function confirm() {
    const img = imgRef.current;
    if (!img || !natural) return;
    setSaving(true);
    try {
      const canvas = document.createElement("canvas");
      canvas.width = OUTPUT;
      canvas.height = OUTPUT;
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("Canvas no disponible.");
      // Fondo blanco por si la imagen origen tiene transparencia (PNG).
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, OUTPUT, OUTPUT);
      // Región de la imagen natural que cae dentro del marco.
      const sx = -offset.x / scale;
      const sy = -offset.y / scale;
      const sSize = VIEWPORT / scale;
      ctx.imageSmoothingQuality = "high";
      ctx.drawImage(img, sx, sy, sSize, sSize, 0, 0, OUTPUT, OUTPUT);

      const blob = await new Promise<Blob | null>((resolve) =>
        canvas.toBlob((b) => resolve(b), "image/webp", 0.85),
      );
      if (!blob) throw new Error("No se pudo procesar la imagen.");
      await onConfirm(blob);
    } catch {
      setSaving(false);
    }
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "16px", alignItems: "center" }}>
      <div
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        onWheel={onWheel}
        style={{
          position: "relative",
          width: VIEWPORT,
          height: VIEWPORT,
          maxWidth: "100%",
          borderRadius: "var(--radius-md)",
          overflow: "hidden",
          background: "var(--dg-gray-100)",
          cursor: drag.current ? "grabbing" : "grab",
          touchAction: "none",
          userSelect: "none",
        }}
      >
        {url && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            ref={imgRef}
            src={url}
            alt=""
            onLoad={onImgLoad}
            draggable={false}
            style={{
              position: "absolute",
              left: offset.x,
              top: offset.y,
              width: dispW,
              height: dispH,
              maxWidth: "none",
              pointerEvents: "none",
            }}
          />
        )}
        {/* máscara circular: oscurece lo que queda fuera del marco */}
        <div
          aria-hidden="true"
          style={{
            position: "absolute",
            inset: 0,
            borderRadius: "50%",
            boxShadow: "0 0 0 9999px rgba(0,0,0,0.45)",
            border: "2px solid rgba(255,255,255,0.9)",
            pointerEvents: "none",
          }}
        />
      </div>

      {/* control de zoom */}
      <div style={{ display: "flex", alignItems: "center", gap: "10px", width: "100%", maxWidth: VIEWPORT }}>
        <ZoomOut size={16} color="var(--fg-muted)" aria-hidden="true" style={{ flex: "none" }} />
        <input
          type="range"
          min={MIN_ZOOM}
          max={MAX_ZOOM}
          step={0.01}
          value={zoom}
          onChange={(e) => applyZoom(Number(e.target.value))}
          aria-label="Zoom de la foto"
          style={{ flex: 1 }}
        />
        <ZoomIn size={16} color="var(--fg-muted)" aria-hidden="true" style={{ flex: "none" }} />
      </div>

      <p style={{ margin: 0, fontSize: "12px", color: "var(--fg-muted)", textAlign: "center" }}>
        Arrastrá para reposicionar y usá el zoom. Lo que quede dentro del círculo será tu foto.
      </p>

      <div style={{ display: "flex", gap: "8px", justifyContent: "flex-end", width: "100%" }}>
        <Button variant="ghost" size="sm" onClick={onCancel} disabled={saving}>
          Cancelar
        </Button>
        <Button size="sm" onClick={confirm} loading={saving} disabled={!natural}>
          Guardar foto
        </Button>
      </div>
    </div>
  );
}
