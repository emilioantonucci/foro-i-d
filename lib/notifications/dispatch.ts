import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import { emailEnabled, sendBatch, type EmailMessage } from "@/lib/email/client";
import {
  nuevaPublicacionEmail,
  comentarioEmail,
  resumenSemanalEmail,
  rangoEmail,
} from "@/lib/email/templates";

/**
 * Notification dispatch — the trusted server path that reads recipients (via the
 * service-role client, bypassing RLS) and sends emails through Resend, recording
 * every send in the `notifications` outbox.
 *
 * These functions are fire-and-forget: they're invoked from `after()` in server
 * actions and from the cron route, and must NEVER throw back into the caller.
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

type OutboxItem = { id: string; message: EmailMessage };

/** Sends a set of already-built emails and flips their outbox rows to sent/failed. */
async function flushOutbox(admin: any, items: OutboxItem[]): Promise<void> {
  if (items.length === 0) return;
  const sent = await sendBatch(items.map((i) => i.message));
  const status = sent > 0 ? "sent" : "failed";
  await admin
    .from("notifications")
    .update({ email_status: status, sent_at: status === "sent" ? new Date().toISOString() : null })
    .in("id", items.map((i) => i.id));
}

function getAdmin(): any | null {
  if (!emailEnabled()) return null;
  try {
    return createAdminClient();
  } catch (e) {
    console.error("[notif] admin client no disponible:", e instanceof Error ? e.message : e);
    return null;
  }
}

/**
 * INSTANT — a new publication was shared. Notifies every other member who has
 * the preference on. The author never receives their own publication.
 */
export async function dispatchNuevaPublicacion(postId: string, autorId: string): Promise<void> {
  const admin = getAdmin();
  if (!admin) return;
  try {
    const [{ data: post }, { data: autor }] = await Promise.all([
      admin.from("posts").select("id,titulo,categoria,resumen").eq("id", postId).maybeSingle(),
      admin.from("profiles").select("nombre").eq("id", autorId).maybeSingle(),
    ]);
    if (!post) return;
    const autorNombre = autor?.nombre?.trim() || "Alguien del equipo";

    const { data: recipients } = await admin
      .from("profiles")
      .select("id,email,unsubscribe_token")
      .neq("id", autorId)
      .eq("notif_email_enabled", true)
      .eq("notif_nueva_publicacion", true)
      .not("email", "is", null);

    if (!recipients || recipients.length === 0) return;

    const { data: inserted } = await admin
      .from("notifications")
      .insert(
        recipients.map((r: any) => ({
          recipient_id: r.id,
          tipo: "nueva_publicacion",
          post_id: post.id,
          payload: { titulo: post.titulo },
        })),
      )
      .select("id,recipient_id");

    const recMap = new Map(recipients.map((r: any) => [r.id, r]));
    const items: OutboxItem[] = (inserted ?? [])
      .map((n: any) => {
        const r: any = recMap.get(n.recipient_id);
        if (!r?.email) return null;
        const { subject, html } = nuevaPublicacionEmail({ post, autorNombre, token: r.unsubscribe_token });
        return { id: n.id, message: { to: r.email, subject, html } };
      })
      .filter(Boolean) as OutboxItem[];

    await flushOutbox(admin, items);
  } catch (e) {
    console.error("[notif] dispatchNuevaPublicacion falló:", e instanceof Error ? e.message : e);
  }
}

/**
 * INSTANT — someone commented on a post. Notifies the post author (never the
 * commenter themselves), respecting their preferences.
 */
export async function dispatchComentario(postId: string, commentId: string): Promise<void> {
  const admin = getAdmin();
  if (!admin) return;
  try {
    const { data: comment } = await admin
      .from("comments")
      .select("comentario,user_id")
      .eq("id", commentId)
      .maybeSingle();
    if (!comment) return;

    const { data: post } = await admin
      .from("posts")
      .select("id,titulo,user_id")
      .eq("id", postId)
      .maybeSingle();
    if (!post || post.user_id === comment.user_id) return; // no self-notify

    const { data: author } = await admin
      .from("profiles")
      .select("id,email,unsubscribe_token,notif_email_enabled,notif_comentario")
      .eq("id", post.user_id)
      .maybeSingle();
    if (!author?.email || !author.notif_email_enabled || !author.notif_comentario) return;

    const { data: commenter } = await admin
      .from("profiles")
      .select("nombre")
      .eq("id", comment.user_id)
      .maybeSingle();
    const autorComentario = commenter?.nombre?.trim() || "Alguien del equipo";

    const { data: row } = await admin
      .from("notifications")
      .insert({
        recipient_id: author.id,
        tipo: "comentario",
        post_id: post.id,
        payload: { comentario: comment.comentario },
      })
      .select("id")
      .single();
    if (!row) return;

    const { subject, html } = comentarioEmail({
      post,
      comentario: comment.comentario,
      autorComentario,
      token: author.unsubscribe_token,
    });
    await flushOutbox(admin, [{ id: row.id, message: { to: author.email, subject, html } }]);
  } catch (e) {
    console.error("[notif] dispatchComentario falló:", e instanceof Error ? e.message : e);
  }
}

/**
 * Sends any pending rank-up / new-badge notifications (queued by DB triggers)
 * for the given users. Called from points-changing actions (so it's ~instant)
 * and from the weekly cron as a safety net.
 */
