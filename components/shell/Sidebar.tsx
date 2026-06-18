"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { Radar, Grid2x2, Trophy, BarChart3, LogOut } from "lucide-react";
import type { ShellProfile } from "./AppShell";
import { initials, avatarColor } from "@/lib/ui";

interface NavItem {
  href: string;
  label: string;
  Icon: typeof Radar;
}

const PRIMARY: NavItem[] = [{ href: "/radar", label: "Radar de enlaces", Icon: Radar }];

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
      style={{
        display: "flex",
        alignItems: "center",
        gap: "11px",
        padding: "9px 13px",
        borderRadius: "9px",
        background: active ? "rgba(153,204,6,0.14)" : "transparent",
        color: active ? "#262626" : "#525252",
        fontSize: "13.5px",
        fontWeight: active ? 700 : 500,
      }}
    >
      <Icon size={18} color={active ? "#6b9000" : "#8a8a90"} />
      {item.label}
    </Link>
  );
}

export default function Sidebar({ profile }: { profile: ShellProfile }) {
  const pathname = usePathname();
  const isActive = (href: string) =>
    pathname === href || pathname.startsWith(href + "/");

  return (
    <aside
      style={{
        width: "250px",
        flex: "none",
        background: "#fff",
        borderRight: "1px solid #E8E8E8",
        display: "flex",
        flexDirection: "column",
        position: "sticky",
        top: 0,
        height: "100vh",
      }}
    >
      <div
        style={{
          padding: "20px 20px 16px",
          display: "flex",
          alignItems: "center",
          gap: "10px",
          borderBottom: "1px solid #F4F4F4",
        }}
      >
        <Image
          src="/assets/logo-primary.png"
          alt="doinGlobal"
          width={94}
          height={19}
          style={{ height: "19px", width: "auto" }}
        />
        <span style={{ width: "1px", height: "18px", background: "#E0DED9" }} />
        <span
          style={{
            fontFamily: "'Poppins', sans-serif",
            fontWeight: 700,
            fontSize: "15px",
            letterSpacing: "-0.01em",
          }}
        >
          I+D Hub
        </span>
      </div>

      <nav
        style={{
          padding: "14px 12px",
          display: "flex",
          flexDirection: "column",
          gap: "2px",
          flex: 1,
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
            color: "#AAAAB4",
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

      <div style={{ padding: "12px", borderTop: "1px solid #F4F4F4" }}>
        <Link
          href="/perfil"
          style={{
            display: "flex",
            alignItems: "center",
            gap: "10px",
            padding: "8px",
            borderRadius: "9px",
            background: isActive("/perfil") ? "rgba(153,204,6,0.14)" : "transparent",
          }}
        >
          <span
            style={{
              width: "36px",
              height: "36px",
              borderRadius: "50%",
              background: avatarColor(profile.nombre),
              color: "#fff",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontWeight: 700,
              fontSize: "13px",
              flex: "none",
            }}
          >
            {initials(profile.nombre)}
          </span>
          <span style={{ minWidth: 0 }}>
            <span
              style={{
                display: "block",
                fontWeight: 700,
                fontSize: "13px",
                color: "#262626",
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
            >
              {profile.nombre}
            </span>
            <span style={{ display: "block", fontSize: "12px", color: "#6b9000", fontWeight: 600 }}>
              {profile.rango} · {profile.puntos} pts
            </span>
          </span>
        </Link>

        <form action="/api/auth/signout" method="post" style={{ marginTop: "4px" }}>
          <button
            type="submit"
            style={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
              width: "100%",
              padding: "9px 13px",
              borderRadius: "9px",
              background: "transparent",
              border: "none",
              color: "#525252",
              fontSize: "13px",
              fontWeight: 500,
              cursor: "pointer",
            }}
          >
            <LogOut size={17} color="#8a8a90" /> Cerrar sesión
          </button>
        </form>
      </div>
    </aside>
  );
}
