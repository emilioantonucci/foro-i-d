import Link from "next/link";

const btn: React.CSSProperties = {
  padding: "8px 16px",
  borderRadius: "999px",
  border: "1px solid #E8E8E8",
  background: "#fff",
  fontSize: "13px",
  fontWeight: 700,
  color: "#262626",
};
const btnDisabled: React.CSSProperties = {
  ...btn,
  color: "#C9C7C2",
  borderColor: "#F0F0EE",
  cursor: "default",
};

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
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "14px", marginTop: "22px" }}>
      {page > 1 ? <Link href={href(page - 1)} style={btn}>← Anterior</Link> : <span style={btnDisabled}>← Anterior</span>}
      <span style={{ fontSize: "13px", color: "#737373" }}>Página {page} de {totalPages}</span>
      {page < totalPages ? <Link href={href(page + 1)} style={btn}>Siguiente →</Link> : <span style={btnDisabled}>Siguiente →</span>}
    </div>
  );
}
