"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Camera } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { updateAvatarAction } from "@/app/(app)/actions";
import { AVATAR_MAX_BYTES, ALLOWED_AVATAR_MIMES } from "@/lib/validation";
import Avatar from "@/components/ui/Avatar";
import Modal from "@/components/ui/Modal";
import ImageCropper from "./ImageCropper";
import { useToast } from "@/components/ui/Toast";

const AVATARS_BUCKET = "avatars";

/**
 * Foto de perfil editable (solo para el dueño del perfil): muestra el avatar
 * actual con un botón de cámara, valida el archivo (≤5MB, imagen), abre el
 * recuadre y sube el recorte a Storage. La subida va DIRECTO del navegador al
 * bucket `avatars` (carpeta {user.id}/ por RLS); el server solo guarda la URL.
 */
export default function AvatarUpload({
  name,
  currentUrl,
  size = 76,
}: {
  name: string;
  currentUrl: string | null;
  size?: number;
}) {
  const router = useRouter();
  const toast = useToast();
  const inputRef = useRef<HTMLInputElement>(null);
  const [pending, setPending] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);

  function pickFile() {
    inputRef.current?.click();
  }

  function onFileSelected(file: File) {
    if (!ALLOWED_AVATAR_MIMES.includes(file.type as (typeof ALLOWED_AVATAR_MIMES)[number])) {
      toast.error("Formato no soportado. Subí una imagen JPG, PNG o WebP.");
      return;
    }
    if (file.size > AVATAR_MAX_BYTES) {
      toast.error("La imagen supera el máximo de 5MB.");
      return;
    }
    setPending(file);
  }

  async function handleConfirm(blob: Blob) {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      toast.error("Tu sesión expiró. Iniciá sesión de nuevo.");
      throw new Error("no-session");
    }

    const path = `${user.id}/${crypto.randomUUID()}.webp`;
    const { error } = await supabase.storage
      .from(AVATARS_BUCKET)
      .upload(path, blob, { contentType: "image/webp", upsert: false });
    if (error) {
      toast.error("No se pudo subir la foto. Probá de nuevo.");
      throw error;
    }

    const r = await updateAvatarAction({ path });
    if (r.error) {
      toast.error(r.error);
      // Best-effort: limpiar el objeto recién subido que no llegó a guardarse.
      try {
        await supabase.storage.from(AVATARS_BUCKET).remove([path]);
      } catch {
        /* huérfano aceptable */
      }
      throw new Error(r.error);
    }

    toast.success("Foto de perfil actualizada");
    setPending(null);
    router.refresh();
  }

  async function removePhoto() {
    setBusy(true);
    try {
      const r = await updateAvatarAction({ path: null });
      if (r.error) {
        toast.error(r.error);
        return;
      }
      toast.success("Foto quitada");
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  const badge = Math.max(22, Math.round(size * 0.34));

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "6px", flex: "none" }}>
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="sr-only"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) onFileSelected(f);
          e.currentTarget.value = "";
        }}
      />

      <button
        type="button"
        onClick={pickFile}
        disabled={busy}
        title="Cambiar foto de perfil"
        aria-label="Cambiar foto de perfil"
        style={{
          position: "relative",
          padding: 0,
          border: "none",
          background: "none",
          cursor: busy ? "default" : "pointer",
          borderRadius: "var(--radius-pill)",
          lineHeight: 0,
          opacity: busy ? 0.6 : 1,
        }}
      >
        <Avatar name={name} src={currentUrl} size={size} title={name} />
        <span
          aria-hidden="true"
          style={{
            position: "absolute",
            right: 0,
            bottom: 0,
            width: badge,
            height: badge,
            borderRadius: "var(--radius-pill)",
            background: "var(--dg-green)",
            border: "2px solid var(--dg-white)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: "var(--shadow-sm, 0 1px 2px rgba(0,0,0,0.2))",
          }}
        >
          <Camera size={Math.round(badge * 0.55)} color="#fff" aria-hidden="true" />
        </span>
      </button>

      {currentUrl && (
        <button
          type="button"
          onClick={removePhoto}
          disabled={busy}
          style={{
            background: "none",
            border: "none",
            padding: 0,
            cursor: busy ? "default" : "pointer",
            fontSize: "12px",
            fontWeight: 600,
            color: "var(--fg-muted)",
            textDecoration: "underline",
          }}
        >
          Quitar foto
        </button>
      )}

      <Modal
        open={pending !== null}
        onClose={() => setPending(null)}
        title="Ajustá tu foto de perfil"
        width={420}
      >
        {pending && (
          <ImageCropper
            file={pending}
            onCancel={() => setPending(null)}
            onConfirm={handleConfirm}
          />
        )}
      </Modal>
    </div>
  );
}
