import { createAdminClient } from "@/lib/supabase/admin";

// No-login, one-click unsubscribe. The `unsubscribe_token` IS the credential.
// This route is excluded from the auth proxy (see proxy.ts matcher), so it's
// reachable straight from an email footer.
export const dynamic = "force-dynamic";

// Maps a notification type to the preference column it switches off.
const COL_BY_TIPO: Record<string, string> = {
  nueva_publicacion: "notif_nueva_publicacion",
  comentario: "notif_comentario",
  resumen_semanal: "notif_resumen_semanal",
  rango: "notif_rango",
  insignia: "notif_rango",
};

function page(heading: string, message: string, status: number): Response {
  const prefs = `${(process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000").replace(/\/$/, "")}/perfil/notificaciones`;
  const html = `<!doctype html><html lang="es"><head><meta charset="utf-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1"/>
<title>Radar I+D — Notificaciones</title></head>
<body style="margin:0;background:#f5f5f4;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#1f1f23;">
  <div style="max-width:460px;margin:0 auto;padding:64px 20px;">
    <div style="font-size:13px;font-weight:700;color:#6B9000;margin-bottom:18px;">Radar I+D · doinGlobal</div>
    <div style="background:#fff;border:1px solid #e7e7e4;border-radius:14px;padding:28px 26px;">
      <h1 style="font-size:20px;margin:0 0 10px;">${heading}</h1>
      <p style="font-size:14px;line-height:1.6;color:#737373;margin:0 0 18px;">${message}</p>
      <a href="${prefs}" style="display:inline-block;background:#6B9000;color:#fff;text-decoration:none;font-weight:700;font-size:14px;padding:10px 18px;border-radius:8px;">Gestionar mis notificaciones</a>
    </div>
  </div>
</body></html>`;
  return new Response(html, {
    status,
    headers: { "content-type": "text/html; charset=utf-8" },
  });
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const token = url.searchParams.get("token");
  const tipo = url.searchParams.get("tipo") ?? "";

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
