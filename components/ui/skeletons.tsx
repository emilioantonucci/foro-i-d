import Card from "./Card";
import Skeleton from "./Skeleton";

/** Page title + subtitle placeholder. */
export function SkelHeading() {
  return (
    <div style={{ marginBottom: "20px" }}>
      <Skeleton w={220} h={24} radius={8} />
      <div style={{ height: "10px" }} />
      <Skeleton w={320} h={14} />
    </div>
  );
}

/** A single feed post card placeholder. */
export function SkelPostCard() {
  return (
    <Card pad="md" style={{ marginBottom: "14px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "12px" }}>
        <Skeleton circle w={32} />
        <div style={{ flex: 1 }}>
          <Skeleton w={130} h={12} />
          <div style={{ height: "6px" }} />
          <Skeleton w={70} h={10} />
        </div>
      </div>
      <Skeleton w="85%" h={18} radius={6} />
      <div style={{ height: "12px" }} />
      <Skeleton w="100%" h={46} radius={10} />
      <div style={{ height: "14px" }} />
      <div style={{ display: "flex", gap: "12px" }}>
        <Skeleton w={92} h={26} radius={999} />
        <Skeleton w={52} h={26} radius={999} />
      </div>
    </Card>
  );
}

export function SkelFeed({ count = 4 }: { count?: number }) {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <SkelPostCard key={i} />
      ))}
    </>
  );
}

/** Leaderboard / contributors rail placeholder. */
export function SkelRail({ rows = 6 }: { rows?: number }) {
  return (
    <Card pad="md">
      <Skeleton w={120} h={11} />
      <div style={{ height: "16px" }} />
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} style={{ display: "flex", alignItems: "center", gap: "10px", padding: "7px 0" }}>
          <Skeleton circle w={30} />
          <div style={{ flex: 1 }}>
            <Skeleton w="70%" h={12} />
            <div style={{ height: "5px" }} />
            <Skeleton w="40%" h={10} />
          </div>
          <Skeleton w={24} h={14} />
        </div>
      ))}
    </Card>
  );
}

/** Four KPI cards (responsive grid). */
export function SkelKpis() {
  return (
    <div className="dg-grid-kpis" style={{ marginBottom: "18px" }}>
      {Array.from({ length: 4 }).map((_, i) => (
        <Card key={i} pad="md">
          <Skeleton w={56} h={28} radius={8} />
          <div style={{ height: "12px" }} />
          <Skeleton w="80%" h={12} />
        </Card>
      ))}
    </div>
  );
}

/** A generic panel card with a label and a block area. */
export function SkelPanel({ h = 180 }: { h?: number }) {
  return (
    <Card pad="md">
      <Skeleton w={150} h={11} />
      <div style={{ height: "18px" }} />
      <Skeleton w="100%" h={h} radius={10} />
    </Card>
  );
}

/** Leaderboard table placeholder. */
export function SkelTable({ rows = 8 }: { rows?: number }) {
  return (
    <Card pad="sm">
      {Array.from({ length: rows }).map((_, i) => (
        <div
          key={i}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "12px",
            padding: "11px 10px",
            borderTop: i === 0 ? "none" : "1px solid var(--dg-gray-100)",
          }}
        >
          <Skeleton w={16} h={12} />
          <Skeleton circle w={28} />
          <Skeleton w="32%" h={13} />
          <Skeleton w={80} h={12} style={{ marginLeft: "auto" }} />
          <Skeleton w={40} h={13} />
        </div>
      ))}
    </Card>
  );
}
