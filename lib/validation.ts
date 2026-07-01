import { z } from "zod";

// Radar I+D is an internal corporate space: only doinGlobal accounts may register.
export const ALLOWED_EMAIL_DOMAINS = ["doinglobal.com"];

/** First validation message from a failed safeParse, for single-line errors. */
export function firstError(err: z.ZodError): string {
  return err.issues[0]?.message ?? "Revisá los datos ingresados.";
}

/** Map of field name -> first error message, for per-field display. */
export function fieldErrors(err: z.ZodError): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of err.issues) {
    const key = String(issue.path[0] ?? "");
    if (key && !out[key]) out[key] = issue.message;
  }
  return out;
}

export const emailSchema = z
  .string()
  .trim()
  .min(1, "Ingresá tu email.")
  .pipe(z.email("El email no tiene un formato válido."));

export const corporateEmailSchema = emailSchema.refine(
  (e) => ALLOWED_EMAIL_DOMAINS.includes(e.toLowerCase().split("@")[1] ?? ""),
  "Solo se permite usar un correo corporativo @doinglobal.com."
);

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, "Ingresá tu contraseña."),
});

export const registerSchema = z
  .object({
    nombre: z.string().trim().min(2, "Ingresá tu nombre completo."),
    email: corporateEmailSchema,
    password: z.string().min(8, "La contraseña debe tener al menos 8 caracteres."),
    confirm: z.string(),
  })
  .refine((d) => d.password === d.confirm, {
    message: "Las contraseñas no coinciden.",
    path: ["confirm"],
  });

export const forgotPasswordSchema = z.object({ email: corporateEmailSchema });

export const resetPasswordSchema = z
  .object({
    password: z.string().min(8, "La contraseña debe tener al menos 8 caracteres."),
    confirm: z.string(),
  })
  .refine((d) => d.password === d.confirm, {
    message: "Las contraseñas no coinciden.",
    path: ["confirm"],
  });

export const PUBLISH_LIMITS = { titulo: 140, resumen: 600, relevancia: 600 } as const;

export const publishSchema = z.object({
  titulo: z
    .string()
    .trim()
    .min(5, "El título es muy corto (mínimo 5 caracteres).")
    .max(PUBLISH_LIMITS.titulo, `Máximo ${PUBLISH_LIMITS.titulo} caracteres.`),
  url: z
    .string()
    .trim()
    .pipe(z.url("Ingresá una URL válida (https://…)."))
    .or(z.literal(""))
    .optional(),
  categoria: z.string().min(1, "Elegí una categoría."),
  resumen: z.string().max(PUBLISH_LIMITS.resumen, "El resumen es demasiado largo.").optional(),
  relevancia: z
    .string()
    .max(PUBLISH_LIMITS.relevancia, "El texto de relevancia es demasiado largo.")
    .optional(),
});

// "Datos random" (subforo distendido). Esquema simple: sin categoría
// obligatoria, prioridad ni estado. `tipo` acota la clase de aporte.
export const DATO_LIMITS = { titulo: 140, descripcion: 1200 } as const;

export const DATO_TIPO_SLUGS = [
  "libro",
  "articulo",
  "video",
  "podcast",
  "dato_curioso",
  "recomendacion",
  "otro",
] as const;

export const datoSchema = z.object({
  titulo: z
    .string()
    .trim()
    .min(5, "El título es muy corto (mínimo 5 caracteres).")
    .max(DATO_LIMITS.titulo, `Máximo ${DATO_LIMITS.titulo} caracteres.`),
  tipo: z.enum(DATO_TIPO_SLUGS),
  url: z
    .string()
    .trim()
    .pipe(z.url("Ingresá una URL válida (https://…)."))
    .or(z.literal(""))
    .optional(),
  descripcion: z
    .string()
    .max(DATO_LIMITS.descripcion, "La descripción es demasiado larga.")
    .optional(),
});

export const COMMENT_MAX = 1000;
export const commentSchema = z.object({
  comentario: z
    .string()
    .trim()
    .min(1, "El comentario está vacío.")
    .max(COMMENT_MAX, `Máximo ${COMMENT_MAX} caracteres.`),
});

// Email-notification preferences. Partial so the UI can patch single toggles.
export const notifPrefsSchema = z
  .object({
    notif_email_enabled: z.boolean(),
    notif_nueva_publicacion: z.boolean(),
    notif_comentario: z.boolean(),
    notif_resumen_semanal: z.boolean(),
    notif_rango: z.boolean(),
    notif_nuevo_dato: z.boolean(),
  })
  .partial();
