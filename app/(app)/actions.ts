"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { geminiModelName } from "@/lib/gemini";
import type { AiOutputTipo } from "@/lib/types";

export interface CreatePostInput {
  titulo: string;
  url?: string;
  categoria?: string;
  resumen?: string;
  relevancia?: string;
  etiquetas?: string[];
  prioridad?: string;
  aplicacion_interna?: string[];
}

export interface ActionResult {
  ok?: boolean;
  error?: string;
}

export async function createPostAction(
  input: CreatePostInput,
): Promise<ActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Tu sesión expiró. Iniciá sesión de nuevo." };

  if (!input.titulo?.trim()) return { error: "El título es obligatorio." };

  const { data, error } = await supabase
    .from("posts")
    .insert({
      user_id: user.id,
      titulo: input.titulo.trim(),
      url: input.url?.trim() || null,
      resumen: input.resumen?.trim() || null,
      relevancia: input.relevancia?.trim() || null,
      categoria: input.categoria || null,
      etiquetas: input.etiquetas ?? [],
      prioridad: input.prioridad || "media",
      aplicacion_interna: input.aplicacion_interna ?? [],
    })
    .select("id")
    .single();

  if (error || !data) {
    return { error: error?.message ?? "No se pudo crear la publicación." };
  }

  revalidatePath("/radar");
  redirect(`/post/${data.id}`);
}

export async function addCommentAction(
  postId: string,
  comentario: string,
): Promise<ActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "No autenticado." };
  if (!comentario.trim()) return { error: "El comentario está vacío." };

  const { error } = await supabase.from("comments").insert({
    post_id: postId,
    user_id: user.id,
    comentario: comentario.trim(),
  });
  if (error) return { error: error.message };

  revalidatePath(`/post/${postId}`);
  return { ok: true };
}

export async function toggleVoteAction(
  postId: string,
  tipo: string,
): Promise<ActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "No autenticado." };

  const { data: existing } = await supabase
    .from("votes")
    .select("id")
    .eq("post_id", postId)
    .eq("user_id", user.id)
    .eq("tipo_voto", tipo)
    .maybeSingle();

  if (existing) {
    await supabase.from("votes").delete().eq("id", existing.id);
  } else {
    const { error } = await supabase
      .from("votes")
      .insert({ post_id: postId, user_id: user.id, tipo_voto: tipo });
    if (error) return { error: error.message };
  }

  revalidatePath(`/post/${postId}`);
  revalidatePath("/radar");
  return { ok: true };
}

export async function updateProfileAction(input: {
  nombre?: string;
  bio?: string;
  area?: string;
}): Promise<ActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "No autenticado." };

  const patch: Record<string, unknown> = {};
  if (input.nombre?.trim()) patch.nombre = input.nombre.trim();
  patch.bio = input.bio?.trim() || null;
  patch.area = input.area?.trim() || null;
  // Completing the profile (bio + área) flips perfil_completo -> +20 once (trigger).
  if (input.bio?.trim() && input.area?.trim()) patch.perfil_completo = true;

  const { error } = await supabase.from("profiles").update(patch).eq("id", user.id);
  if (error) return { error: error.message };

  revalidatePath("/perfil");
  revalidatePath("/ranking");
  return { ok: true };
}

/** Persists an AI output. sintesis/oportunidad award points via DB trigger. */
export async function saveAiOutputAction(
  tipo: AiOutputTipo,
  contenido: unknown,
  postId?: string,
): Promise<ActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "No autenticado." };

  const { error } = await supabase.from("ai_outputs").insert({
    post_id: postId ?? null,
    user_id: user.id,
    tipo,
    contenido: contenido as object,
    modelo: geminiModelName(),
  });
  if (error) return { error: error.message };

  if (postId) revalidatePath(`/post/${postId}`);
  revalidatePath("/perfil");
  revalidatePath("/ranking");
  return { ok: true };
}

/** Admin/moderator: change governance fields. RLS + triggers enforce the rule. */
export async function updatePostGovernanceAction(
  postId: string,
  patch: { estado?: string; prioridad?: string; categoria?: string; marcado_relevante?: boolean },
): Promise<ActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "No autenticado." };

  const { error } = await supabase.from("posts").update(patch).eq("id", postId);
  if (error) return { error: error.message };

  revalidatePath(`/post/${postId}`);
  revalidatePath("/radar");
  return { ok: true };
}
