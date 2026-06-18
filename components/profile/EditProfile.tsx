"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { updateProfileAction } from "@/app/(app)/actions";

const input: React.CSSProperties = {
  width: "100%",
  padding: "10px 12px",
  border: "1px solid #E0DED9",
  borderRadius: "10px",
  fontSize: "14px",
  outline: "none",
  marginBottom: "12px",
};
const label: React.CSSProperties = { display: "block", fontSize: "13px", fontWeight: 700, color: "#404040", marginBottom: "6px" };

export default function EditProfile({
  nombre,
  bio,
  area,
  perfilCompleto,
}: {
  nombre: string;
  bio: string;
  area: string;
  perfilCompleto: boolean;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [n, setN] = useState(nombre);
  const [b, setB] = useState(bio);
  const [a, setA] = useState(area);
  const [msg, setMsg] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function save() {
    setMsg(null);
    startTransition(async () => {
      const r = await updateProfileAction({ nombre: n, bio: b, area: a });
      if (r.error) setMsg(r.error);
      else {
        setMsg("Perfil actualizado.");
        router.refresh();
      }
    });
  }

  if (!open) {
    return (
      <div style={{ background: "#fff", border: "1px solid #E8E8E8", borderRadius: "14px", padding: "16px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span style={{ fontSize: "13.5px", color: "#525252" }}>
          {perfilCompleto ? "Tu perfil está completo." : "Completá tu perfil (bio + área) y sumá +20 puntos."}
        </span>
        <button onClick={() => setOpen(true)} className="dg-btn dg-btn--outline" style={{ fontSize: "13px" }}>
          Editar perfil
        </button>
      </div>
    );
  }

  return (
    <div style={{ background: "#fff", border: "1px solid #E8E8E8", borderRadius: "14px", padding: "20px" }}>
      <label style={label}>Nombre</label>
      <input value={n} onChange={(e) => setN(e.target.value)} style={input} />
      <label style={label}>Área</label>
      <input value={a} onChange={(e) => setA(e.target.value)} placeholder="Ej. Innovación Pedagógica" style={input} />
      <label style={label}>Bio</label>
      <textarea value={b} onChange={(e) => setB(e.target.value)} rows={3} placeholder="Contá en qué te especializás" style={{ ...input, resize: "vertical" }} />
      {msg && <p style={{ fontSize: "12.5px", color: msg.includes("actualizado") ? "#38761D" : "#C62A2F", margin: "0 0 10px" }}>{msg}</p>}
      <div style={{ display: "flex", gap: "8px", justifyContent: "flex-end" }}>
        <button onClick={() => setOpen(false)} className="dg-btn dg-btn--ghost" style={{ fontSize: "13px" }}>Cerrar</button>
        <button onClick={save} disabled={pending} className="dg-btn dg-btn--primary" style={{ fontSize: "13px", opacity: pending ? 0.7 : 1 }}>
          {pending ? "Guardando…" : "Guardar"}
        </button>
      </div>
    </div>
  );
}
