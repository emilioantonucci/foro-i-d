import type { ActivityEvent, BellNotification } from "@/lib/types";

/**
 * Texto + destino por tipo de evento de actividad. Compartido entre el rail
 * "Actividad reciente" (tercera persona, feed global) y la campanita de
 * notificaciones (misma base + variantes "tu" cuando el evento es sobre
 * contenido del usuario). Sin "server-only": lo consume también el cliente.
 * El título viene snapshoteado en payload; el nombre del actor lo renderiza
 * el componente en negrita adelante.
 */

export interface ActivityText {
  texto: string;
  href: string;
}

export function railText(e: ActivityEvent): ActivityText {
  const p = e.payload;
  const titulo = p.titulo ?? "una publicación";
  switch (e.tipo) {
    case "publico_enlace":
      return { texto: `publicó “${titulo}”`, href: `/post/${e.post_id}` };
    case "publico_dato":
      return { texto: `compartió un dato: “${titulo}”`, href: `/datos/${e.dato_id}` };
    case "comento_enlace":
      return { texto: `comentó en “${titulo}”`, href: `/post/${e.post_id}` };
    case "comento_dato":
      return { texto: `comentó en “${titulo}”`, href: `/datos/${e.dato_id}` };
    case "voto_enlace":
      return {
        texto: p.tipo_voto_nombre
          ? `votó “${p.tipo_voto_nombre}” en “${titulo}”`
          : `votó en “${titulo}”`,
        href: `/post/${e.post_id}`,
      };
    case "like_dato":
      return { texto: `le gustó “${titulo}”`, href: `/datos/${e.dato_id}` };
    case "voto_encuesta":
      return {
        texto: `votó en la encuesta de “${titulo}”`,
        href: e.post_id ? `/post/${e.post_id}` : `/datos/${e.dato_id}`,
      };
    case "insignia":
      return {
        texto: `obtuvo la insignia ${p.badge_nombre ?? ""}`.trim(),
        href: `/perfil/${e.actor_id}`,
      };
    case "rango":
      return {
        texto: `subió a nivel ${p.rango_nuevo ?? ""}`.trim(),
        href: `/perfil/${e.actor_id}`,
      };
  }
}

export function bellText(e: BellNotification): ActivityText {
  const base = railText(e);
  if (!e.es_para_mi) return base;

  const p = e.payload;
  const titulo = p.titulo ?? "una publicación";
  switch (e.tipo) {
    case "comento_enlace":
      return { ...base, texto: `comentó tu enlace “${titulo}”` };
    case "comento_dato":
      return { ...base, texto: `comentó tu dato “${titulo}”` };
    case "voto_enlace":
      return {
        ...base,
        texto: p.tipo_voto_nombre
          ? `votó “${p.tipo_voto_nombre}” en tu enlace “${titulo}”`
          : `votó en tu enlace “${titulo}”`,
      };
    case "like_dato":
      return { ...base, texto: `le dio me gusta a tu dato “${titulo}”` };
    case "voto_encuesta":
      return { ...base, texto: `votó en la encuesta de tu publicación “${titulo}”` };
    default:
      return base;
  }
}
