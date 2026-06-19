import Link from "next/link";

export default function Pagination({
  page,
  totalPages,
  params,
}: {
  page: number;
  totalPages: number;
  params: Record<string, string | undefined>;
}) {
  if (totalPages <= 1) return null;
  const href = (p: number) => {
    const sp = new URLSearchParams();
    Object.entries({ ...params, page: String(p) }).forEach(([k, v]) => {
      if (v) sp.set(k, v);
    });
    return `/radar?${sp.toString()}`;
  };
  return (
    <nav
      aria-label="Paginación"
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: "14px",
        marginTop: "22px",
      }}
    >
      {page > 1 ? (
        <Link href={href(page - 1)} className="dg-pagebtn" rel="prev">
          ← Anterior
        </Link>
      ) : (
        <span className="dg-pagebtn dg-pagebtn--disabled" aria-disabled="true">
          ← Anterior
        </span>
      )}
      <span style={{ fontSize: "13px", color: "var(--fg-secondary)" }} aria-current="page">
        Página {page} de {totalPages}
      </span>
      {page < totalPages ? (
        <Link href={href(page + 1)} className="dg-pagebtn" rel="next">
          Siguiente →
        </Link>
      ) : (
        <span className="dg-pagebtn dg-pagebtn--disabled" aria-disabled="true">
          Siguiente →
        </span>
      )}
    </nav>
  );
}
