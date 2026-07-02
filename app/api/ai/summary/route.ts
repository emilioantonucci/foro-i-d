import { NextResponse } from "next/server";
import { requireUser, unauthorized, aiErrorResponse, aiRateLimitResponse } from "@/lib/api";
import { generateSummary } from "@/lib/gemini";
import { fetchPageContent } from "@/lib/scrape";
import { isYoutubeUrl, normalizeYoutubeUrl } from "@/lib/youtube";
import { FILE_MAX_BYTES, FILE_MIME_PDF, FILE_MIME_DOCX } from "@/lib/validation";

export async function POST(req: Request) {
  const { supabase, user } = await requireUser();
  if (!user) return unauthorized();

  const limited = aiRateLimitResponse(user.id);
  if (limited) return limited;

  const body = await req.json().catch(() => ({}));
  const url: string | undefined = body.url?.trim() || undefined;
  let rawText: string | undefined = body.rawText?.trim() || undefined;
  const filePath: string | undefined = body.filePath?.trim() || undefined;

  if (!url && !rawText && !filePath) {
    return NextResponse.json(
      { ok: false, error: "Pegá una URL, un texto o subí un archivo." },
      { status: 400 },
    );
  }

  let pdfBase64: string | undefined;
  let youtubeUrl: string | undefined;
  let fromDocx = false;

  if (filePath) {
    // The file was uploaded by the browser straight to the private bucket
    // (RLS forces the {auth.uid()}/ folder); we only accept the caller's own.
    if (!filePath.startsWith(`${user.id}/`) || filePath.includes("..")) {
      return NextResponse.json({ ok: false, error: "Archivo inválido." }, { status: 400 });
    }
    const { data: blob, error } = await supabase.storage.from("recursos").download(filePath);
    if (error || !blob) {
      return NextResponse.json(
        { ok: false, error: "No se pudo leer el archivo subido. Probá subirlo de nuevo." },
        { status: 400 },
      );
    }
    if (blob.size > FILE_MAX_BYTES) {
      return NextResponse.json(
        { ok: false, error: "El archivo supera el máximo de 12MB." },
        { status: 400 },
      );
    }
    const buffer = Buffer.from(await blob.arrayBuffer());
    const mime = body.fileMime === FILE_MIME_DOCX ? FILE_MIME_DOCX : blob.type || FILE_MIME_PDF;

    if (mime === FILE_MIME_DOCX || filePath.toLowerCase().endsWith(".docx")) {
      // Gemini no soporta .docx: extraemos el texto server-side (mammoth).
      const mammoth = await import("mammoth");
      const extracted = await mammoth
        .extractRawText({ buffer })
        .then((r) => r.value?.trim() ?? "")
        .catch(() => "");
      if (!extracted) {
        return NextResponse.json(
          { ok: false, error: "No se pudo leer el documento. ¿Tiene texto seleccionable?" },
          { status: 422 },
        );
      }
      rawText = extracted.slice(0, 12000);
      fromDocx = true;
    } else {
      pdfBase64 = buffer.toString("base64");
    }
  } else if (url && isYoutubeUrl(url)) {
    youtubeUrl = normalizeYoutubeUrl(url) ?? url;
  } else if (url && !rawText) {
    // Enrich with the page content when only a URL is given (best effort).
    const page = await fetchPageContent(url);
    if (page.ok) {
      rawText = page.text;
    } else if (page.blocked) {
      // Paywall / muro anti-bot: no tiene sentido analizar. La UI usa `code`
      // para sugerir subir el PDF descargado.
      return NextResponse.json(
        {
          ok: false,
          code: "RESTRICTED",
          error:
            "Este sitio restringe el acceso automático. Descargá el PDF del recurso y subilo acá para analizarlo.",
        },
        { status: 422 },
      );
    }
    // no bloqueado pero sin texto -> se analiza desde la URL sola (best effort)
  }

  try {
    const data = await generateSummary({ url, rawText, pdfBase64, youtubeUrl, fromDocx });
    return NextResponse.json({ ok: true, data });
  } catch (e) {
    return aiErrorResponse(e);
  }
}
