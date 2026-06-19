"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { signUpAction, type AuthResult } from "../actions";
import { corporateEmailSchema } from "@/lib/validation";
import AuthCard, { AuthAlert } from "@/components/auth/AuthCard";
import Field, { Input } from "@/components/ui/Field";
import Button from "@/components/ui/Button";

const initial: AuthResult = {};

export default function RegisterPage() {
  const [state, formAction, pending] = useActionState(signUpAction, initial);

  const [nombre, setNombre] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const mark = (k: string) => setTouched((t) => ({ ...t, [k]: true }));

  const emailParse = corporateEmailSchema.safeParse(email);
  const nombreError =
    touched.nombre && nombre.trim().length < 2 ? "Ingresá tu nombre completo." : undefined;
  const emailError =
    touched.email && !emailParse.success ? emailParse.error.issues[0]?.message : undefined;
  const passwordError =
    touched.password && password.length < 8
      ? "La contraseña debe tener al menos 8 caracteres."
      : undefined;
  const confirmError =
    touched.confirm && confirm !== password ? "Las contraseñas no coinciden." : undefined;

  return (
    <AuthCard
      eyebrow="Sumate al equipo"
      title="Crear cuenta"
      subtitle="Registrate como colaborador para publicar, debatir y priorizar señales de I+D."
    >
      <form action={formAction}>
        {state.error && <AuthAlert tone="error">{state.error}</AuthAlert>}
        {state.success && <AuthAlert tone="success">{state.success}</AuthAlert>}

        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <Field id="nombre" label="Nombre del colaborador" required error={nombreError}>
            <Input
              name="nombre"
              type="text"
              autoComplete="name"
              required
              placeholder="Nombre y apellido"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              onBlur={() => mark("nombre")}
            />
          </Field>

          <Field
            id="email"
            label="Email corporativo"
            required
            error={emailError}
            hint={!emailError ? "Solo correos @doinglobal.com" : undefined}
          >
            <Input
              name="email"
              type="email"
              autoComplete="email"
              required
              placeholder="nombre@doinglobal.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onBlur={() => mark("email")}
            />
          </Field>

          <Field
            id="password"
            label="Contraseña"
            required
            error={passwordError}
            hint={!passwordError ? "Mínimo 8 caracteres" : undefined}
          >
            <Input
              name="password"
              type="password"
              autoComplete="new-password"
              required
              minLength={8}
              placeholder="Mínimo 8 caracteres"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onBlur={() => mark("password")}
            />
          </Field>

          <Field id="confirm" label="Confirmar contraseña" required error={confirmError}>
            <Input
              name="confirm"
              type="password"
              autoComplete="new-password"
              required
              placeholder="Repetí la contraseña"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              onBlur={() => mark("confirm")}
            />
          </Field>
        </div>

        <Button type="submit" block loading={pending} style={{ marginTop: "20px" }}>
          Crear cuenta
        </Button>
      </form>

      <p style={{ fontSize: "13px", color: "var(--fg-secondary)", textAlign: "center", marginTop: "16px", marginBottom: 0 }}>
        ¿Ya tenés cuenta?{" "}
        <Link href="/login" style={{ color: "#6B9000", fontWeight: 700 }}>
          Iniciá sesión
        </Link>
      </p>
    </AuthCard>
  );
}
