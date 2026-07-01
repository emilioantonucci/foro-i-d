"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import Sidebar from "./Sidebar";
import Topbar from "./Topbar";
import type { ShellProfile } from "./AppShell";

/**
 * Client shell that owns the mobile drawer state shared between the Topbar
 * (hamburger) and the Sidebar (off-canvas drawer). `children` is the
 * server-rendered page tree, passed through untouched.
 */
export default function ShellLayout({
  profile,
  notifUnread = 0,
  banner,
  children,
}: {
  profile: ShellProfile;
  notifUnread?: number;
  banner?: React.ReactNode;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const asideRef = useRef<HTMLElement>(null);
  const restoreFocus = useRef<HTMLElement | null>(null);

  // Close the drawer whenever the route changes.
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  // Close the drawer if the viewport grows back to desktop.
  useEffect(() => {
    const onResize = () => {
      if (window.innerWidth > 900) setOpen(false);
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  // While open: lock scroll, trap focus, close on Escape, restore focus.
  useEffect(() => {
    if (!open) return;
    const aside = asideRef.current;
    restoreFocus.current = document.activeElement as HTMLElement | null;

    const focusables = () =>
      aside
        ? Array.from(
            aside.querySelectorAll<HTMLElement>(
              'a[href], button:not([disabled]), input, [tabindex]:not([tabindex="-1"])'
            )
          )
        : [];

    focusables()[0]?.focus();

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
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
  }, [open]);

  return (
    <div className="dg-shell">
      <Sidebar
        ref={asideRef}
        profile={profile}
        open={open}
        onClose={() => setOpen(false)}
      />
      {open && (
        <div
          className="dg-shell__backdrop"
          onClick={() => setOpen(false)}
          aria-hidden="true"
        />
      )}
      <div className="dg-shell__main">
        <Suspense
          fallback={
            <div
              style={{
                height: "59px",
                borderBottom: "1px solid var(--border-default)",
                background: "var(--dg-white)",
              }}
            />
          }
        >
          <Topbar onMenu={() => setOpen(true)} unreadInicial={notifUnread} />
        </Suspense>
        <main id="main" className="dg-shell__content">
          {banner}
          {children}
        </main>
      </div>
    </div>
  );
}
