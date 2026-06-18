import { NextResponse } from "next/server";
import { requireUser, unauthorized, aiErrorResponse } from "@/lib/api";
import { generateBrief } from "@/lib/gemini";

export async function POST(req: Request) {
  const { supabase, user } = await requireUser();
  if (!user) return unauthorized();

  const body = await req.json().catch(() => ({}));
  const postIds: string[] = Array.isArray(body.postIds) ? body.postIds : [];
  if (postIds.length === 0) {
    return NextResponse.json({ ok: false, error: "Seleccioná al menos una publicación." }, { status: 400 });
  }

  const { data: posts } = await supabase
    .from("posts")
    .select("titulo, resumen, categoria")
    .in("id", postIds);

  if (!posts || posts.length === 0) {
    return NextResponse.json({ ok: false, error: "No se encontraron las publicaciones." }, { status: 404 });
  }

  try {
    const data = await generateBrief({
      posts: posts.map((p) => ({
        titulo: p.titulo as string,
        resumen: p.resumen as string | null,
        categoria: p.categoria as string | null,
      })),
    });
    return NextResponse.json({ ok: true, data });
  } catch (e) {
    return aiErrorResponse(e);
  }
}
