"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ESTADOS, PRIORIDADES, CATEGORIAS } from "@/lib/constants";
import { updatePostGovernanceAction } from "@/app/(app)/actions";

const sel: React.CSSProperties = {
  width: "100%",
  padding: "8px 10px",
  border: "1px solid #E0DED9",
  borderRadius: "9px",
  fontSize: "13px",
  marginBottom: "8px",
  background: "#fff",
};

export default function GovernanceControls({
  postId,
  estado,
  prioridad,
  categoria,
  marcadoRelevante,
}: {
  postId: string;
  estado: string;
  prioridad: string;
  categoria: string | null;
  marcadoRelevante: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const patch = (p: Parameters<typeof updatePostGovernanceAction>[1]) =>
    startTransition(async () => {
      await updatePostGovernanceAction(postId, p);
      router.refresh();
    });

  return (
    <div style={{ background: "#fff", border: "1px solid #E8E8E8", borderRadius: "14px", padding: "16px" }}>
      <div style={{ fontSize: "11px", letterSpacing: ".1em", textTransform: "uppercase", color: "#AAAAB4", fontWeight: 700, marginBottom: "10px" }}>
        Moderación
      </div>

      <label style={{ fontSize: "12px", fontWeight: 700, color: "#525252" }}>Estado</label>
      <select style={sel} defaultValue={estado} disabled={pending} onChange={(e) => patch({ estado: e.target.value })}>
        {ESTADOS.map((s) => <option key={s.slug} value={s.slug}>{s.nombre}</option>)}
      </select>

      <label style={{ fontSize: "12px", fontWeight: 700, color: "#525252" }}>Prioridad</label>
      <select style={sel} defaultValue={prioridad} disabled={pending} onChange={(e) => patch({ prioridad: e.target.value })}>
        {PRIORIDADES.map((p) => <option key={p.slug} value={p.slug}>{p.nombre}</option>)}
      </select>

      <label style={{ fontSize: "12px", fontWeight: 700, color: "#525252" }}>Categoría</label>
      <select style={sel} defaultValue={categoria ?? ""} disabled={pending} onChange={(e) => patch({ categoria: e.target.value })}>
        <option value="">—</option>
        {CATEGORIAS.map((c) => <option key={c.slug} value={c.slug}>{c.nombre}</option>)}
      </select>

      <label style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "13px", color: "#404040", marginTop: "4px", cursor: "pointer" }}>
        <input
          type="checkbox"
          defaultChecked={marcadoRelevante}
          disabled={pending}
          onChange={(e) => patch({ marcado_relevante: e.target.checked })}
        />
        Marcar como relevante (+25 al autor)
      </label>
    </div>
  );
}
