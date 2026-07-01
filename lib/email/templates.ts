import "server-only";
import type { NotificationTipo } from "@/lib/types";

/**
 * Branded HTML email templates (Radar I+D). Hand-rolled inline-style HTML so we
 * don't pull in a rendering dependency. Every email ends with the shared footer
 * that links to notification preferences and a one-click, no-login unsubscribe.
 */

export interface EmailContent {
  subject: string;
  html: string;
}

interface PostLite {
  id: string;
  titulo: string;
  categoria?: string | null;
  resumen?: string | null;
}

const GREEN = "#6B9000";
const INK = "#1f1f23";
const MUTED = "#737373";
const BORDER = "#e7e7e4";
const BG = "#f5f5f4";

/** Escapes user-provided text before interpolating it into HTML. */
function esc(s: string | null | undefined): string {
  return (s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function appUrl(path = ""): string {
  const base = (process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000").replace(/\/$/, "");
  return base + path;
}

function unsubscribeUrl(token: string, tipo: NotificationTipo): string {
  return appUrl(`/api/notifications/unsubscribe?token=${encodeURIComponent(token)}&tipo=${tipo}`);
}

function button(label: string, href: string): string {
  return `<a href="${href}" style="display:inline-block;background:${GREEN};color:#ffffff;text-decoration:none;font-weight:700;font-size:14px;padding:11px 20px;border-radius:8px;">${esc(label)}</a>`;
}

/** Wraps body content in the shared layout + footer (preferences + unsubscribe). */
function layout(args: {
  token: string;
  tipo: NotificationTipo;
  heading: string;
  bodyHtml: string;
  motivo: string;
}): string {
  const { token, tipo, heading, bodyHtml, motivo } = args;
  return `<!-- preheader -->
<div style="margin:0;padding:0;background:${BG};">
  <div style="max-width:560px;margin:0 auto;padding:24px 16px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:${INK};">
    <div style="font-size:13px;font-weight:700;letter-spacing:.02em;color:${GREEN};margin-bottom:16px;">
      Radar I+D · doinGlobal
    </div>
    <div style="background:#ffffff;border:1px solid ${BORDER};border-radius:14px;padding:28px 26px;">
      <h1 style="font-size:19px;line-height:1.3;margin:0 0 14px;color:${INK};">${esc(heading)}</h1>
      ${bodyHtml}
    </div>
    <div style="font-size:12px;line-height:1.6;color:${MUTED};padding:18px 6px 0;">
      ${esc(motivo)}<br/>
      <a href="${appUrl("/perfil/notificaciones")}" style="color:${MUTED};text-decoration:underline;">Gestionar mis notificaciones</a>
      &nbsp;·&nbsp;
      <a href="${unsubscribeUrl(token, tipo)}" style="color:${MUTED};text-decoration:underline;">Darme de baja de estos avisos</a>
    </div>
  </div>
</div>`;
}

export function nuevaPublicacionEmail(args: {
  post: PostLite;
  autorNombre: string;
  token: string;
}): EmailContent {
  const { post, autorNombre, token } = args;
  const resumen = post.resumen?.trim()
    ? `<p style="font-size:14px;line-height:1.6;color:${MUTED};margin:0 0 18px;">${esc(post.resumen)}</p>`
    : "";
  const bodyHtml = `
    <p style="font-size:14px;line-height:1.6;color:${MUTED};margin:0 0 14px;">
      <strong style="color:${INK};">${esc(autorNombre)}</strong> compartió una nueva señal en el Radar.
    </p>
    <p style="font-size:16px;font-weight:700;line-height:1.4;margin:0 0 6px;color:${INK};">${esc(post.titulo)}</p>
    ${resumen}
    ${button("Ver la publicación", appUrl(`/post/${post.id}`))}
  `;
  return {
    subject: `📡 ${autorNombre} compartió: ${post.titulo}`,
    html: layout({
      token,
      tipo: "nueva_publicacion",
      heading: "Nueva publicación en el Radar",
      bodyHtml,
      motivo: "Recibís este aviso porque alguien de tu equipo compartió una publicación.",
    }),
  };
}

export function nuevoDatoEmail(args: {
  dato: { id: string; titulo: string; descripcion?: string | null };
  autorNombre: string;
  token: string;
}): EmailContent {
  const { dato, autorNombre, token } = args;
  const descripcion = dato.descripcion?.trim()
    ? `<p style="font-size:14px;line-height:1.6;color:${MUTED};margin:0 0 18px;">${esc(dato.descripcion)}</p>`
    : "";
  const bodyHtml = `
    <p style="font-size:14px;line-height:1.6;color:${MUTED};margin:0 0 14px;">
      <strong style="color:${INK};">${esc(autorNombre)}</strong> compartió un nuevo dato en Datos random.
    </p>
    <p style="font-size:16px;font-weight:700;line-height:1.4;margin:0 0 6px;color:${INK};">${esc(dato.titulo)}</p>
    ${descripcion}
    ${button("Ver el dato", appUrl(`/datos/${dato.id}`))}
  `;
  return {
    subject: `🎲 ${autorNombre} compartió un dato: ${dato.titulo}`,
    html: layout({
      token,
      tipo: "nuevo_dato",
      heading: "Nuevo aporte en Datos random",
      bodyHtml,
      motivo: "Recibís este aviso porque alguien del equipo compartió un dato en Datos random.",
    }),
  };
}

export function comentarioEmail(args: {
  post: PostLite;
  comentario: string;
  autorComentario: string;
  token: string;
}): EmailContent {
  const { post, comentario, autorComentario, token } = args;
  const recorte = comentario.length > 280 ? comentario.slice(0, 280) + "…" : comentario;
  const bodyHtml = `
    <p style="font-size:14px;line-height:1.6;color:${MUTED};margin:0 0 14px;">
      <strong style="color:${INK};">${esc(autorComentario)}</strong> comentó tu publicación
      <strong style="color:${INK};">${esc(post.titulo)}</strong>.
    </p>
    <blockquote style="margin:0 0 18px;padding:12px 16px;border-left:3px solid ${GREEN};background:${BG};border-radius:0 8px 8px 0;font-size:14px;line-height:1.6;color:${INK};">
      ${esc(recorte)}
    </blockquote>
    ${button("Responder en el Radar", appUrl(`/post/${post.id}`))}
  `;
  return {
    subject: `💬 ${autorComentario} comentó tu publicación`,
    html: layout({
      token,
      tipo: "comentario",
      heading: "Tienes un comentario nuevo",
      bodyHtml,
      motivo: "Recibís este aviso porque sos el autor de la publicación comentada.",
    }),
  };
}

export function resumenSemanalEmail(args: {
  nombre: string;
  publicaciones: number;
  comentarios: number;
  votos: number;
  topPosts: { id: string; titulo: string; votos: number; comentarios: number }[];
  token: string;
}): EmailContent {
  const { nombre, publicaciones, comentarios, votos, topPosts, token } = args;

  const stat = (n: number, label: string) =>
    `<td style="text-align:center;padding:6px;">
       <div style="font-size:22px;font-weight:700;color:${INK};">${n}</div>
       <div style="font-size:12px;color:${MUTED};">${label}</div>
     </td>`;

  const top = topPosts.length
    ? `<div style="font-size:12px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:${MUTED};margin:6px 0 10px;">Lo más destacado</div>` +
      topPosts
        .map(
          (p) => `<div style="padding:10px 0;border-top:1px solid ${BORDER};">
             <a href="${appUrl(`/post/${p.id}`)}" style="font-size:14px;font-weight:700;color:${INK};text-decoration:none;">${esc(p.titulo)}</a>
             <div style="font-size:12px;color:${MUTED};margin-top:2px;">${p.votos} votos · ${p.comentarios} comentarios</div>
           </div>`,
        )
        .join("")
    : `<p style="font-size:14px;color:${MUTED};margin:0 0 18px;">Esta semana no hubo publicaciones nuevas. ¡Sé el primero en compartir una señal!</p>`;

  const bodyHtml = `
    <p style="font-size:14px;line-height:1.6;color:${MUTED};margin:0 0 18px;">
      Hola ${esc(nombre)}, esto es lo que pasó en el Radar en los últimos 7 días.
    </p>
    <table role="presentation" width="100%" style="border-collapse:collapse;background:${BG};border-radius:10px;margin:0 0 20px;">
      <tr>${stat(publicaciones, "publicaciones")}${stat(comentarios, "comentarios")}${stat(votos, "votos")}</tr>
    </table>
    ${top}
    <div style="margin-top:20px;">${button("Abrir el Radar", appUrl("/radar"))}</div>
  `;
  return {
    subject: "🗓️ Tu resumen semanal del Radar I+D",
    html: layout({
      token,
      tipo: "resumen_semanal",
      heading: "Resumen de la semana",
      bodyHtml,
      motivo: "Recibís este resumen una vez por semana.",
    }),
  };
}

export function rangoEmail(args: {
  token: string;
  rango?: { anterior: string; nuevo: string; puntos: number };
  insignia?: { nombre: string; descripcion?: string | null };
}): EmailContent {
  const { token, rango, insignia } = args;

  if (insignia) {
    const desc = insignia.descripcion
      ? `<p style="font-size:14px;line-height:1.6;color:${MUTED};margin:0 0 18px;">${esc(insignia.descripcion)}</p>`
      : "";
    const bodyHtml = `
      <p style="font-size:14px;line-height:1.6;color:${MUTED};margin:0 0 10px;">¡Ganaste una nueva insignia!</p>
      <p style="font-size:18px;font-weight:700;margin:0 0 6px;color:${GREEN};">🏅 ${esc(insignia.nombre)}</p>
      ${desc}
      ${button("Ver mi perfil", appUrl("/perfil"))}
    `;
    return {
      subject: `🏅 Ganaste la insignia "${insignia.nombre}"`,
      html: layout({
        token,
        tipo: "insignia",
        heading: "Nueva insignia desbloqueada",
        bodyHtml,
        motivo: "Recibís este aviso por tus logros en el Radar.",
      }),
    };
  }

  const r = rango ?? { anterior: "", nuevo: "", puntos: 0 };
  const bodyHtml = `
    <p style="font-size:14px;line-height:1.6;color:${MUTED};margin:0 0 10px;">Subiste de rango por tu participación en el Radar.</p>
    <p style="font-size:18px;font-weight:700;margin:0 0 6px;color:${GREEN};">🏆 ${esc(r.nuevo)}</p>
    <p style="font-size:14px;line-height:1.6;color:${MUTED};margin:0 0 18px;">Pasaste de <strong style="color:${INK};">${esc(r.anterior)}</strong> a <strong style="color:${INK};">${esc(r.nuevo)}</strong> · ${r.puntos} puntos.</p>
    ${button("Ver mi perfil", appUrl("/perfil"))}
  `;
  return {
    subject: `🏆 Subiste a ${r.nuevo} en el Radar I+D`,
    html: layout({
      token,
      tipo: "rango",
      heading: "¡Nuevo rango alcanzado!",
      bodyHtml,
      motivo: "Recibís este aviso por tu progreso en el Radar.",
    }),
  };
}
