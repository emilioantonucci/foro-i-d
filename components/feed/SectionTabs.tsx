"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Radar, Shuffle, type LucideIcon } from "lucide-react";

interface Tab {
  href: string;
  label: string;
  Icon: LucideIcon;
}

const TABS: Tab[] = [
  { href: "/radar", label: "Radar de enlaces", Icon: Radar },
  { href: "/datos", label: "Datos random", Icon: Shuffle },
];

/**
 * Segmented control to flip between the two feeds (Radar de enlaces ↔ Datos
 * random). Active tab derived from the pathname so it stays in sync with the
 * sidebar. Rendered at the top of /radar and /datos.
 */
export default function SectionTabs() {
  const pathname = usePathname();
  return (
    <div className="dg-segtabs" role="tablist" aria-label="Secciones del foro">
      {TABS.map(({ href, label, Icon }) => {
        const active = pathname === href || pathname.startsWith(href + "/");
        return (
          <Link
            key={href}
            href={href}
            role="tab"
            aria-selected={active}
            aria-current={active ? "page" : undefined}
            className={`dg-segtab ${active ? "dg-segtab--active" : ""}`.trim()}
          >
            <Icon size={16} aria-hidden="true" />
            {label}
          </Link>
        );
      })}
    </div>
  );
}
