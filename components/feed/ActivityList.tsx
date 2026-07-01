"use client";

import { useState } from "react";
import Link from "next/link";
import Avatar from "@/components/ui/Avatar";

export interface ActivityItem {
  id: string;
  nombre: string | null;
  texto: string;
  href: string;
  when: string;
}

const STEP = 8;

/** Lista con "Ver más": revela de a STEP ítems dentro del mismo card,
 *  sin round-trips (el server ya cargó hasta 40). */
export default function ActivityList({ items }: { items: ActivityItem[] }) {
  const [visible, setVisible] = useState(STEP);

  return (
    <>
      {items.slice(0, visible).map((it) => (
        <Link
          key={it.id}
          href={it.href}
          style={{ display: "flex", alignItems: "flex-start", gap: "10px", padding: "7px 0" }}
        >
          <Avatar name={it.nombre} size={26} title={it.nombre ?? "Colaborador"} />
          <span style={{ minWidth: 0, flex: 1 }}>
            <span
              style={{
                display: "-webkit-box",
                WebkitLineClamp: 2,
                WebkitBoxOrient: "vertical",
                overflow: "hidden",
                fontSize: "13px",
                color: "var(--fg-primary)",
                lineHeight: 1.35,
              }}
            >
              <span style={{ fontWeight: 700 }}>{it.nombre ?? "Colaborador"}</span> {it.texto}
            </span>
            <span style={{ display: "block", fontSize: "11.5px", color: "var(--fg-muted)", marginTop: "2px" }}>
              {it.when}
            </span>
          </span>
        </Link>
      ))}
      {visible < items.length && (
        <button
          type="button"
          className="dg-pagebtn"
          onClick={() => setVisible((v) => v + STEP)}
          style={{ display: "block", width: "100%", marginTop: "10px", cursor: "pointer" }}
        >
          Ver más
        </button>
      )}
    </>
  );
}
