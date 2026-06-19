"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { resetPasswordSchema } from "@/lib/validation";
import AuthCard, { AuthAlert } from "@/components/auth/AuthCard";
import Field, { Input } from "@/components/ui/Field";
import Button from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";

export default function ResetPasswordPage() {
  const router = useRouter();
  const toast = useToast();
  const [supabase] = useState(() => createClient());
  const [ready, setReady] = useState(false);
  const [sessionOk, setSessionOk] = useState(false);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [serverError, setServerError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    let active = true;
    (async () => {
      // PKCE recovery link: ?code=... → exchange it for a session.
      const code = new URL(window.location.href).searchParams.get("code");
      if (code) {
        try {
          await supabase.auth.exchangeCodeForSession(code);
        } catch {
          /* fall through — getSession below decides validity */
        }
      }
      const { data } = await supabase.auth.getSession();
      if (!active) return;
      setSessionOk(!!data.session);
      setReady(true);
    })();
    return () => {
      active = false;
    };
  }, [supabase]);

  const passwordError =
    touched.password && password.length < 8
      ? "La contraseña debe tener al menos 8 caracteres."
      : undefined;
  const confirmError =
    touched.confirm && confirm !== password ? "Las contraseñas no coinciden." : undefined;

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setTouched({ password: true, confirm: true });
    const parsed = resetPasswordSchema.safeParse({ password, confirm });
    if (!parsed.success) return;
    startTransition(async () => {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) {
        setServerError(error.message);
        toast.error(error.message);
        return;
      }
      toast.success("Contraseña actualizada");
      router.replace("/radar");
    });
  }

  return (
    <AuthCard
      eyebrow="Recuperar acceso"
      title="Nueva contraseña"
      subtitle="Elegí una contraseña nueva para tu cuenta."
    >
      {ready && !sessionOk && (
        <AuthAlert tone="error">
          El enlace de recuperación es inválido o expiró. Pedí uno nuevo desde “Olvidé mi
          contraseña”.
        </AuthAlert>
      )}
      {serverError && <AuthAlert tone="error">{serverError}</AuthAlert>}

      <form onSubmit={submit}>
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <Field
            id="new-password"
            label="Nueva contraseña"
            required
            error={passwordError}
            hint={!passwordError ? "Mínimo 8 caracteres" : undefined}
          >
            <Input
              type="password"
              autoComplete="new-password"
              required
              minLength={8}
              placeholder="Mínimo 8 caracteres"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onBlur={() => setTouched((t) => ({ ...t, password: true }))}
            />
          </Field>

          <Field id="confirm-password" label="Confirmar contraseña" required error={confirmError}>
            <Input
              type="password"
              autoComplete="new-password"
              required
              placeholder="Repetí la contraseña"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              onBlur={() => setTouched((t) => ({ ...t, confirm: true }))}
            />
          </Field>
        </div>

        <Button
          type="submit"
          block
          loading={pending}
          disabled={ready && !sessionOk}
          style={{ marginTop: "20px" }}
        >
          Guardar contraseña
        </Button>
      </form>
    </AuthCard>
  );
}
