"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { updateProfileAction } from "@/app/(app)/actions";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Field, { Input, Textarea } from "@/components/ui/Field";
import { useToast } from "@/components/ui/Toast";

const LIMITS = { nombre: 80, area: 60, bio: 280 };

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
  const toast = useToast();
  const [open, setOpen] = useState(false);
  const [n, setN] = useState(nombre);
  const [b, setB] = useState(bio);
  const [a, setA] = useState(area);
  const [touched, setTouched] = useState(false);
  const [pending, startTransition] = useTransition();

  const nombreError =
    touched && n.trim().length < 2
      ? "Ingresá tu nombre (mínimo 2 caracteres)."
      : undefined;
  const canSave = n.trim().length >= 2;

  function save() {
    setTouched(true);
    if (!canSave) return;
    startTransition(async () => {
      const r = await updateProfileAction({ nombre: n, bio: b, area: a });
      if (r.error) {
        toast.error(r.error);
      } else {
        toast.success("Perfil actualizado");
        router.refresh();
        setOpen(false);
      }
    });
  }

  if (!open) {
    return (
      <Card
        pad="md"
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: "12px",
          flexWrap: "wrap",
        }}
      >
        <span style={{ fontSize: "13.5px", color: "var(--fg-secondary)" }}>
          {perfilCompleto
            ? "Tu perfil está completo."
            : "Completá tu perfil (bio + área) y sumá +20 puntos."}
        </span>
        <Button variant="outline" size="sm" onClick={() => setOpen(true)}>
          Editar perfil
        </Button>
      </Card>
    );
  }

  return (
    <Card pad="lg">
      <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
        <Field
          id="edit-nombre"
          label="Nombre"
          required
          error={nombreError}
          count={{ value: n.length, max: LIMITS.nombre }}
        >
          <Input
            value={n}
            maxLength={LIMITS.nombre}
            onChange={(e) => setN(e.target.value)}
            onBlur={() => setTouched(true)}
          />
        </Field>
        <Field
          id="edit-area"
          label="Área"
          hint="Ej. Innovación Pedagógica"
          count={{ value: a.length, max: LIMITS.area }}
        >
          <Input
            value={a}
            maxLength={LIMITS.area}
            placeholder="Ej. Innovación Pedagógica"
            onChange={(e) => setA(e.target.value)}
          />
        </Field>
        <Field
          id="edit-bio"
          label="Bio"
          hint="Contá en qué te especializás"
          count={{ value: b.length, max: LIMITS.bio }}
        >
          <Textarea
            value={b}
            maxLength={LIMITS.bio}
            rows={3}
            placeholder="Contá en qué te especializás"
            onChange={(e) => setB(e.target.value)}
          />
        </Field>
      </div>
      <div style={{ display: "flex", gap: "8px", justifyContent: "flex-end", marginTop: "16px" }}>
        <Button variant="ghost" size="sm" onClick={() => setOpen(false)}>
          Cerrar
        </Button>
        <Button size="sm" onClick={save} loading={pending} disabled={!canSave}>
          Guardar
        </Button>
      </div>
    </Card>
  );
}
