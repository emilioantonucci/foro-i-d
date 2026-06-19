import Skeleton from "@/components/ui/Skeleton";
import { SkelFeed, SkelRail } from "@/components/ui/skeletons";

export default function Loading() {
  return (
    <div className="dg-two-col">
      <div>
        <Skeleton w={200} h={24} radius={8} />
        <div style={{ height: "10px" }} />
        <Skeleton w={320} h={14} />
        <div style={{ height: "20px" }} />
        <div style={{ display: "flex", gap: "8px", marginBottom: "16px", flexWrap: "wrap" }}>
          <Skeleton w={110} h={34} radius={999} />
          <Skeleton w={110} h={34} radius={999} />
          <Skeleton w={90} h={34} radius={999} />
        </div>
        <SkelFeed count={4} />
      </div>
      <div className="dg-two-col__rail">
        <SkelRail />
      </div>
    </div>
  );
}
