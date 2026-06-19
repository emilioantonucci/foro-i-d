import Card from "@/components/ui/Card";
import Skeleton from "@/components/ui/Skeleton";
import { SkelKpis } from "@/components/ui/skeletons";

export default function Loading() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
      <Card pad="lg">
        <div style={{ display: "flex", gap: "16px", alignItems: "center" }}>
          <Skeleton circle w={64} />
          <div style={{ flex: 1 }}>
            <Skeleton w={180} h={20} radius={6} />
            <div style={{ height: "8px" }} />
            <Skeleton w={120} h={12} />
          </div>
        </div>
        <div style={{ height: "18px" }} />
        <Skeleton w="100%" h={10} radius={999} />
      </Card>
      <SkelKpis />
      <Card pad="md">
        <Skeleton w={140} h={11} />
        <div style={{ height: "16px" }} />
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} style={{ padding: "10px 0", borderTop: i === 0 ? "none" : "1px solid var(--dg-gray-100)" }}>
            <Skeleton w="70%" h={14} />
            <div style={{ height: "6px" }} />
            <Skeleton w="40%" h={11} />
          </div>
        ))}
      </Card>
    </div>
  );
}