export async function flushPendingNotifications(
  userIds: (string | null | undefined)[],
): Promise<void> {
  const admin = getAdmin();
  if (!admin) return;
  const ids = [...new Set(userIds.filter(Boolean) as string[])];
  if (ids.length === 0) return;

  try {
    // Claim atomically: only rows STILL 'pending' flip to 'sending' and are
    // returned, so two concurrent flushes never grab (and email) the same row.
    const { data: claimed } = await admin
      .from("notifications")
      .update({ email_status: "sending" })
      .in("recipient_id", ids)
      .in("tipo", ["rango", "insignia"])
      .eq("email_status", "pending")
      .select("id,recipient_id,tipo,payload");
    if (!claimed || claimed.length === 0) return;

    const recipientIds = [...new Set(claimed.map((p: any) => p.recipient_id))];
    const { data: profs } = await admin
      .from("profiles")
      .select("id,email,unsubscribe_token,notif_email_enabled,notif_rango")
      .in("id", recipientIds);
    const pmap = new Map((profs ?? []).map((p: any) => [p.id, p]));

    const items: OutboxItem[] = [];
    const skipped: string[] = [];

    for (const n of claimed as any[]) {
      const p: any = pmap.get(n.recipient_id);
      if (!p?.email || !p.notif_email_enabled || !p.notif_rango) {
        skipped.push(n.id);
        continue;
      }
      const payload = (n.payload ?? {}) as any;
      const content =
        n.tipo === "insignia"
          ? rangoEmail({
              token: p.unsubscribe_token,
              insignia: { nombre: payload.badge_nombre, descripcion: payload.badge_descripcion },
            })
          : rangoEmail({
              token: p.unsubscribe_token,
              rango: {
                anterior: payload.rango_anterior,
                nuevo: payload.rango_nuevo,
                puntos: payload.puntos,
              },
            });
      items.push({ id: n.id, message: { to: p.email, subject: content.subject, html: content.html } });
    }

    if (skipped.length) {
      await admin.from("notifications").update({ email_status: "skipped" }).in("id", skipped);
    }
    await flushOutbox(admin, items);
  } catch (e) {
    console.error("[notif] flushPendingNotifications falló:", e instanceof Error ? e.message : e);
  }
}

/** Backstop: flush every pending rank/badge notification (used by the cron). */
export async function flushAllPending(): Promise<void> {
  const admin = getAdmin();
  if (!admin) return;
  try {
    // Re-queue rows stuck in 'sending' (a flush died after claiming them).
    const stale = new Date(Date.now() - 10 * 60_000).toISOString();
    await admin
      .from("notifications")
      .update({ email_status: "pending" })
      .eq("email_status", "sending")
      .lt("created_at", stale);

    const { data } = await admin
      .from("notifications")
      .select("recipient_id")
      .in("tipo", ["rango", "insignia"])
      .eq("email_status", "pending");
    const rows = (data ?? []) as { recipient_id: string }[];
    const ids: string[] = [...new Set(rows.map((d) => d.recipient_id))];
    if (ids.length) await flushPendingNotifications(ids);
  } catch (e) {
    console.error("[notif] flushAllPending falló:", e instanceof Error ? e.message : e);
  }
}

/**
 * WEEKLY DIGEST — one email per opted-in member summarizing the last 7 days.
 * Returns counts for the cron route's response. Never throws.
 */
export async function dispatchResumenSemanal(): Promise<{ sent: number; recipients: number }> {
  const admin = getAdmin();
  if (!admin) return { sent: 0, recipients: 0 };
  try {
    const desde = new Date(Date.now() - 7 * 86_400_000).toISOString();
    const [pubs, coms, vots] = await Promise.all([
      admin.from("posts").select("id", { count: "exact", head: true }).gte("created_at", desde),
      admin.from("comments").select("id", { count: "exact", head: true }).gte("created_at", desde),
      admin.from("votes").select("id", { count: "exact", head: true }).gte("created_at", desde),
    ]);
    const publicaciones = pubs.count ?? 0;
    const comentarios = coms.count ?? 0;
    const votos = vots.count ?? 0;

    const { data: topRows } = await admin
      .from("v_feed")
      .select("id,titulo,votos_count,comentarios_count,created_at")
      .gte("created_at", desde)
      .order("votos_count", { ascending: false })
      .order("comentarios_count", { ascending: false })
      .limit(5);
    const topPosts = (topRows ?? []).map((r: any) => ({
      id: r.id,
      titulo: r.titulo,
      votos: r.votos_count ?? 0,
      comentarios: r.comentarios_count ?? 0,
    }));

    const { data: recipients } = await admin
      .from("profiles")
      .select("id,nombre,email,unsubscribe_token")
      .eq("notif_email_enabled", true)
      .eq("notif_resumen_semanal", true)
      .not("email", "is", null);
    if (!recipients || recipients.length === 0) return { sent: 0, recipients: 0 };

    const { data: inserted } = await admin
      .from("notifications")
      .insert(
        recipients.map((r: any) => ({
          recipient_id: r.id,
          tipo: "resumen_semanal",
          payload: { publicaciones, comentarios, votos },
        })),
      )
      .select("id,recipient_id");

    const recMap = new Map(recipients.map((r: any) => [r.id, r]));
    const items: OutboxItem[] = (inserted ?? [])
      .map((n: any) => {
        const r: any = recMap.get(n.recipient_id);
        if (!r?.email) return null;
        const { subject, html } = resumenSemanalEmail({
          nombre: r.nombre?.trim() || "colega",
          publicaciones,
          comentarios,
          votos,
          topPosts,
          token: r.unsubscribe_token,
        });
        return { id: n.id, message: { to: r.email, subject, html } };
      })
      .filter(Boolean) as OutboxItem[];

    await flushOutbox(admin, items);
    return { sent: items.length, recipients: recipients.length };
  } catch (e) {
    console.error("[notif] dispatchResumenSemanal falló:", e instanceof Error ? e.message : e);
    return { sent: 0, recipients: 0 };
  }
}

/* eslint-enable @typescript-eslint/no-explicit-any */
