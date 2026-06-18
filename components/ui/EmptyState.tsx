import Link from "next/link";

export default function EmptyState({
  title,
  desc,
  ctaHref,
  ctaLabel,
}: {
  title: string;
  desc?: string;
  ctaHref?: string;
  ctaLabel?: string;
}) {
  return (
    <div
      style={{
        background: "#fff",
        border: "1px dashed #D4D4D4",
        borderRadius: "14px",
        padding: "44px 32px",
        textAlign: "center",
      }}
    >
      <p style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 700, fontSize: "16px", color: "#404040", margin: "0 0 6px" }}>
        {title}
      </p>
      {desc && <p style={{ fontSize: "13.5px", color: "#737373", margin: "0 0 16px" }}>{desc}</p>}
      {ctaHref && ctaLabel && (
        <Link href={ctaHref} className="dg-btn dg-btn--primary" style={{ fontSize: "13px" }}>
          {ctaLabel}
        </Link>
      )}
    </div>
  );
}
