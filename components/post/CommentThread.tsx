"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { MessageSquare } from "lucide-react";
import { addCommentAction } from "@/app/(app)/actions";
import { timeAgo } from "@/lib/ui";
import Avatar from "@/components/ui/Avatar";
import Button from "@/components/ui/Button";
import { Textarea } from "@/components/ui/Field";
import EmptyState from "@/components/ui/EmptyState";
import { useToast } from "@/components/ui/Toast";

interface CommentAutor {
  id: string;
  nombre: string | null;
  avatar_url: string | null;
}
interface CommentItem {
  id: string;
  comentario: string;
  created_at: string;
  autor: CommentAutor | null;
}

const MAX = 1000;

export default function CommentThread({
  postId,
  comments,
}: {
  postId: string;
  comments: CommentItem[];
}) {
  const router = useRouter();
  const toast = useToast();
  const [text, setText] = useState("");
  const [pending, startTransition] = useTransition();

  const trimmed = text.trim();
  const canSend = trimmed.length > 0 && text.length <= MAX;

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSend) return;
    startTransition(async () => {
      const r = await addCommentAction(postId, text);
      if (r.error) {
        toast.error(r.error);
      } else {
        setText("");
        toast.success("Comentario publicado");
        router.refresh();
      }
    });
  }

  return (
    <div>
      <h2
        style={{
          fontFamily: "var(--font-secondary)",
          fontSize: "16px",
          margin: "0 0 14px",
          color: "var(--fg-primary)",
        }}
      >
        Debate · {comments.length} {comments.length === 1 ? "comentario" : "comentarios"}
      </h2>

      <form onSubmit={submit} style={{ marginBottom: "20px" }}>
        <label htmlFor="comment-input" className="sr-only">
          Escribí un comentario
        </label>
        <Textarea
          id="comment-input"
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={3}
          maxLength={MAX}
          placeholder="Aportá al debate…"
        />
        <div className="dg-field__foot" style={{ marginTop: "8px" }}>
          <span className="dg-hint">Sé concreto: una idea, una pregunta o un dato.</span>
          <span className={`dg-charcount ${text.length >= MAX ? "dg-charcount--over" : ""}`.trim()}>
            {text.length}/{MAX}
          </span>
        </div>
        <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "8px" }}>
          <Button type="submit" size="sm" loading={pending} disabled={!canSend}>
            Comentar
          </Button>
        </div>
      </form>

      {comments.length === 0 ? (
        <EmptyState
          icon={MessageSquare}
          title="Todavía no hay comentarios"
          desc="Abrí el debate: compartí tu lectura o una pregunta para el equipo."
        />
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
          {comments.map((c) => {
            const nombre = c.autor?.nombre ?? "Colaborador";
            return (
              <div key={c.id} style={{ display: "flex", gap: "11px" }}>
                <Avatar name={nombre} size={32} title={nombre} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "baseline", gap: "8px" }}>
                    <span style={{ fontSize: "13px", fontWeight: 700, color: "var(--fg-primary)" }}>
                      {nombre}
                    </span>
                    <span style={{ fontSize: "11.5px", color: "var(--fg-muted)" }}>
                      {timeAgo(c.created_at)}
                    </span>
                  </div>
                  <p
                    style={{
                      margin: "3px 0 0",
                      fontSize: "13.5px",
                      color: "var(--dg-gray-700)",
                      lineHeight: 1.5,
                      whiteSpace: "pre-wrap",
                      wordBreak: "break-word",
                    }}
                  >
                    {c.comentario}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
