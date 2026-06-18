import type { CountRow } from "@/lib/data/dashboard";

/** Donut built from a single conic-gradient (no chart library). */
export function DonutChart({ data }: { data: CountRow[] }) {
  const total = data.reduce((s, d) => s + d.total, 0);
  const palette = ["#99CC06", "#30587D", "#FFBA1A", "#C62A2F", "#6b9000", "#AAAAB4", "#38761D", "#B45F06"];

  let acc = 0;
  const stops: string[] = [];
  data.forEach((d, i) => {
    const color = d.color ?? palette[i % palette.length];
    const from = total ? (acc / total) * 100 : 0;
    acc += d.total;
    const to = total ? (acc / total) * 100 : 0;
    stops.push(`${color} ${from}% ${to}%`);
  });
  const gradient = total ? `conic-gradient(${stops.join(", ")})` : "conic-gradient(#E0DED9 0% 100%)";

  return (
    <div style={{ display: "flex", alignItems: "center", gap: "20px", flexWrap: "wrap" }}>
      <div style={{ position: "relative", width: "130px", height: "130px", flex: "none" }}>
        <div style={{ width: "100%", height: "100%", borderRadius: "50%", background: gradient }} />
        <div style={{ position: "absolute", inset: "26px", borderRadius: "50%", background: "#fff", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
          <span style={{ fontFamily: "'Poppins',sans-serif", fontSize: "22px", fontWeight: 700, color: "#262626" }}>{total}</span>
          <span style={{ fontSize: "11px", color: "#AAAAB4" }}>total</span>
        </div>
      </div>
      <div style={{ flex: 1, minWidth: "140px" }}>
        {data.map((d, i) => (
          <div key={d.nombre} style={{ display: "flex", alignItems: "center", gap: "8px", padding: "3px 0", fontSize: "12.5px" }}>
            <span style={{ width: "10px", height: "10px", borderRadius: "3px", background: d.color ?? palette[i % palette.length], flex: "none" }} />
            <span style={{ flex: 1, color: "#525252" }}>{d.nombre}</span>
            <span style={{ fontWeight: 700, color: "#262626" }}>{d.total}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/** Horizontal bars (no chart library). */
export function CategoryBars({ data }: { data: CountRow[] }) {
  const max = Math.max(1, ...data.map((d) => d.total));
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
      {data.length === 0 ? (
        <p style={{ fontSize: "13px", color: "#AAAAB4", margin: 0 }}>Sin datos todavía.</p>
      ) : (
        data.map((d) => (
          <div key={d.nombre}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12.5px", marginBottom: "4px" }}>
              <span style={{ color: "#525252" }}>{d.nombre}</span>
              <span style={{ fontWeight: 700, color: "#262626" }}>{d.total}</span>
            </div>
            <div style={{ height: "8px", borderRadius: "999px", background: "#F0F0EE", overflow: "hidden" }}>
              <div style={{ width: `${(d.total / max) * 100}%`, height: "100%", background: "#99CC06" }} />
            </div>
          </div>
        ))
      )}
    </div>
  );
}
