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
