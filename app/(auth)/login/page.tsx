"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { signInAction, type AuthResult } from "../actions";
import { emailSchema } from "@/lib/validation";
import AuthCard, { AuthAlert } from "@/components/auth/AuthCard";
import Field, { Input } from "@/components/ui/Field";
import Button from "@/components/ui/Button";

const initial: AuthResult = {};

export default function LoginPage() {
  const [state, formAction, pending] = useActionState(signInAction, initial);
  const [email, setEmail] = useState("");
  const [emailTouched, setEmailTouched] = useState(false);

  const emailParse = emailSchema.safeParse(email);
  const emailError =
    emailTouched && !emailParse.success ? emailParse.error.issues[0]?.message : undefined;

  return (
    <AuthCard
      eyebrow="Acceso al radar"
      title="Iniciar sesión"
      subtitle="Accedé a tu inteligencia colectiva de Investigación y Desarrollo."
    >
      <form action={formAction}>
        {state.error && <AuthAlert tone="error">{state.error}</AuthAlert>}

        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <Field id="email" label="Email corporativo" error={emailError}>
            <Input
              name="email"
              type="email"
              autoComplete="email"
              required
              placeholder="nombre@doinglobal.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onBlur={() => setEmailTouched(true)}
            />
          </Field>

          <Field id="password" label="Contraseña">
            <Input
              name="password"
              type="password"
              autoComplete="current-password"
              required
              placeholder="••••••••"
            />
          </Field>
        </div>

        <Button type="submit" block loading={pending} style={{ marginTop: "20px" }}>
          Ingresar
        </Button>
      </form>

      <p style={{ textAlign: "center", marginTop: "14px", marginBottom: 0 }}>
        <Link href="/forgot-password" style={{ color: "var(--fg-secondary)", fontSize: "13px" }}>
          ¿Olvidaste tu contraseña?
        </Link>
      </p>

      <p style={{ fontSize: "13px", color: "var(--fg-secondary)", textAlign: "center", marginTop: "10px", marginBottom: 0 }}>
        ¿No tenés cuenta?{" "}
        <Link href="/register" style={{ color: "#6B9000", fontWeight: 700 }}>
          Registrate
        </Link>
      </p>
    </AuthCard>
  );
}
