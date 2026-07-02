"use client";

import { useOptimistic, useTransition } from "react";
import { useRouter } from "next/navigation";
import { BarChart3, Check } from "lucide-react";
import { votePollAction } from "@/app/(app)/actions";
import type { PollResult } from "@/lib/data/polls";
import { useToast } from "@/components/ui/Toast";

interface PollState {
  counts: Record<string, number>;
  mine: string | null;
  total: number;
}

/**
 * Encuesta estilo Instagram con UI optimista (patrón VoteChips). Los
 * resultados (% + total) se revelan recién después de votar; se puede
 * cambiar el voto clickeando otra opción.
 */
export default function PollWidget({ poll }: { poll: PollResult }) {
  const router = useRouter();
  const toast = useToast();
  const [pending, startTransition] = useTransition();

  const initial: PollState = {
    counts: Object.fromEntries(poll.opciones.map((o) => [o.id, o.votos])),
    mine: poll.miVotoOptionId,
    total: poll.totalVotos,
  };

  const [state, setOptimistic] = useOptimistic<PollState, string>(initial, (prev, optionId) => {
    if (prev.mine === optionId) return prev; // re-click en la misma: no-op
    const counts = { ...prev.counts };
    counts[optionId] = (counts[optionId] ?? 0) + 1;
    let total = prev.total;
    if (prev.mine) {
      counts[prev.mine] = Math.max(0, (counts[prev.mine] ?? 0) - 1);
    } else {
      total += 1;
    }
    return { counts, mine: optionId, total };
  });

  const votar = (optionId: string) =>
    startTransition(async () => {
      if (state.mine === optionId) return;
      setOptimistic(optionId);
      const res = await votePollAction(poll.id, optionId);
      if (res?.error) {
        toast.error(res.error);
        return;
      }
      router.refresh();
    });

  const voted = state.mine !== null;

  return (
    <div
      style={{
        border: "1px solid var(--border-default)",
        borderRadius: "var(--radius-md)",
        padding: "14px",
        margin: "0 0 16px",
      }}
    >
      <div
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: "6px",
          fontSize: "11px",
          fontWeight: 700,
          color: "#6B9000",
          textTransform: "uppercase",
          letterSpacing: ".08em",
          marginBottom: "8px",
        }}
      >
        <BarChart3 size={13} aria-hidden="true" /> Encuesta
      </div>
      <div style={{ fontSize: "15px", fontWeight: 700, color: "var(--fg-primary)", marginBottom: "12px" }}>
        {poll.pregunta}
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "8px" }} role="group" aria-label="Opciones de la encuesta">
        {poll.opciones.map((o) => {
          const count = state.counts[o.id] ?? 0;
          const pct = state.total > 0 ? Math.round((count / state.total) * 100) : 0;
          const isMine = state.mine === o.id;
          return (
            <button
              key={o.id}
              type="button"
              onClick={() => votar(o.id)}
              disabled={pending}
              aria-pressed={isMine}
              style={{
                position: "relative",
                overflow: "hidden",
                width: "100%",
                textAlign: "left",
                padding: "10px 12px",
                borderRadius: "var(--radius-md)",
                border: isMine ? "1.5px solid #99CC06" : "1px solid var(--border-default)",
                background: "var(--dg-white)",
                cursor: "pointer",
                fontSize: "13.5px",
                fontWeight: 600,
                color: "var(--fg-primary)",
              }}
            >
              {voted && (
                <span
                  aria-hidden="true"
                  style={{
                    position: "absolute",
                    inset: 0,
                    width: `${pct}%`,
                    background: isMine ? "rgba(153,204,6,0.18)" : "var(--dg-gray-100)",
                    transition: "width .25s ease",
                  }}
                />
              )}
              <span
                style={{
                  position: "relative",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: "10px",
                }}
              >
                <span style={{ display: "inline-flex", alignItems: "center", gap: "7px", minWidth: 0 }}>
                  {isMine && <Check size={14} color="#6B9000" aria-hidden="true" style={{ flex: "none" }} />}
                  <span style={{ overflow: "hidden", textOverflow: "ellipsis" }}>{o.texto}</span>
                </span>
                {voted && (
                  <span style={{ fontWeight: 700, color: "var(--fg-secondary)", flex: "none" }}>{pct}%</span>
                )}
              </span>
            </button>
          );
        })}
      </div>

      <div style={{ marginTop: "10px", fontSize: "12px", color: "var(--fg-muted)" }}>
        {voted
          ? `${state.total} ${state.total === 1 ? "voto" : "votos"} · podés cambiar tu voto`
          : "Votá para ver los resultados"}
      </div>
    </div>
  );
}
