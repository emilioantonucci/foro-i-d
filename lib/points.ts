/**
 * Rank ladder + points-per-action.
 *
 * The DATABASE is the source of truth: points are awarded by Postgres triggers
 * and `rango` is derived server-side. This module exists only for UI display
 * (rank progress bars, the "7 rangos" ladder, the create-form points preview)
 * and MUST mirror the thresholds in `rango_for_puntos()` + the `puntos_config`
 * seed in the migration.
 */

export type RankName =
  | "Observador"
  | "Explorador"
  | "Curador"
  | "Analista"
  | "Referente"
  | "Estratega I+D"
  | "Mentor de Innovación";

export interface Rank {
  nombre: RankName;
  min: number;
  icon: string; // lucide icon name
}

export const RANKS: Rank[] = [
  { nombre: "Observador", min: 0, icon: "eye" },
  { nombre: "Explorador", min: 100, icon: "footprints" },
  { nombre: "Curador", min: 400, icon: "bookmark-check" },
  { nombre: "Analista", min: 1000, icon: "line-chart" },
  { nombre: "Referente", min: 2500, icon: "star" },
  { nombre: "Estratega I+D", min: 4500, icon: "compass" },
  { nombre: "Mentor de Innovación", min: 7000, icon: "graduation-cap" },
];

export function rankForPoints(puntos: number): Rank {
  let current = RANKS[0];
  for (const r of RANKS) if (puntos >= r.min) current = r;
  return current;
}

export function nextRank(puntos: number): Rank | null {
  return RANKS.find((r) => r.min > puntos) ?? null;
}

export interface RankProgress {
  current: Rank;
  next: Rank | null;
  pct: number;
  faltan: number;
}

export function rankProgress(puntos: number): RankProgress {
  const current = rankForPoints(puntos);
  const next = nextRank(puntos);
  if (!next) return { current, next: null, pct: 100, faltan: 0 };
  const span = next.min - current.min;
  const done = puntos - current.min;
  const pct = Math.max(0, Math.min(100, Math.round((done / span) * 100)));
  return { current, next, pct, faltan: next.min - puntos };
}

/** Mirrors the `puntos_config` seed. Used for the UI points preview only. */
export const PUNTOS = {
  perfil_completo: 20,
  publicar_enlace: 10,
  resumen_propio: 15,
  comentar: 5,
  voto_positivo: 3,
  marcado_relevante: 25,
  sintesis: 30,
  oportunidad: 40,
  // "Datos random" (subforo distendido) — más livianos que los del radar.
  publicar_dato: 5,
  comentar_dato: 3,
  like_dato: 2,
} as const;
