"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Bell } from "lucide-react";
import IconButton from "@/components/ui/IconButton";
import Avatar from "@/components/ui/Avatar";
import { bellText } from "@/lib/activity-text";
import { timeAgo } from "@/lib/ui";
import { markNotificationsSeenAction } from "@/app/(app)/actions";
import type { BellNotification } from "@/lib/types";

const POLL_MS = 60_000;

/**
 * Campanita del Topbar: badge con las notificaciones no vistas y dropdown
 * con la actividad ajena (v_notificaciones, 15 días). Abrirla marca todo
 * como visto (cursor notif_seen_at). El count inicial viene del server para
 * no arrancar en 0 y "saltar"; después se refresca por polling suave.
 */
export default function NotificationBell({
  unreadInicial,
}: {
  unreadInicial: number;
}) {
  const [unread, setUnread] = useState(unreadInicial);
  const [items, setItems] = useState<BellNotification[] | null>(null);
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const openRef = useRef(open);
  openRef.current = open;

  const refresh = useCallback(async () => {
    try {
      const res = await fetch("/api/notifications/bell");
      if (!res.ok) return;
      const data = (await res.json()) as {
        items: BellNotification[];
        unread: number;
      };
      setItems(data.items ?? []);
      // Con el panel abierto todo lo listado ya se considera visto: no
      // pisar el 0 optimista con un count que puede correr antes del update.
      if (!openRef.current) setUnread(data.unread ?? 0);
    } catch {
      // polling: el próximo intento lo resuelve
    }
  }, []);

  // Polling + refetch al volver a la pestaña.
  useEffect(() => {
    const id = setInterval(refresh, POLL_MS);
    const onVisibility = () => {
      if (document.visibilityState === "visible") refresh();
    };
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      clearInterval(id);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [refresh]);

  // Abierto: cerrar con click afuera o Escape (devolviendo el foco al botón).
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        rootRef.current?.querySelector("button")?.focus();
      }
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const toggle = () => {
    const next = !open;
    setOpen(next);
    if (!next) return;
    refresh();
    if (unread > 0) {
      setUnread(0);
      markNotificationsSeenAction().catch(() => {});
    }
  };

  const label =
    unread > 0 ? `Notificaciones, ${unread} sin ver` : "Notificaciones";

  return (
    <div className="dg-bell" ref={rootRef}>
      <IconButton
        label={label}
        onClick={toggle}
        aria-expanded={open}
        aria-controls="bell-menu"
        aria-haspopup="true"
      >
        <Bell size={20} aria-hidden="true" />
      </IconButton>
      {unread > 0 && (
        <span className="dg-bell__badge" aria-hidden="true">
          {unread > 99 ? "99+" : unread}
        </span>
      )}
      <span className="sr-only" aria-live="polite">
        {unread > 0 ? `${unread} notificaciones sin ver` : ""}
      </span>

      {open && (
        <div id="bell-menu" className="dg-bell__menu" role="region" aria-label="Notificaciones">
          <div className="dg-section-label" style={{ marginBottom: "8px" }}>
            Notificaciones
          </div>
          {items === null ? (
            <p className="dg-bell__empty">Cargando…</p>
          ) : items.length === 0 ? (
            <p className="dg-bell__empty">Estás al día. Nada nuevo por acá.</p>
          ) : (
            items.map((n) => {
              const { texto, href } = bellText(n);
              return (
                <Link
                  key={n.id}
                  href={href}
                  className={
                    n.es_para_mi
                      ? "dg-bell__item dg-bell__item--mine"
                      : "dg-bell__item"
                  }
                  onClick={() => setOpen(false)}
                >
                  <Avatar
                    name={n.actor_nombre}
                    src={n.actor_avatar}
                    size={26}
                    title={n.actor_nombre ?? "Colaborador"}
                  />
                  <span style={{ minWidth: 0, flex: 1 }}>
                    <span className="dg-bell__text">
                      <span style={{ fontWeight: 700 }}>
                        {n.actor_nombre ?? "Colaborador"}
                      </span>{" "}
                      {texto}
                    </span>
                    <span className="dg-bell__when">{timeAgo(n.created_at)}</span>
                  </span>
                </Link>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
