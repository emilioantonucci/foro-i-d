"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { requestPasswordResetAction, type AuthResult } from "../actions";
import { corporateEmailSchema } from "@/lib/validation";
import AuthCard, { AuthAlert } from "@/components/auth/AuthCard";
import Field, { Input } from "@/components/ui/Field";
import Button from "@/components/ui/Button";

const initial: AuthResult = {};

export default function ForgotPasswordPage() {
  const [state, formAction, pending] = useActionState(requestPasswordResetAction, initial);
  const [email, setEmail] = useState("");
  const [touched, setTouched] = useState(false);

  const parse = corporateEmailSchema.safeParse(email);
  const emailError = touched && !parse.success ? parse.error.issues[0]?.message : undefined;

  return (
    <AuthCard
      eyebrow="Recuperar acceso"
      title="Olvidé mi contraseña"
      subtitle="Ingresá tu email corporativo y te enviamos un enlace para crear una nueva contraseña."
    >
      <form action={formAction}>
        {state.error && <AuthAlert tone="error">{state.error}</AuthAlert>}
        {state.success && <AuthAlert tone="success">{state.success}</AuthAlert>}

        <Field id="email" label="Email corporativo" error={emailError}>
          <Input
            name="email"
            type="email"
            autoComplete="email"
            required
            placeholder="nombre@doinglobal.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onBlur={() => setTouched(true)}
          />
        </Field>

        <Button type="submit" block loading={pending} style={{ marginTop: "20px" }}>
          Enviar enlace
        </Button>
      </form>

      <p style={{ fontSize: "13px", textAlign: "center", marginTop: "16px", marginBottom: 0 }}>
        <Link href="/login" style={{ color: "var(--fg-secondary)" }}>
          ← Volver a iniciar sesión
        </Link>
      </p>
    </AuthCard>
  );
}
