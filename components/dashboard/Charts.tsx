import type { CountRow } from "@/lib/data/dashboard";

const PALETTE = [
  "#99CC06",
  "#30587D",
  "#FFBA1A",
  "#C62A2F",
  "#6B9000",
  "#AAAAB4",
  "#38761D",
  "#B45F06",
];

/** Donut built from a single conic-gradient (no chart library). */
export function DonutChart({ data }: { data: CountRow[] }) {
  const total = data.reduce((s, d) => s + d.total, 0);

  let acc = 0;
  const stops: string[] = [];
  data.forEach((d, i) => {
    const color = d.color ?? PALETTE[i % PALETTE.length];
    const from = total ? (acc / total) * 100 : 0;
    acc += d.total;
    const to = total ? (acc / total) * 100 : 0;
    stops.push(`${color} ${from}% ${to}%`);
  });
  const gradient = total
    ? `conic-gradient(${stops.join(", ")})`
    : "conic-gradient(var(--border-strong) 0% 100%)";

  const summary = data.length
    ? `Distribución del contenido por estado: ${data.map((d) => `${d.nombre}, ${d.total}`).join("; ")}.`
    : "Sin datos de estado todavía.";

  return (
    <div style={{ display: "flex", alignItems: "center", gap: "20px", flexWrap: "wrap" }}>
      <div
        role="img"
        aria-label={summary}
        style={{ position: "relative", width: "130px", height: "130px", flex: "none" }}
      >
        <div style={{ width: "100%", height: "100%", borderRadius: "50%", background: gradient }} />
        <div
          style={{
            position: "absolute",
            inset: "26px",
            borderRadius: "50%",
            background: "var(--dg-white)",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <span style={{ fontFamily: "var(--font-secondary)", fontSize: "22px", fontWeight: 700, color: "var(--fg-primary)" }}>
            {total}
          </span>
          <span style={{ fontSize: "11px", color: "var(--fg-muted)" }}>total</span>
        </div>
      </div>
      <ul style={{ flex: 1, minWidth: "140px", listStyle: "none", margin: 0, padding: 0 }}>
        {data.map((d, i) => (
          <li key={d.nombre} style={{ display: "flex", alignItems: "center", gap: "8px", padding: "3px 0", fontSize: "12.5px" }}>
            <span
              style={{
                width: "10px",
                height: "10px",
                borderRadius: "3px",
                background: d.color ?? PALETTE[i % PALETTE.length],
                flex: "none",
              }}
              aria-hidden="true"
            />
            <span style={{ flex: 1, color: "var(--fg-secondary)" }}>{d.nombre}</span>
            <span style={{ fontWeight: 700, color: "var(--fg-primary)" }}>{d.total}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

/** Horizontal bars (no chart library). */
export function CategoryBars({ data }: { data: CountRow[] }) {
  const max = Math.max(1, ...data.map((d) => d.total));
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
      {data.length === 0 ? (
        <p style={{ fontSize: "13px", color: "var(--fg-muted)", margin: 0 }}>Sin datos todavía.</p>
      ) : (
        data.map((d) => (
          <div key={d.nombre}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12.5px", marginBottom: "4px" }}>
              <span style={{ color: "var(--fg-secondary)" }}>{d.nombre}</span>
              <span style={{ fontWeight: 700, color: "var(--fg-primary)" }}>{d.total}</span>
            </div>
            <div
              role="img"
              aria-label={`${d.nombre}: ${d.total}`}
              style={{ height: "8px", borderRadius: "var(--radius-pill)", background: "var(--dg-gray-100)", overflow: "hidden" }}
            >
              <div style={{ width: `${(d.total / max) * 100}%`, height: "100%", background: "var(--dg-green)" }} />
            </div>
          </div>
        ))
      )}
    </div>
  );
}
