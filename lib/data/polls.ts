import "server-only";
import { createClient } from "@/lib/supabase/server";

export interface PollOptionResult {
  id: string;
  texto: string;
  orden: number;
  votos: number;
}

export interface PollResult {
  id: string;
  pregunta: string;
  opciones: PollOptionResult[];
  totalVotos: number;
  /** Opción votada por el usuario actual (null si todavía no votó). */
  miVotoOptionId: string | null;
}

/* eslint-disable @typescript-eslint/no-explicit-any */

/** Encuesta de una publicación (post del Radar o dato de Datos Random) con
 *  conteos por opción y el voto del usuario actual. Null si no hay encuesta. */
export async function getPoll(parent: {
  postId?: string;
  datoId?: string;
}): Promise<PollResult | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let q = supabase
    .from("polls")
    .select("id, pregunta, opciones:poll_options(id, texto, orden), votos:poll_votes(option_id, user_id)");
  q = parent.postId ? q.eq("post_id", parent.postId) : q.eq("dato_id", parent.datoId ?? "");

  const { data, error } = await q.maybeSingle();
  if (error || !data) return null;

  const votos = (data.votos ?? []) as { option_id: string; user_id: string }[];
  const porOpcion: Record<string, number> = {};
  votos.forEach((v) => {
    porOpcion[v.option_id] = (porOpcion[v.option_id] ?? 0) + 1;
  });

  const opciones: PollOptionResult[] = ((data.opciones ?? []) as any[])
    .map((o) => ({
      id: o.id,
      texto: o.texto,
      orden: o.orden ?? 0,
      votos: porOpcion[o.id] ?? 0,
    }))
    .sort((a, b) => a.orden - b.orden);

  return {
    id: data.id,
    pregunta: data.pregunta,
    opciones,
    totalVotos: votos.length,
    miVotoOptionId: user ? (votos.find((v) => v.user_id === user.id)?.option_id ?? null) : null,
  };
}
/* eslint-enable @typescript-eslint/no-explicit-any */
