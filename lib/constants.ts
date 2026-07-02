/**
 * Canonical domain vocabularies. These mirror the Supabase lookup tables
 * (categorias / estados / prioridades / tipos_voto) seeded in the migration,
 * and are used directly by the UI for selects, filters and pills.
 *
 * Keep this file and `supabase/migrations` seed data in sync.
 */

export interface Categoria {
  slug: string;
  nombre: string;
}

export const CATEGORIAS: Categoria[] = [
  { slug: "tendencias_mercado", nombre: "Tendencias de mercado" },
  { slug: "inteligencia_artificial", nombre: "Inteligencia artificial" },
  { slug: "educacion_superior", nombre: "Educación superior" },
  { slug: "legaltech", nombre: "Legaltech" },
  { slug: "ciberseguridad", nombre: "Ciberseguridad" },
  { slug: "compliance", nombre: "Compliance" },
  { slug: "finanzas_banca", nombre: "Finanzas y banca" },
  { slug: "salud", nombre: "Salud" },
  { slug: "innovacion_pedagogica", nombre: "Innovación pedagógica" },
  { slug: "competencia", nombre: "Competencia" },
  { slug: "oportunidades_programas", nombre: "Oportunidades de nuevos programas" },
  { slug: "herramientas_digitales", nombre: "Herramientas digitales" },
  { slug: "casos_exito", nombre: "Casos de éxito" },
  { slug: "regulacion_normativa", nombre: "Regulación y normativa" },
  { slug: "investigacion_academica", nombre: "Investigación académica" },
];

export interface Estado {
  slug: string;
  nombre: string;
  orden: number;
  color: string;
}

// `orden` encodes the content lifecycle (used by the status timeline + funnel).
export const ESTADOS: Estado[] = [
  { slug: "nuevo", nombre: "Nuevo", orden: 1, color: "#FFBA1A" },
  { slug: "en_revision", nombre: "En revisión", orden: 2, color: "#30587D" },
  { slug: "validado", nombre: "Validado", orden: 3, color: "#99CC06" },
  { slug: "en_analisis", nombre: "En análisis", orden: 4, color: "#30587D" },
  { slug: "convertido_insumo", nombre: "Convertido en insumo", orden: 5, color: "#6b9000" },
  { slug: "derivado_proyecto", nombre: "Derivado a proyecto", orden: 6, color: "#38761D" },
  { slug: "archivado", nombre: "Archivado", orden: 7, color: "#AAAAB4" },
  { slug: "descartado", nombre: "Descartado", orden: 8, color: "#C62A2F" },
];

export interface Prioridad {
  slug: string;
  nombre: string;
  orden: number;
  color: string; // semaphore color
}

export const PRIORIDADES: Prioridad[] = [
  { slug: "baja", nombre: "Baja", orden: 1, color: "#99CC06" },
  { slug: "media", nombre: "Media", orden: 2, color: "#FFBA1A" },
  { slug: "alta", nombre: "Alta", orden: 3, color: "#FF8A1A" },
  { slug: "critica", nombre: "Crítica", orden: 4, color: "#C62A2F" },
];

export interface TipoVoto {
  slug: string;
  nombre: string;
  es_positivo: boolean;
  icon: string; // lucide icon name
}

export const TIPOS_VOTO: TipoVoto[] = [
  { slug: "util", nombre: "Útil", es_positivo: true, icon: "thumbs-up" },
  { slug: "relevante", nombre: "Relevante", es_positivo: true, icon: "star" },
  { slug: "prioritario", nombre: "Prioritario", es_positivo: true, icon: "flame" },
  { slug: "requiere_analisis", nombre: "Requiere análisis", es_positivo: true, icon: "search" },
  { slug: "descartar", nombre: "Descartar", es_positivo: false, icon: "x" },
];

// "Datos random" — tipos de aporte distendido (select del formulario + badge).
export interface DatoTipoMeta {
  slug: string;
  nombre: string;
  color: string; // badge tint
}

export const DATO_TIPOS: DatoTipoMeta[] = [
  { slug: "libro", nombre: "Libro", color: "#6B9000" },
  { slug: "articulo", nombre: "Artículo", color: "#30587D" },
  { slug: "video", nombre: "Video", color: "#C62A2F" },
  { slug: "podcast", nombre: "Podcast", color: "#8A4FBF" },
  { slug: "dato_curioso", nombre: "Dato curioso", color: "#FF8A1A" },
  { slug: "recomendacion", nombre: "Recomendación", color: "#1F9E8F" },
  { slug: "otro", nombre: "Otro", color: "#8A8A90" },
];

// Biblioteca de links — tipo de material del recurso publicado.
// Keep in sync con chk_posts_tipo_material (migration 0015).
export interface TipoMaterialMeta {
  slug: string;
  nombre: string;
  color: string; // badge tint
}

export const TIPOS_MATERIAL: TipoMaterialMeta[] = [
  { slug: "paper", nombre: "Paper", color: "#8A4FBF" },
  { slug: "informe", nombre: "Informe", color: "#30587D" },
  { slug: "estadistica", nombre: "Estadística", color: "#1F9E8F" },
  { slug: "noticia", nombre: "Noticia", color: "#FF8A1A" },
  { slug: "articulo", nombre: "Artículo", color: "#6B9000" },
  { slug: "video", nombre: "Video", color: "#C62A2F" },
  { slug: "podcast", nombre: "Podcast", color: "#B0468C" },
  { slug: "herramienta", nombre: "Herramienta", color: "#38761D" },
  { slug: "curso", nombre: "Curso", color: "#FFBA1A" },
  { slug: "libro", nombre: "Libro", color: "#7A5C3E" },
  { slug: "otro", nombre: "Otro", color: "#8A8A90" },
];

// Suggested "posible aplicación interna" options (multi-select in the create form).
export const APLICACIONES_INTERNAS: string[] = [
  "Nuevo certificado / programa",
  "Mejora de contenido",
  "Argumento comercial",
  "Benchmark competitivo",
  "Insumo de investigación",
];

// --- lookup helpers -------------------------------------------------------
export const nombreCategoria = (slug?: string | null) =>
  CATEGORIAS.find((c) => c.slug === slug)?.nombre ?? slug ?? "";
export const estadoBySlug = (slug?: string | null) =>
  ESTADOS.find((e) => e.slug === slug);
export const prioridadBySlug = (slug?: string | null) =>
  PRIORIDADES.find((p) => p.slug === slug);
export const tipoVotoBySlug = (slug?: string | null) =>
  TIPOS_VOTO.find((t) => t.slug === slug);
export const datoTipoBySlug = (slug?: string | null) =>
  DATO_TIPOS.find((t) => t.slug === slug);
export const nombreDatoTipo = (slug?: string | null) =>
  DATO_TIPOS.find((t) => t.slug === slug)?.nombre ?? slug ?? "";
export const tipoMaterialBySlug = (slug?: string | null) =>
  TIPOS_MATERIAL.find((t) => t.slug === slug);
export const nombreTipoMaterial = (slug?: string | null) =>
  TIPOS_MATERIAL.find((t) => t.slug === slug)?.nombre ?? slug ?? "";
