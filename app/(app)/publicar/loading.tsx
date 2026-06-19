import Card from "@/components/ui/Card";
import Skeleton from "@/components/ui/Skeleton";
import { SkelHeading, SkelPanel } from "@/components/ui/skeletons";

export default function Loading() {
  return (
    <div>
      <SkelHeading />
      <div className="dg-two-col--wide-rail">
        <Card pad="lg">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} style={{ marginBottom: "16px" }}>
              <Skeleton w={120} h={12} />
              <div style={{ height: "8px" }} />
              <Skeleton w="100%" h={40} radius={10} />
            </div>
          ))}
        </Card>
        <div className="dg-two-col__rail">
          <SkelPanel h={200} />
        </div>
      </div>
    </div>
  );
}
