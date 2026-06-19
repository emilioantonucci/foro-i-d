"use client";

import { useSearchParams } from "next/navigation";
import { Search, Plus, X, Menu } from "lucide-react";
import Button from "@/components/ui/Button";
import IconButton from "@/components/ui/IconButton";

export default function Topbar({ onMenu }: { onMenu?: () => void }) {
  const sp = useSearchParams();
  const q = sp.get("q") ?? "";

  return (
    <header className="dg-topbar">
      {onMenu && (
        <IconButton
          label="Abrir menú"
          className="dg-topbar__menu"
          onClick={onMenu}
        >
          <Menu size={20} aria-hidden="true" />
        </IconButton>
      )}

      <form action="/radar" method="get" className="dg-topbar__search" role="search">
        <label htmlFor="topbar-search" className="sr-only">
          Buscar en el radar
        </label>
        <Search
          size={17}
          color="var(--fg-muted)"
          aria-hidden="true"
          style={{ position: "absolute", left: "13px", top: "50%", transform: "translateY(-50%)" }}
        />
        <input
          id="topbar-search"
          key={q}
          name="q"
          defaultValue={q}
          placeholder="Buscar enlaces, temas, personas…"
          style={{
            width: "100%",
            padding: "9px 38px 9px 38px",
            border: "1px solid var(--border-default)",
            borderRadius: "var(--radius-pill)",
            fontSize: "13.5px",
            color: "var(--fg-primary)",
            background: "var(--dg-gray-50)",
            outline: "none",
          }}
        />
        {q && (
          <IconButton
            label="Limpiar búsqueda"
            href="/radar"
            size="sm"
            style={{
              position: "absolute",
              right: "5px",
              top: "50%",
              transform: "translateY(-50%)",
            }}
          >
            <X size={15} aria-hidden="true" />
          </IconButton>
        )}
      </form>

      <div style={{ marginLeft: "auto" }}>
        <Button
          href="/publicar"
          size="sm"
          className="dg-topbar__publish"
          icon={<Plus size={16} aria-hidden="true" />}
        >
          <span className="dg-topbar__publish-label">Publicar enlace</span>
        </Button>
      </div>
    </header>
  );
}
