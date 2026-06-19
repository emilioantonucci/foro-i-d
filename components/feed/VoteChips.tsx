"use client";

import { useOptimistic, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ThumbsUp, Star, Flame, Search, X, type LucideIcon } from "lucide-react";
import { TIPOS_VOTO } from "@/lib/constants";
import { toggleVoteAction } from "@/app/(app)/actions";
import { useToast } from "@/components/ui/Toast";

const ICONS: Record<string, LucideIcon> = {
  "thumbs-up": ThumbsUp,
  star: Star,
  flame: Flame,
  search: Search,
  x: X,
};

const QUICK = new Set(["util", "prioritario"]);

interface VoteState {
  counts: Record<string, number>;
  mine: string[];
}

/**
 * Shared vote control with optimistic UI. `quick` shows the two fast votes
 * (feed cards); `full` shows all vote types (post detail). The count reacts
 * instantly and reverts on error.
 */
export default function VoteChips({
  postId,
  counts,
  myVotes,
  mode = "full",
  size,
}: {
  postId: string;
  counts: Record<string, number>;
  myVotes: string[];
  mode?: "quick" | "full";
  size?: "sm";
}) {
  const router = useRouter();
  const toast = useToast();
  const [pending, startTransition] = useTransition();

  const [state, addOptimistic] = useOptimistic<VoteState, string>(
    { counts, mine: myVotes },
    (prev, tipo) => {
      const has = prev.mine.includes(tipo);
      return {
        counts: {
          ...prev.counts,
          [tipo]: Math.max(0, (prev.counts[tipo] ?? 0) + (has ? -1 : 1)),
        },
        mine: has ? prev.mine.filter((s) => s !== tipo) : [...prev.mine, tipo],
      };
    }
  );

  const vote = (tipo: string) =>
    startTransition(async () => {
      addOptimistic(tipo);
      const res = await toggleVoteAction(postId, tipo);
      if (res?.error) {
        toast.error(res.error);
        return;
      }
      router.refresh();
    });

  const list = mode === "quick" ? TIPOS_VOTO.filter((t) => QUICK.has(t.slug)) : TIPOS_VOTO;

  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
      {list.map((t) => {
        const Icon = ICONS[t.icon] ?? ThumbsUp;
        const active = state.mine.includes(t.slug);
        const accent = t.es_positivo ? "#6B9000" : "var(--dg-error)";
        const activeBg = t.es_positivo ? "rgba(153,204,6,0.14)" : "rgba(198,42,47,0.10)";
        return (
          <button
            key={t.slug}
            type="button"
            onClick={() => vote(t.slug)}
            disabled={pending}
            aria-pressed={active}
            className={`dg-votechip ${size === "sm" ? "dg-votechip--sm" : ""} ${
              active ? "dg-votechip--active" : ""
            }`.trim()}
            style={active ? { borderColor: accent, background: activeBg, color: accent } : undefined}
          >
            <Icon size={size === "sm" ? 14 : 15} aria-hidden="true" /> {t.nombre} ·{" "}
            {state.counts[t.slug] ?? 0}
          </button>
        );
      })}
    </div>
  );
}
