"use client";

import { useState, useTransition } from "react";
import { updateNotifPrefsAction } from "@/app/(app)/actions";
import Card from "@/components/ui/Card";
import { useToast } from "@/components/ui/Toast";
import type { NotifPrefs } from "@/lib/types";

function Switch({
  checked,
  disabled,
  onChange,
  label,
}: {
  checked: boolean;
  disabled?: boolean;
  onChange: (v: boolean) => void;
  label: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      style={{
        width: "42px",
        height: "24px",
        borderRadius: "999px",
        background: checked ? "var(--dg-green)" : "#d4d4d4",
        border: "none",
        cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ? 0.45 : 1,
        position: "relative",
        transition: "background .15s ease",
        flex: "none",
      }}
    >
      <span
        style={{
          position: "absolute",
          top: "3px",
          left: checked ? "21px" : "3px",
          width: "18px",
          height: "18px",
          borderRadius: "50%",
          background: "#fff",
          transition: "left .15s ease",
          boxShadow: "0 1px 2px rgba(0,0,0,.25)",
        }}
      />
    </button>
  );
}

function Row({
  title,
  desc,
  checked,
  disabled,
  onChange,
}: {
  title: string;
  desc: string;
  checked: boolean;
  disabled?: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: "16px",
        padding: "14px 0",
        borderTop: "1px solid var(--dg-gray-100)",
      }}
    >
      <div style={{ flex: 1, minWidth: 0, opacity: disabled ? 0.55 : 1 }}>
        <div style={{ fontSize: "14px", fontWeight: 700, color: "var(--fg-primary)" }}>{title}</div>
        <div style={{ fontSize: "12.5px", color: "var(--fg-secondary)", marginTop: "2px", lineHeight: 1.5 }}>
          {desc}
        </div>
      </div>
      <Switch checked={checked} disabled={disabled} onChange={onChange} label={title} />
    </div>
  );
}

export default function NotifPrefsForm({ initial }: { initial: NotifPrefs }) {
  const toast = useToast();
  const [prefs, setPrefs] = useState<NotifPrefs>(initial);
  const [, startTransition] = useTransition();

  function update(key: keyof NotifPrefs, value: boolean) {
    const prev = prefs;
    setPrefs({ ...prefs, [key]: value });
    startTransition(async () => {
      const r = await updateNotifPrefsAction({ [key]: value });
      if (r.error) {
        setPrefs(prev);
        toast.error(r.error);
      } else {
        toast.success("Preferencias actualizadas");
      }
    });
  }

  const off = !prefs.notif_email_enabled;

  return (
    <Card pad="lg">
      {/* master switch */}
      <div style={{ display: "flex", alignItems: "center", gap: "16px", paddingBottom: "14px" }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: "15px", fontWeight: 700, color: "var(--fg-primary)" }}>
            Recibir correos del Radar I+D
          </div>
          <div style={{ fontSize: "12.5px", color: "var(--fg-secondary)", marginTop: "2px", lineHeight: 1.5 }}>
            Interruptor general. Si lo apagás, no recibís ningún email (los avisos de seguridad de tu cuenta no se ven afectados).
          </div>
        </div>
        <Switch
          checked={prefs.notif_email_enabled}
          onChange={(v) => update("notif_email_enabled", v)}
          label="Recibir correos del Radar I+D"
        />
      </div>

      <Row
        title="Nueva publicación compartida"
        desc="Te avisamos cuando alguien del equipo comparte una nueva señal en el Radar."
        checked={prefs.notif_nueva_publicacion}
        disabled={off}
        onChange={(v) => update("notif_nueva_publicacion", v)}
      />
      <Row
        title="Comentarios en mis publicaciones"
        desc="Cuando alguien comenta una publicación tuya."
        checked={prefs.notif_comentario}
        disabled={off}
        onChange={(v) => update("notif_comentario", v)}
      />
      <Row
        title="Nuevos datos en Datos random"
        desc="Cuando alguien del equipo comparte un libro, artículo, video o dato curioso."
        checked={prefs.notif_nuevo_dato}
        disabled={off}
        onChange={(v) => update("notif_nuevo_dato", v)}
      />
      <Row
        title="Resumen semanal"
        desc="Un solo correo por semana con lo más destacado del Radar."
        checked={prefs.notif_resumen_semanal}
        disabled={off}
        onChange={(v) => update("notif_resumen_semanal", v)}
      />
      <Row
        title="Logros: rango e insignias"
        desc="Cuando subís de rango o ganás una insignia nueva."
        checked={prefs.notif_rango}
        disabled={off}
        onChange={(v) => update("notif_rango", v)}
      />
    </Card>
  );
}
