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
