import { NextResponse } from "next/server";
import { requireUser, unauthorized, aiErrorResponse } from "@/lib/api";
import { generateSummary } from "@/lib/gemini";
import { fetchPageText } from "@/lib/scrape";

export async function POST(req: Request) {
  const { user } = await requireUser();
  if (!user) return unauthorized();

  const body = await req.json().catch(() => ({}));
  const url: string | undefined = body.url?.trim() || undefined;
  let rawText: string | undefined = body.rawText?.trim() || undefined;

  if (!url && !rawText) {
    return NextResponse.json({ ok: false, error: "Pegá una URL o un texto." }, { status: 400 });
  }

  // Enrich with the page content when only a URL is given (best effort).
  if (url && !rawText) {
    rawText = (await fetchPageText(url)) ?? undefined;
  }

  try {
    const data = await generateSummary({ url, rawText });
    return NextResponse.json({ ok: true, data });
  } catch (e) {
    return aiErrorResponse(e);
  }
}
