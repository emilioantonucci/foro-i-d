"use server";

import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import {
  loginSchema,
  registerSchema,
  forgotPasswordSchema,
  firstError,
} from "@/lib/validation";

export interface AuthResult {
  error?: string;
  success?: string;
}

export async function signInAction(
  _prev: AuthResult,
  formData: FormData,
): Promise<AuthResult> {
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) return { error: firstError(parsed.error) };

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword(parsed.data);

  if (error) {
    return { error: "Credenciales inválidas. Revisá tu email y contraseña." };
  }
  redirect("/radar");
}

export async function signUpAction(
  _prev: AuthResult,
  formData: FormData,
): Promise<AuthResult> {
  const parsed = registerSchema.safeParse({
    nombre: formData.get("nombre"),
    email: formData.get("email"),
    password: formData.get("password"),
    confirm: formData.get("confirm"),
  });
  if (!parsed.success) return { error: firstError(parsed.error) };

  const { nombre, email, password } = parsed.data;
  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    // `nombre` lands in user_metadata; the handle_new_user() trigger reads it
    // to populate the initial profile row.
    options: { data: { nombre } },
  });

  if (error) {
    return { error: error.message };
  }

  // If email confirmation is disabled (recommended for an internal tool), a
  // session is returned and we go straight to the app.
  if (data.session) {
    redirect("/radar");
  }

  return {
    success:
      "Cuenta creada. Si tu instancia requiere confirmación por email, revisá tu bandeja y luego iniciá sesión.",
  };
}

export async function requestPasswordResetAction(
  _prev: AuthResult,
  formData: FormData,
): Promise<AuthResult> {
  const parsed = forgotPasswordSchema.safeParse({ email: formData.get("email") });
  if (!parsed.success) return { error: firstError(parsed.error) };

  const supabase = await createClient();
  const h = await headers();
  const origin = h.get("origin") ?? (h.get("host") ? `https://${h.get("host")}` : "");
  const { error } = await supabase.auth.resetPasswordForEmail(parsed.data.email, {
    redirectTo: `${origin}/reset-password`,
  });

  // Don't reveal whether the address exists; surface server errors only.
  if (error) return { error: error.message };

  return {
    success:
      "Si el correo está registrado, te enviamos un enlace para restablecer la contraseña.",
  };
}
