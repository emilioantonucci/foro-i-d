"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Search, Plus, X } from "lucide-react";

export default function Topbar() {
  const sp = useSearchParams();
  const q = sp.get("q") ?? "";

  return (
    <header
      style={{
        position: "sticky",
        top: 0,
        zIndex: 20,
        background: "rgba(255,255,255,0.96)",
        backdropFilter: "blur(8px)",
        borderBottom: "1px solid #E8E8E8",
        padding: "12px 28px",
        display: "flex",
        alignItems: "center",
        gap: "16px",
      }}
    >
      <form action="/radar" method="get" style={{ position: "relative", flex: 1, maxWidth: "520px" }}>
        <Search
          size={17}
          color="#AAAAB4"
          style={{ position: "absolute", left: "13px", top: "50%", transform: "translateY(-50%)" }}
        />
        <input
          key={q}
          name="q"
          defaultValue={q}
          placeholder="Buscar enlaces, temas, personas…"
          style={{
            width: "100%",
            padding: "9px 34px 9px 38px",
            border: "1px solid #E8E8E8",
            borderRadius: "999px",
            fontSize: "13.5px",
            color: "#262626",
            background: "#F7F7F5",
            outline: "none",
          }}
        />
        {q && (
          <Link
            href="/radar"
            title="Limpiar búsqueda"
            style={{ position: "absolute", right: "12px", top: "50%", transform: "translateY(-50%)", display: "flex" }}
          >
            <X size={15} color="#AAAAB4" />
          </Link>
        )}
      </form>

      <div style={{ marginLeft: "auto" }}>
        <Link href="/publicar" className="dg-btn dg-btn--primary" style={{ fontSize: "13px", padding: "9px 16px" }}>
          <Plus size={16} /> Publicar enlace
        </Link>
      </div>
    </header>
  );
}
