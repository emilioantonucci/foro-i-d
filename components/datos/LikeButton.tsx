"use client";

import { useOptimistic, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Heart } from "lucide-react";
import { toggleDatoLikeAction } from "@/app/(app)/actions";
import { useToast } from "@/components/ui/Toast";

interface LikeState {
  count: number;
  liked: boolean;
}

/**
 * "Me gusta" toggle with optimistic UI. The count reacts instantly and reverts
 * on error. Mirrors the VoteChips optimistic pattern.
 */
export default function LikeButton({
  datoId,
  count,
  liked,
  size,
}: {
  datoId: string;
  count: number;
  liked: boolean;
  size?: "sm";
}) {
  const router = useRouter();
  const toast = useToast();
  const [pending, startTransition] = useTransition();

  const [state, addOptimistic] = useOptimistic<LikeState, void>(
    { count, liked },
    (prev) => ({
      liked: !prev.liked,
      count: Math.max(0, prev.count + (prev.liked ? -1 : 1)),
    }),
  );

  const toggle = () =>
    startTransition(async () => {
      addOptimistic();
      const res = await toggleDatoLikeAction(datoId);
      if (res?.error) {
        toast.error(res.error);
        return;
      }
      router.refresh();
    });

  const accent = "#C62A2F";
  return (
    <button
      type="button"
      onClick={toggle}
      disabled={pending}
      aria-pressed={state.liked}
      aria-label={state.liked ? "Quitar me gusta" : "Me gusta"}
      className={`dg-votechip ${size === "sm" ? "dg-votechip--sm" : ""} ${
        state.liked ? "dg-votechip--active" : ""
      }`.trim()}
      style={state.liked ? { borderColor: accent, background: "rgba(198,42,47,0.10)", color: accent } : undefined}
    >
      <Heart
        size={size === "sm" ? 14 : 15}
        aria-hidden="true"
        fill={state.liked ? accent : "none"}
      />
      Me gusta · {state.count}
    </button>
  );
}
