import "server-only";
import { isIP } from "node:net";
import { lookup } from "node:dns/promises";

/**
 * Best-effort extraction of readable text from a public URL, to feed the
 * AI summary. Capped + timed out; returns null on any failure (the summary
 * then works from the URL alone).
 *
 * SSRF hardening: the URL is user-supplied (it reaches here from "Analizar con
 * IA"), so before fetching we verify the host is NOT internal — by name and by
 * resolved IP — and we follow redirects manually, re-validating every hop. This
 * blocks reaching localhost, private ranges and the cloud metadata endpoint
 * (169.254.169.254) directly or via a redirect.
 */

const MAX_REDIRECTS = 3;
const FETCH_TIMEOUT_MS = 8000;

/** True if an IP literal falls in a private/reserved/loopback/link-local range. */
function isBlockedIp(ip: string): boolean {
  const kind = isIP(ip); // 4, 6, or 0 (not an IP)
  if (kind === 4) {
    const p = ip.split(".").map(Number);
    if (p.length !== 4 || p.some((n) => Number.isNaN(n))) return true;
    const [a, b] = p;
    if (a === 0) return true; // "this" network 0.0.0.0/8
    if (a === 10) return true; // private 10.0.0.0/8
    if (a === 127) return true; // loopback 127.0.0.0/8
    if (a === 169 && b === 254) return true; // link-local + cloud metadata
    if (a === 172 && b >= 16 && b <= 31) return true; // private 172.16.0.0/12
    if (a === 192 && b === 168) return true; // private 192.168.0.0/16
    if (a === 100 && b >= 64 && b <= 127) return true; // CGNAT 100.64.0.0/10
    if (a >= 224) return true; // multicast/reserved 224.0.0.0+
    return false;
  }
  if (kind === 6) {
    const v = ip.toLowerCase();
    if (v === "::1" || v === "::") return true; // loopback / unspecified
    if (v.startsWith("fe80")) return true; // link-local fe80::/10
    if (v.startsWith("fc") || v.startsWith("fd")) return true; // unique-local fc00::/7
    const mapped = v.match(/::ffff:(\d+\.\d+\.\d+\.\d+)$/); // IPv4-mapped
    if (mapped) return isBlockedIp(mapped[1]);
    return false;
  }
  return true; // not a valid IP literal -> block when used as an IP
}

/** Blocks obviously-internal hostnames before any DNS work. */
function isBlockedHostname(host: string): boolean {
  if (!host) return true;
  if (host === "localhost" || host.endsWith(".localhost")) return true;
  if (host.endsWith(".local") || host.endsWith(".internal")) return true;
  return false;
}

/** Resolves the host and blocks if it (or any resolved IP) is internal. */
async function isSafeHost(hostname: string): Promise<boolean> {
  const host = hostname.toLowerCase().replace(/^\[|\]$/g, "").replace(/\.$/, "");
  if (isBlockedHostname(host)) return false;
  if (isIP(host)) return !isBlockedIp(host); // IP literal -> check directly
  // Hostname -> resolve and ensure NO address is internal.
  try {
    const addrs = await lookup(host, { all: true });
    if (addrs.length === 0) return false;
    return addrs.every((a) => !isBlockedIp(a.address));
  } catch {
    return false; // unresolvable -> don't fetch
  }
}

export async function fetchPageText(url: string): Promise<string | null> {
  try {
    let current = new URL(url);
    let res: Response | null = null;

    for (let hop = 0; hop <= MAX_REDIRECTS; hop++) {
      if (current.protocol !== "http:" && current.protocol !== "https:") return null;
      if (!(await isSafeHost(current.hostname))) return null;

      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
      const r = await fetch(current.toString(), {
        signal: controller.signal,
        headers: { "User-Agent": "RadarIyD/1.0 (+resumen IA)" },
        cache: "no-store",
        redirect: "manual", // follow ourselves so each hop's host is re-validated
      }).finally(() => clearTimeout(timeout));

      if (r.status >= 300 && r.status < 400) {
        const loc = r.headers.get("location");
        if (!loc) return null;
        current = new URL(loc, current); // resolve relative redirects
        continue;
      }
      res = r;
      break;
    }
    if (!res) return null; // too many redirects

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
