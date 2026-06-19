import Card from "@/components/ui/Card";
import Skeleton from "@/components/ui/Skeleton";
import { SkelHeading, SkelTable, SkelPanel } from "@/components/ui/skeletons";

export default function Loading() {
  return (
    <div>
      <SkelHeading />
      <Card pad="lg" style={{ marginBottom: "18px" }}>
        <Skeleton w={200} h={11} />
        <div style={{ height: "16px" }} />
        <div className="dg-hscroll" style={{ display: "flex", gap: "10px" }}>
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} w={130} h={96} radius={12} style={{ flex: "none" }} />
          ))}
        </div>
      </Card>
      <div className="dg-two-col--wide-rail">
        <div>
          <SkelTable rows={8} />
        </div>
        <div className="dg-two-col__rail">
          <SkelPanel h={220} />
        </div>
      </div>
    </div>
  );
}
