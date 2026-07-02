"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import IconButton from "./IconButton";

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
  /** Ancho máximo del panel (default 640px). */
  width?: number;
}

/**
 * Modal accesible reutilizable: portal a body, focus trap + Escape + restore
 * focus (mismo patrón que el drawer de ShellLayout), scroll lock y cierre por
 * click en el backdrop. El body del modal scrollea si el contenido es largo.
 */
export default function Modal({ open, onClose, title, children, footer, width = 640 }: ModalProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const restoreFocus = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!open) return;
    const panel = panelRef.current;
    restoreFocus.current = document.activeElement as HTMLElement | null;

    const focusables = () =>
      panel
        ? Array.from(
            panel.querySelectorAll<HTMLElement>(
              'a[href], button:not([disabled]), input, select, textarea, [tabindex]:not([tabindex="-1"])',
            ),
          )
        : [];

    focusables()[0]?.focus();

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
        return;
      }
      if (e.key !== "Tab") return;
      const items = focusables();
      if (items.length === 0) return;
      const first = items[0];
      const last = items[items.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
      restoreFocus.current?.focus?.();
    };
  }, [open, onClose]);

  if (!open) return null;

  return createPortal(
    <div className="dg-modal-overlay" onClick={onClose}>
      <div
        ref={panelRef}
        className="dg-modal"
        style={{ maxWidth: `${width}px` }}
        role="dialog"
        aria-modal="true"
        aria-labelledby="dg-modal-title"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="dg-modal__head">
          <h2 id="dg-modal-title" className="dg-modal__title">
            {title}
          </h2>
          <IconButton label="Cerrar" onClick={onClose} size="sm">
            <X size={16} aria-hidden="true" />
          </IconButton>
        </div>
        <div className="dg-modal__body">{children}</div>
        {footer && <div className="dg-modal__foot">{footer}</div>}
      </div>
    </div>,
    document.body,
  );
}
