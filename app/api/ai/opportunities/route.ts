import { NextResponse } from "next/server";
import { requireUser, unauthorized, aiErrorResponse, aiRateLimitResponse } from "@/lib/api";
import { detectOpportunities } from "@/lib/gemini";
import { getRecentPostsForAI } from "@/lib/data/posts";

export async function POST(req: Request) {
  const { user } = await requireUser();
  if (!user) return unauthorized();

  const limited = aiRateLimitResponse(user.id);
  if (limited) return limited;

  const posts = await getRecentPostsForAI(40);
  if (posts.length === 0) {
    return NextResponse.json(
      { ok: false, error: "Todavía no hay publicaciones suficientes para detectar oportunidades." },
      { status: 400 },
    );
  }

  try {
    const data = await detectOpportunities({
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
