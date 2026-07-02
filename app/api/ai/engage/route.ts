import { NextResponse } from "next/server";
import { requireUser, unauthorized, aiErrorResponse, aiRateLimitResponse } from "@/lib/api";
import { generateEngagement } from "@/lib/gemini";

/** Genera encuesta + preguntas disparadoras a partir del título/resumen ya
 *  cargados en el formulario (para cuando no se usó "Analizar con IA"). */
export async function POST(req: Request) {
  const { user } = await requireUser();
  if (!user) return unauthorized();

  const limited = aiRateLimitResponse(user.id);
  if (limited) return limited;

  const body = await req.json().catch(() => ({}));
  const titulo: string = body.titulo?.trim() ?? "";
  const resumen: string | undefined = body.resumen?.trim() || undefined;

  if (titulo.length < 5) {
    return NextResponse.json(
      { ok: false, error: "Completá el título antes de generar sugerencias." },
      { status: 400 },
    );
  }

  try {
    const data = await generateEngagement({ titulo, resumen });
    return NextResponse.json({ ok: true, data });
  } catch (e) {
    return aiErrorResponse(e);
  }
}
