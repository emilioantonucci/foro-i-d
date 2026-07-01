import { createAdminClient } from "@/lib/supabase/admin";

// No-login unsubscribe. The `unsubscribe_token` IS the credential. This route is
// excluded from the auth proxy (see proxy.ts matcher), so it's reachable straight
// from an email footer.
//
// Two-step on purpose: GET only SHOWS a confirmation page (it never mutates), so
// link pre-scanners (Outlook SafeLinks, antivirus, chat unfurlers) that fetch the
// URL can't silently unsubscribe anyone. The actual opt-out happens on the POST
// submitted by the confirmation button.
export const dynamic = "force-dynamic";

// Maps a notification type to the preference column it switches off.
const COL_BY_TIPO: Record<string, string> = {
  nueva_publicacion: "notif_nueva_publicacion",
  comentario: "notif_comentario",
  resumen_semanal: "notif_resumen_semanal",
  rango: "notif_rango",
  insignia: "notif_rango",
  nuevo_dato: "notif_nuevo_dato",
};

// Human label per type, for the confirmation copy.
const LABEL_BY_TIPO: Record<string, string> = {
  nueva_publicacion: "los avisos de nuevas publicaciones",
  comentario: "los avisos de comentarios en tus publicaciones",
  resumen_semanal: "el resumen semanal",
  rango: "los avisos de rango e insignias",
  insignia: "los avisos de rango e insignias",
  nuevo_dato: "los avisos de nuevos datos en Datos random",
};

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function shell(heading: string, inner: string, status: number): Response {
  const html = `<!doctype html><html lang="es"><head><meta charset="utf-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1"/>
<title>Radar I+D — Notificaciones</title></head>
<body style="margin:0;background:#f5f5f4;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#1f1f23;">
  <div style="max-width:460px;margin:0 auto;padding:64px 20px;">
    <div style="font-size:13px;font-weight:700;color:#6B9000;margin-bottom:18px;">Radar I+D · doinGlobal</div>
    <div style="background:#fff;border:1px solid #e7e7e4;border-radius:14px;padding:28px 26px;">
      <h1 style="font-size:20px;margin:0 0 10px;">${heading}</h1>
      ${inner}
    </div>
  </div>
</body></html>`;
  return new Response(html, {
    status,
    headers: { "content-type": "text/html; charset=utf-8" },
  });
}

function managePrefsUrl(): string {
  return `${(process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000").replace(/\/$/, "")}/perfil/notificaciones`;
}

/** Simple message page (used for errors and the final confirmation). */
function page(heading: string, message: string, status: number): Response {
  const inner = `<p style="font-size:14px;line-height:1.6;color:#737373;margin:0 0 18px;">${message}</p>
      <a href="${managePrefsUrl()}" style="display:inline-block;background:#6B9000;color:#fff;text-decoration:none;font-weight:700;font-size:14px;padding:10px 18px;border-radius:8px;">Gestionar mis notificaciones</a>`;
  return shell(heading, inner, status);
}

/** Confirmation page: a POST form so the opt-out needs an explicit click. */
function confirmPage(token: string, tipo: string): Response {
  const que = LABEL_BY_TIPO[tipo] ?? "todos los correos del Radar I+D";
  const inner = `<p style="font-size:14px;line-height:1.6;color:#737373;margin:0 0 18px;">¿Confirmás que querés dejar de recibir <strong>${escapeHtml(que)}</strong>? Podés reactivar tus avisos cuando quieras desde tus preferencias.</p>
      <form method="POST" action="/api/notifications/unsubscribe" style="margin:0;">
        <input type="hidden" name="token" value="${escapeHtml(token)}"/>
        <input type="hidden" name="tipo" value="${escapeHtml(tipo)}"/>
        <button type="submit" style="border:none;cursor:pointer;background:#6B9000;color:#fff;font-weight:700;font-size:14px;padding:10px 18px;border-radius:8px;">Confirmar baja</button>
        <a href="${managePrefsUrl()}" style="display:inline-block;margin-left:10px;color:#737373;text-decoration:none;font-weight:600;font-size:14px;padding:10px 4px;">Cancelar</a>
      </form>`;
  return shell("Gestionar notificaciones", inner, 200);
}

/** Looks up the profile id behind an unsubscribe token. */
async function profileIdForToken(token: string): Promise<string | null> {
  let admin;
  try {
    admin = createAdminClient();
  } catch {
    return null;
  }
  const { data: prof } = await admin
    .from("profiles")
    .select("id")
    .eq("unsubscribe_token", token)
    .maybeSingle();
  return prof?.id ?? null;
}

// GET: only renders a confirmation page. Never mutates.
export async function GET(req: Request) {
  const url = new URL(req.url);
  const token = url.searchParams.get("token");
  const tipo = url.searchParams.get("tipo") ?? "";

  if (!token) {
    return page("Enlace inválido", "Falta el identificador de baja en el enlace.", 400);
  }

  const profId = await profileIdForToken(token);
  if (!profId) {
    return page("Enlace inválido", "No encontramos tu suscripción. Es posible que ya te hayas dado de baja.", 404);
  }

  return confirmPage(token, tipo);
}

// POST: performs the opt-out after the explicit confirmation click.
export async function POST(req: Request) {
  let token = "";
  let tipo = "";
  try {
    const form = await req.formData();
    token = String(form.get("token") ?? "");
    tipo = String(form.get("tipo") ?? "");
  } catch {
    return page("No se pudo procesar", "Solicitud inválida.", 400);
  }

  if (!token) {
    return page("Enlace inválido", "Falta el identificador de baja en el enlace.", 400);
  }

  let admin;
  try {
    admin = createAdminClient();
  } catch {
    return page("Servicio no disponible", "Las notificaciones no están configuradas en el servidor.", 500);
  }

  const { data: prof } = await admin
    .from("profiles")
    .select("id")
    .eq("unsubscribe_token", token)
    .maybeSingle();
  if (!prof) {
    return page("Enlace inválido", "No encontramos tu suscripción. Es posible que ya te hayas dado de baja.", 404);
  }

  // Unknown/missing tipo → unsubscribe from ALL emails (master switch off).
  const col = COL_BY_TIPO[tipo] ?? "notif_email_enabled";
  const { error } = await admin.from("profiles").update({ [col]: false }).eq("id", prof.id);
  if (error) {
    return page("No se pudo procesar", "Ocurrió un error al dar de baja. Probá de nuevo en unos minutos.", 500);
  }

  const message =
    col === "notif_email_enabled"
      ? "Listo. No vas a recibir más correos del Radar I+D. Podés reactivarlos cuando quieras desde tus preferencias."
      : "Listo. Te diste de baja de este tipo de aviso. El resto de tus notificaciones siguen activas.";
  return page("Baja confirmada", message, 200);
}
