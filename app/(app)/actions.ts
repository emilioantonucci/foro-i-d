"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { after } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { geminiModelName } from "@/lib/gemini";
import { firstError, notifPrefsSchema, datoSchema } from "@/lib/validation";
import {
  dispatchNuevaPublicacion,
  dispatchComentario,
  flushPendingNotifications,
} from "@/lib/notifications/dispatch";
import type { AiOutputTipo, NotifPrefs } from "@/lib/types";

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

  // Email notifications run AFTER the response (Next `after`): they never delay
  // the redirect and a mail failure can't break publishing.
  after(() => dispatchNuevaPublicacion(data.id, user.id));
  after(() => flushPendingNotifications([user.id])); // rank-up from +10/+15 pts

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

  const { data, error } = await supabase
    .from("comments")
    .insert({
      post_id: postId,
      user_id: user.id,
      comentario: comentario.trim(),
    })
    .select("id")
    .single();
  if (error || !data) return { error: error?.message ?? "No se pudo comentar." };

  after(() => dispatchComentario(postId, data.id)); // notifies the post author
  after(() => flushPendingNotifications([user.id])); // rank-up from +5 pts

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
    // A positive vote awards +3 to the post author → they may have ranked up.
    const { data: post } = await supabase.from("posts").select("user_id").eq("id", postId).maybeSingle();
    if (post?.user_id) after(() => flushPendingNotifications([post.user_id]));
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

  after(() => flushPendingNotifications([user.id])); // perfil_completo (+20) may rank up

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

  after(() => flushPendingNotifications([user.id])); // sintesis/oportunidad points may rank up

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

  // Marking a post relevant awards +25 to its author → they may have ranked up.
  if (patch.marcado_relevante === true) {
    const { data: post } = await supabase.from("posts").select("user_id").eq("id", postId).maybeSingle();
    if (post?.user_id) after(() => flushPendingNotifications([post.user_id]));
  }

  revalidatePath(`/post/${postId}`);
  revalidatePath("/radar");
  return { ok: true };
}

// =========================================================================
// "Datos random" — subforo distendido. Tablas propias (datos/datos_comments/
// datos_likes); los puntos se otorgan por triggers de la migración 0006.
// =========================================================================

export interface CreateDatoInput {
  titulo: string;
  tipo: string;
  url?: string;
  descripcion?: string;
  etiquetas?: string[];
}

export async function createDatoAction(
  input: CreateDatoInput,
): Promise<ActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Tu sesión expiró. Iniciá sesión de nuevo." };

  const parsed = datoSchema.safeParse({
    titulo: input.titulo,
    tipo: input.tipo,
    url: input.url ?? "",
    descripcion: input.descripcion ?? "",
  });
  if (!parsed.success) return { error: firstError(parsed.error) };

  const { data, error } = await supabase
    .from("datos")
    .insert({
      user_id: user.id,
      titulo: parsed.data.titulo,
      tipo: parsed.data.tipo,
      url: parsed.data.url?.trim() || null,
      descripcion: parsed.data.descripcion?.trim() || null,
      etiquetas: input.etiquetas ?? [],
    })
    .select("id")
    .single();

  if (error || !data) {
    return { error: error?.message ?? "No se pudo publicar el dato." };
  }

  after(() => flushPendingNotifications([user.id])); // rank-up from +5 pts

  revalidatePath("/datos");
  redirect(`/datos/${data.id}`);
}

export async function addDatoCommentAction(
  datoId: string,
  comentario: string,
): Promise<ActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "No autenticado." };
  if (!comentario.trim()) return { error: "El comentario está vacío." };

  const { error } = await supabase
    .from("datos_comments")
    .insert({ dato_id: datoId, user_id: user.id, comentario: comentario.trim() });
  if (error) return { error: error.message };

  after(() => flushPendingNotifications([user.id])); // rank-up from +3 pts

  revalidatePath(`/datos/${datoId}`);
  return { ok: true };
}

/** Deletes a dato. RLS allows only its author or an admin/mod. Cascade
 *  removes its comments and likes. */
export async function deleteDatoAction(datoId: string): Promise<ActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "No autenticado." };

  const { error } = await supabase.from("datos").delete().eq("id", datoId);
  if (error) return { error: error.message };

  revalidatePath("/datos");
  redirect("/datos");
}

export async function toggleDatoLikeAction(datoId: string): Promise<ActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "No autenticado." };

  const { data: existing } = await supabase
    .from("datos_likes")
    .select("dato_id")
    .eq("dato_id", datoId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (existing) {
    await supabase.from("datos_likes").delete().eq("dato_id", datoId).eq("user_id", user.id);
  } else {
    const { error } = await supabase
      .from("datos_likes")
      .insert({ dato_id: datoId, user_id: user.id });
    if (error) return { error: error.message };
    // A like awards +2 to the dato author → they may have ranked up.
    const { data: dato } = await supabase.from("datos").select("user_id").eq("id", datoId).maybeSingle();
    if (dato?.user_id) after(() => flushPendingNotifications([dato.user_id]));
  }

  revalidatePath(`/datos/${datoId}`);
  revalidatePath("/datos");
  return { ok: true };
}

/** Updates the current user's email-notification preferences (own row only). */
export async function updateNotifPrefsAction(
  input: Partial<NotifPrefs>,
): Promise<ActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "No autenticado." };

  const parsed = notifPrefsSchema.safeParse(input);
  if (!parsed.success) return { error: firstError(parsed.error) };

  const { error } = await supabase.from("profiles").update(parsed.data).eq("id", user.id);
  if (error) return { error: error.message };

  revalidatePath("/perfil/notificaciones");
  return { ok: true };
}
