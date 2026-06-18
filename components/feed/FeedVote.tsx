"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { ThumbsUp, Flame } from "lucide-react";
import { toggleVoteAction } from "@/app/(app)/actions";

const QUICK = [
  { slug: "util", label: "Útil", Icon: ThumbsUp },
  { slug: "prioritario", label: "Prioritario", Icon: Flame },
];

export default function FeedVote({
  postId,
  counts,
  misVotos,
}: {
  postId: string;
  counts: Record<string, number>;
  misVotos: string[];
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const vote = (tipo: string) =>
    startTransition(async () => {
      await toggleVoteAction(postId, tipo);
      router.refresh();
    });

  return (
    <div style={{ display: "flex", gap: "8px" }}>
      {QUICK.map(({ slug, label, Icon }) => {
        const active = misVotos.includes(slug);
        return (
          <button
            key={slug}
            type="button"
            onClick={() => vote(slug)}
            disabled={pending}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              padding: "6px 11px",
              borderRadius: "999px",
              fontSize: "12.5px",
              fontWeight: 700,
              cursor: "pointer",
              border: active ? "1.5px solid #6b9000" : "1px solid #E8E8E8",
              background: active ? "rgba(153,204,6,0.14)" : "#fff",
              color: active ? "#6b9000" : "#525252",
              opacity: pending ? 0.6 : 1,
            }}
          >
            <Icon size={14} /> {label} · {counts[slug] ?? 0}
          </button>
        );
      })}
    </div>
  );
}
