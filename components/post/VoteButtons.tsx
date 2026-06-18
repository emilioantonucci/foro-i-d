"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { ThumbsUp, Star, Flame, Search, X, type LucideIcon } from "lucide-react";
import { TIPOS_VOTO } from "@/lib/constants";
import { toggleVoteAction } from "@/app/(app)/actions";

const ICONS: Record<string, LucideIcon> = {
  "thumbs-up": ThumbsUp,
  star: Star,
  flame: Flame,
  search: Search,
  x: X,
};

export default function VoteButtons({
  postId,
  counts,
  userVotes,
}: {
  postId: string;
  counts: Record<string, number>;
  userVotes: string[];
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const vote = (tipo: string) =>
    startTransition(async () => {
      await toggleVoteAction(postId, tipo);
      router.refresh();
    });

  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
      {TIPOS_VOTO.map((t) => {
        const Icon = ICONS[t.icon] ?? ThumbsUp;
        const active = userVotes.includes(t.slug);
        const accent = t.es_positivo ? "#6b9000" : "#C62A2F";
        return (
          <button
            key={t.slug}
            type="button"
            onClick={() => vote(t.slug)}
            disabled={pending}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "7px",
              padding: "8px 13px",
              borderRadius: "999px",
              fontSize: "13px",
              fontWeight: 700,
              cursor: "pointer",
              border: active ? `1.5px solid ${accent}` : "1px solid #E0DED9",
              background: active ? (t.es_positivo ? "rgba(153,204,6,0.14)" : "rgba(198,42,47,0.10)") : "#fff",
              color: active ? accent : "#525252",
              opacity: pending ? 0.6 : 1,
            }}
          >
            <Icon size={15} /> {t.nombre} · {counts[t.slug] ?? 0}
          </button>
        );
      })}
    </div>
  );
}
