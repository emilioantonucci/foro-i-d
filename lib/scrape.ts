import "server-only";

/**
 * Best-effort extraction of readable text from a public URL, to feed the
 * AI summary. Capped + timed out; returns null on any failure (the summary
 * then works from the URL alone).
 */
export async function fetchPageText(url: string): Promise<string | null> {
  try {
    const u = new URL(url);
    if (u.protocol !== "http:" && u.protocol !== "https:") return null;

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);
    const res = await fetch(u.toString(), {
      signal: controller.signal,
      headers: { "User-Agent": "RadarIyD/1.0 (+resumen IA)" },
      cache: "no-store",
    }).finally(() => clearTimeout(timeout));

    if (!res.ok) return null;
    const ctype = res.headers.get("content-type") ?? "";
    if (!ctype.includes("text/html") && !ctype.includes("text/plain")) return null;

    const html = (await res.text()).slice(0, 200_000);
    const text = html
      .replace(/<script[\s\S]*?<\/script>/gi, " ")
      .replace(/<style[\s\S]*?<\/style>/gi, " ")
      .replace(/<[^>]+>/g, " ")
      .replace(/&[a-z]+;/gi, " ")
      .replace(/\s+/g, " ")
      .trim();

    return text.slice(0, 7000) || null;
  } catch {
    return null;
  }
}
