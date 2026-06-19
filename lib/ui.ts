/** Small presentational helpers shared across components. */

/** First letters of the first two words, uppercased. "Ana López" -> "AL". */
export function initials(name: string | null | undefined): string {
  if (!name) return "?";
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

// Deterministic avatar palette, derived from the brand state/info colors
// (see colors_and_type.css). Kept here so every avatar — sidebar, cards,
// profiles — shares one consistent, brand-aligned set.
const AVATAR_COLORS = [
  "#30587D", // info
  "#6B9000", // green (dark variant)
  "#B45F06", // warning-dark
  "#073763", // info-dark
  "#38761D", // success-dark
  "#525252", // gray-600
  "#7A4FA0", // violet accent (variety)
  "#9A3C57", // berry accent (variety)
];

/** Deterministic avatar background color derived from a name. */
export function avatarColor(seed: string | null | undefined): string {
  const s = seed ?? "";
  let hash = 0;
  for (let i = 0; i < s.length; i++) hash = (hash * 31 + s.charCodeAt(i)) >>> 0;
  return AVATAR_COLORS[hash % AVATAR_COLORS.length];
}

/** Relative time in Spanish, e.g. "hace 2 h", "hace 3 d". */
export function timeAgo(iso: string): string {
  const then = new Date(iso).getTime();
  const now = Date.now();
  const s = Math.max(0, Math.floor((now - then) / 1000));
  if (s < 60) return "hace un momento";
  const m = Math.floor(s / 60);
  if (m < 60) return `hace ${m} min`;
  const h = Math.floor(m / 60);
  if (h < 24) return `hace ${h} h`;
  const d = Math.floor(h / 24);
  if (d < 30) return `hace ${d} d`;
  const mo = Math.floor(d / 30);
  if (mo < 12) return `hace ${mo} mes${mo > 1 ? "es" : ""}`;
  return `hace ${Math.floor(mo / 12)} a`;
}
