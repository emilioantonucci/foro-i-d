/**
 * App-level domain types used across components and the data layer.
 * (Generated Supabase types live in `lib/database.types.ts` once the schema
 * is applied; these hand-written types keep the UI decoupled and readable.)
 */

export type Rol = "usuario" | "moderador" | "admin";

export interface Profile {
  id: string;
  nombre: string | null;
  email: string | null;
  rol: Rol;
  avatar_url: string | null;
  bio: string | null;
  area: string | null;
  puntos: number;
  perfil_completo: boolean;
  fecha_registro: string;
  fecha_actualizacion: string;
  // derived server-side (v_profiles view) — optional on raw rows
  rango?: string;
  // email-notification preferences (added in migration 0005) — optional on
  // rows selected before the columns existed / on partial projections
  notif_email_enabled?: boolean;
  notif_nueva_publicacion?: boolean;
  notif_comentario?: boolean;
  notif_resumen_semanal?: boolean;
  notif_rango?: boolean;
  notif_nuevo_dato?: boolean;
  unsubscribe_token?: string;
  // cursor de "visto" de la campanita in-app (migration 0011)
  notif_seen_at?: string;
}

// ----- Email notifications (migration 0005) -----

export type NotificationTipo =
  | "nueva_publicacion"
  | "comentario"
  | "resumen_semanal"
  | "rango"
  | "insignia"
  | "nuevo_dato";

export type NotificationEmailStatus = "pending" | "sent" | "skipped" | "failed";

export interface Notification {
  id: string;
  recipient_id: string;
  tipo: NotificationTipo;
  post_id: string | null;
  dato_id: string | null;
  payload: Record<string, unknown>;
  email_status: NotificationEmailStatus;
  leido: boolean;
  created_at: string;
  sent_at: string | null;
}

/** Per-user toggles backing the preferences UI. Maps 1:1 to profiles columns. */
export interface NotifPrefs {
  notif_email_enabled: boolean;
  notif_nueva_publicacion: boolean;
  notif_comentario: boolean;
  notif_resumen_semanal: boolean;
  notif_rango: boolean;
  notif_nuevo_dato: boolean;
}

// ----- Actividad reciente (migration 0009) — feed global de eventos del
// sidebar. Filas de v_actividad_reciente (evento + actor). -----

export type ActivityTipo =
  | "publico_enlace"
  | "publico_dato"
  | "comento_enlace"
  | "comento_dato"
  | "voto_enlace"
  | "like_dato"
  | "insignia"
  | "rango";

/** Snapshot guardado por los triggers para renderizar sin joins extra. */
export interface ActivityPayload {
  titulo?: string;
  extracto?: string;
  dato_tipo?: string;
  tipo_voto?: string;
  tipo_voto_nombre?: string;
  badge_nombre?: string;
  rango_anterior?: string;
  rango_nuevo?: string;
}

export interface ActivityEvent {
  id: string;
  actor_id: string;
  tipo: ActivityTipo;
  post_id: string | null;
  dato_id: string | null;
  payload: ActivityPayload;
  created_at: string;
  actor_nombre: string | null;
  actor_avatar: string | null;
}

/** Fila de v_notificaciones (migration 0011) — la campanita del Topbar.
 *  es_para_mi: el evento es sobre contenido del usuario que consulta. */
export interface BellNotification extends ActivityEvent {
  es_para_mi: boolean;
}

export interface Post {
  id: string;
  user_id: string;
  titulo: string;
  url: string | null;
  resumen: string | null;
  relevancia: string | null;
  categoria: string | null;
  etiquetas: string[];
  estado: string;
  prioridad: string;
  aplicacion_interna: string[];
  marcado_relevante: boolean;
  created_at: string;
  updated_at: string;
}

export interface Comment {
  id: string;
  post_id: string;
  user_id: string;
  comentario: string;
  created_at: string;
  updated_at: string;
}

export interface Vote {
  id: string;
  post_id: string;
  user_id: string;
  tipo_voto: string;
  created_at: string;
}

// ----- "Datos random" (migration 0006) — subforo distendido, aislado del
// radar. Esquema más simple: sin estado/prioridad/gobernanza. -----

export type DatoTipo =
  | "libro"
  | "articulo"
  | "video"
  | "podcast"
  | "dato_curioso"
  | "recomendacion"
  | "otro";

export interface Dato {
  id: string;
  user_id: string;
  titulo: string;
  tipo: DatoTipo;
  url: string | null;
  descripcion: string | null;
  etiquetas: string[];
  created_at: string;
  updated_at: string;
}

export interface DatoComment {
  id: string;
  dato_id: string;
  user_id: string;
  comentario: string;
  created_at: string;
  updated_at: string;
}

export type AiOutputTipo = "resumen" | "sintesis" | "oportunidad" | "brief";

export interface AiOutput {
  id: string;
  post_id: string | null;
  user_id: string;
  tipo: AiOutputTipo;
  contenido: unknown; // jsonb
  modelo: string | null;
  validado: boolean;
  created_at: string;
}

export interface Badge {
  id: string;
  slug: string;
  nombre: string;
  descripcion: string | null;
  criterio: string | null;
}

// ----- AI output shapes (validated by zod in lib/gemini/schemas.ts) -----

export interface LinkSummary {
  titulo: string;
  resumen: string;
  ideasClave: string[];
  aplicacionIyD: string;
  riesgos: string[];
  etiquetasSugeridas: string[];
  categoriaSugerida: string;
}

export interface DebateSynthesis {
  argumentos: string[];
  consenso: string;
  tension: string;
  proximasAcciones: string[];
  decisionRecomendada: string;
}

export interface Opportunity {
  tipo: string;
  titulo: string;
  justificacion: string;
}

export interface OpportunityReport {
  oportunidades: Opportunity[];
}

export interface Brief {
  tituloOportunidad: string;
  contexto: string;
  evidenciaInterna: string[];
  hipotesisMercado: string;
  aplicacionAcademica: string;
  aplicacionComercial: string;
  riesgos: string[];
  proximosPasos: string[];
}
