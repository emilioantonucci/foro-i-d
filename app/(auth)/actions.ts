"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export interface AuthResult {
  error?: string;
  success?: string;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function signInAction(
  _prev: AuthResult,
  formData: FormData,
): Promise<AuthResult> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (!email || !password) return { error: "Completá email y contraseña." };
  if (!EMAIL_RE.test(email)) return { error: "El email no tiene un formato válido." };

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    return { error: "Credenciales inválidas. Revisá tu email y contraseña." };
  }
  redirect("/radar");
}

export async function signUpAction(
  _prev: AuthResult,
  formData: FormData,
): Promise<AuthResult> {
  const nombre = String(formData.get("nombre") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const confirm = String(formData.get("confirm") ?? "");

  if (!nombre || !email || !password || !confirm) {
    return { error: "Completá todos los campos." };
  }
  if (nombre.length < 2) return { error: "Ingresá tu nombre completo." };
  if (!EMAIL_RE.test(email)) return { error: "El email no tiene un formato válido." };
  if (password.length < 8) {
    return { error: "La contraseña debe tener al menos 8 caracteres." };
  }
  if (password !== confirm) return { error: "Las contraseñas no coinciden." };

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
