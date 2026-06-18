import { NextResponse } from "next/server";
import { requireUser, unauthorized, aiErrorResponse } from "@/lib/api";
import { synthesizeDebate } from "@/lib/gemini";

export async function POST(req: Request) {
  const { supabase, user } = await requireUser();
  if (!user) return unauthorized();

  const body = await req.json().catch(() => ({}));
  const postId: string | undefined = body.postId;
  if (!postId) {
    return NextResponse.json({ ok: false, error: "Falta el postId." }, { status: 400 });
  }

  const { data: post } = await supabase
    .from("posts")
    .select("titulo, resumen")
    .eq("id", postId)
    .maybeSingle();
  if (!post) {
    return NextResponse.json({ ok: false, error: "Publicación no encontrada." }, { status: 404 });
  }

  const { data: comments } = await supabase
    .from("comments")
    .select("comentario")
    .eq("post_id", postId)
    .order("created_at", { ascending: true });

  const comentarios = (comments ?? []).map((c) => c.comentario as string);

  try {
    const data = await synthesizeDebate({
      titulo: post.titulo as string,
      resumen: post.resumen as string | null,
      comentarios,
    });
    return NextResponse.json({ ok: true, data });
  } catch (e) {
    return aiErrorResponse(e);
  }
}
