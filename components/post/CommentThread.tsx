"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { addCommentAction } from "@/app/(app)/actions";
import { initials, avatarColor, timeAgo } from "@/lib/ui";

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

export default function CommentThread({
  postId,
  comments,
}: {
  postId: string;
  comments: CommentItem[];
}) {
  const router = useRouter();
  const [text, setText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!text.trim()) return;
    setError(null);
    startTransition(async () => {
      const r = await addCommentAction(postId, text);
      if (r.error) setError(r.error);
      else {
        setText("");
        router.refresh();
      }
    });
  }

  return (
    <div>
      <h2 style={{ fontFamily: "'Poppins', sans-serif", fontSize: "16px", margin: "0 0 14px", color: "#262626" }}>
        Debate · {comments.length} {comments.length === 1 ? "comentario" : "comentarios"}
      </h2>

      <form onSubmit={submit} style={{ marginBottom: "20px" }}>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={3}
          placeholder="Aportá al debate…"
          style={{ width: "100%", padding: "11px 13px", border: "1px solid #E0DED9", borderRadius: "10px", fontSize: "14px", resize: "vertical", outline: "none" }}
        />
        {error && <p style={{ color: "#C62A2F", fontSize: "12px", margin: "6px 0 0" }}>{error}</p>}
        <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "8px" }}>
          <button type="submit" disabled={pending || !text.trim()} className="dg-btn dg-btn--primary" style={{ fontSize: "13px", opacity: pending || !text.trim() ? 0.6 : 1 }}>
            {pending ? "Enviando…" : "Comentar"}
          </button>
        </div>
      </form>

      {comments.length === 0 ? (
        <p style={{ fontSize: "13.5px", color: "#AAAAB4" }}>Todavía no hay comentarios. Abrí el debate.</p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
          {comments.map((c) => {
            const nombre = c.autor?.nombre ?? "Colaborador";
            return (
              <div key={c.id} style={{ display: "flex", gap: "11px" }}>
                <span
                  style={{
                    width: "32px",
                    height: "32px",
                    borderRadius: "50%",
                    background: avatarColor(nombre),
                    color: "#fff",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontWeight: 700,
                    fontSize: "12px",
                    flex: "none",
                  }}
                >
                  {initials(nombre)}
                </span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "baseline", gap: "8px" }}>
                    <span style={{ fontSize: "13px", fontWeight: 700, color: "#262626" }}>{nombre}</span>
                    <span style={{ fontSize: "11.5px", color: "#AAAAB4" }}>{timeAgo(c.created_at)}</span>
                  </div>
                  <p style={{ margin: "3px 0 0", fontSize: "13.5px", color: "#404040", lineHeight: 1.5 }}>{c.comentario}</p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
