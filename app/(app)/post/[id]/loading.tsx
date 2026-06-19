import Card from "@/components/ui/Card";
import Skeleton from "@/components/ui/Skeleton";
import { SkelPanel } from "@/components/ui/skeletons";

export default function Loading() {
  return (
    <div className="dg-two-col--wide-rail">
      <div>
        <Skeleton w={120} h={12} />
        <div style={{ height: "14px" }} />
        <Card pad="lg">
          <div style={{ display: "flex", gap: "10px", alignItems: "center", marginBottom: "14px" }}>
            <Skeleton circle w={36} />
            <div style={{ flex: 1 }}>
              <Skeleton w={150} h={12} />
              <div style={{ height: "6px" }} />
              <Skeleton w={80} h={10} />
            </div>
          </div>
          <Skeleton w="90%" h={26} radius={6} />
          <div style={{ height: "16px" }} />
          <Skeleton w="100%" h={70} radius={10} />
          <div style={{ height: "16px" }} />
          <Skeleton w="100%" h={120} />
        </Card>
      </div>
      <div className="dg-two-col__rail">
        <SkelPanel h={180} />
      </div>
    </div>
  );
}
