"use client";

import { forwardRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { Radar, Shuffle, Grid2x2, Trophy, BarChart3, LogOut, X } from "lucide-react";
import type { ShellProfile } from "./AppShell";
import Avatar from "@/components/ui/Avatar";
import IconButton from "@/components/ui/IconButton";

interface NavItem {
  href: string;
  label: string;
  Icon: typeof Radar;
}

const PRIMARY: NavItem[] = [
  { href: "/radar", label: "Radar de enlaces", Icon: Radar },
  { href: "/datos", label: "Datos random", Icon: Shuffle },
];

const CONOCIMIENTO: NavItem[] = [
  { href: "/tendencias", label: "Mapa de tendencias", Icon: Grid2x2 },
  { href: "/ranking", label: "Ranking", Icon: Trophy },
  { href: "/panel", label: "Panel ejecutivo", Icon: BarChart3 },
];

function NavLink({ item, active }: { item: NavItem; active: boolean }) {
  const { Icon } = item;
  return (
    <Link
      href={item.href}
      className={`dg-navlink ${active ? "dg-navlink--active" : ""}`.trim()}
      aria-current={active ? "page" : undefined}
    >
      <Icon size={18} color={active ? "#6B9000" : "#8A8A90"} aria-hidden="true" />
      {item.label}
    </Link>
  );
}

interface SidebarProps {
  profile: ShellProfile;
  open: boolean;
  onClose: () => void;
}

const Sidebar = forwardRef<HTMLElement, SidebarProps>(function Sidebar(
  { profile, open, onClose },
  ref
) {
  const pathname = usePathname();
  const isActive = (href: string) =>
    pathname === href || pathname.startsWith(href + "/");

  return (
    <aside
      ref={ref}
      className={`dg-sidebar ${open ? "dg-sidebar--open" : ""}`.trim()}
      aria-label="Navegación principal"
    >
      <div
        style={{
          padding: "20px 20px 16px",
          display: "flex",
          alignItems: "center",
          gap: "10px",
          borderBottom: "1px solid var(--dg-gray-100)",
        }}
      >
        <Image
          src="/assets/logo-primary.png"
          alt="doinGlobal"
          width={1822}
          height={258}
          style={{ height: "19px", width: "auto" }}
        />
        <span style={{ width: "1px", height: "18px", background: "var(--border-strong)" }} />
        <span
          style={{
            fontFamily: "var(--font-secondary)",
            fontWeight: 700,
            fontSize: "15px",
            letterSpacing: "-0.01em",
          }}
        >
          I+D Hub
        </span>
        <IconButton
          label="Cerrar menú"
          size="sm"
          className="dg-sidebar__close"
          onClick={onClose}
        >
          <X size={18} aria-hidden="true" />
        </IconButton>
      </div>

      <nav
        aria-label="Secciones"
        style={{
          padding: "14px 12px",
          display: "flex",
          flexDirection: "column",
          gap: "2px",
          flex: 1,
          overflowY: "auto",
        }}
      >
        {PRIMARY.map((item) => (
          <NavLink key={item.href} item={item} active={isActive(item.href)} />
        ))}

        <div
          style={{
            fontSize: "10.5px",
            letterSpacing: ".1em",
            textTransform: "uppercase",
            color: "var(--fg-muted)",
            fontWeight: 700,
            padding: "14px 13px 6px",
          }}
        >
          Conocimiento
        </div>
        {CONOCIMIENTO.map((item) => (
          <NavLink key={item.href} item={item} active={isActive(item.href)} />
        ))}
      </nav>

      <div style={{ padding: "12px", borderTop: "1px solid var(--dg-gray-100)" }}>
        <Link
          href="/perfil"
          className={`dg-navlink ${isActive("/perfil") ? "dg-navlink--active" : ""}`.trim()}
          aria-current={isActive("/perfil") ? "page" : undefined}
          style={{ gap: "10px", padding: "8px" }}
        >
          <Avatar name={profile.nombre} size={36} />
          <span style={{ minWidth: 0 }}>
            <span
              style={{
                display: "block",
                fontWeight: 700,
                fontSize: "13px",
                color: "var(--fg-primary)",
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
            >
              {profile.nombre}
            </span>
            <span style={{ display: "block", fontSize: "12px", color: "#6B9000", fontWeight: 600 }}>
              {profile.rango} · {profile.puntos} pts
            </span>
          </span>
        </Link>

        <form action="/api/auth/signout" method="post" style={{ marginTop: "4px" }}>
          <button type="submit" className="dg-navlink" style={{ width: "100%", border: "none", cursor: "pointer", background: "transparent" }}>
            <LogOut size={17} color="#8A8A90" aria-hidden="true" /> Cerrar sesión
          </button>
        </form>
      </div>
    </aside>
  );
});

export default Sidebar;
