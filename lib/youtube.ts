/**
 * YouTube URL detection. Gemini's generateContent accepts public YouTube
 * URLs natively as a `file_data` part, so when the pasted URL is a video we
 * skip the HTML scraping entirely and let the model watch it.
 */

const YT_HOSTS = new Set([
  "youtube.com",
  "www.youtube.com",
  "m.youtube.com",
  "music.youtube.com",
  "youtu.be",
]);

/** Extracts the video id, or null if the URL is not a YouTube video. */
export function youtubeVideoId(raw: string): string | null {
  let u: URL;
  try {
    u = new URL(raw);
  } catch {
    return null;
  }
  if (!YT_HOSTS.has(u.hostname.toLowerCase())) return null;

  const ID = /^[A-Za-z0-9_-]{6,20}$/;
  if (u.hostname.toLowerCase() === "youtu.be") {
    const id = u.pathname.split("/")[1] ?? "";
    return ID.test(id) ? id : null;
  }
  if (u.pathname === "/watch") {
    const id = u.searchParams.get("v") ?? "";
    return ID.test(id) ? id : null;
  }
  const m = u.pathname.match(/^\/(shorts|live|embed)\/([A-Za-z0-9_-]{6,20})/);
  return m ? m[2] : null;
}

export function isYoutubeUrl(raw: string): boolean {
  return youtubeVideoId(raw) !== null;
}

/** Canonical watch URL (the form Gemini documents for file_data). */
export function normalizeYoutubeUrl(raw: string): string | null {
  const id = youtubeVideoId(raw);
  return id ? `https://www.youtube.com/watch?v=${id}` : null;
}
