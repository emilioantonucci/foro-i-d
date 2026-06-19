"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { ESTADOS, PRIORIDADES, CATEGORIAS } from "@/lib/constants";
import { updatePostGovernanceAction } from "@/app/(app)/actions";
import Card from "@/components/ui/Card";
import Field, { Select } from "@/components/ui/Field";
import { useToast } from "@/components/ui/Toast";

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
  const toast = useToast();
  const [pending, startTransition] = useTransition();

  const patch = (p: Parameters<typeof updatePostGovernanceAction>[1]) =>
    startTransition(async () => {
      const r = await updatePostGovernanceAction(postId, p);
      if (r.error) toast.error(r.error);
      else {
        toast.success("Cambios guardados");
        router.refresh();
      }
    });

  return (
    <Card pad="md">
      <div className="dg-section-label" style={{ marginBottom: "12px" }}>
        Moderación
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
        <Field id="gov-estado" label="Estado">
          <Select defaultValue={estado} disabled={pending} onChange={(e) => patch({ estado: e.target.value })}>
            {ESTADOS.map((s) => (
              <option key={s.slug} value={s.slug}>
                {s.nombre}
              </option>
            ))}
          </Select>
        </Field>

        <Field id="gov-prioridad" label="Prioridad">
          <Select defaultValue={prioridad} disabled={pending} onChange={(e) => patch({ prioridad: e.target.value })}>
            {PRIORIDADES.map((p) => (
              <option key={p.slug} value={p.slug}>
                {p.nombre}
              </option>
            ))}
          </Select>
        </Field>

        <Field id="gov-categoria" label="Categoría">
          <Select defaultValue={categoria ?? ""} disabled={pending} onChange={(e) => patch({ categoria: e.target.value })}>
            <option value="">—</option>
            {CATEGORIAS.map((c) => (
              <option key={c.slug} value={c.slug}>
                {c.nombre}
              </option>
            ))}
          </Select>
        </Field>

        <label
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            fontSize: "13px",
            color: "var(--dg-gray-700)",
            marginTop: "2px",
            cursor: "pointer",
          }}
        >
          <input
            type="checkbox"
            defaultChecked={marcadoRelevante}
            disabled={pending}
            onChange={(e) => patch({ marcado_relevante: e.target.checked })}
          />
          Marcar como relevante (+25 al autor)
        </label>
      </div>
    </Card>
  );
}
