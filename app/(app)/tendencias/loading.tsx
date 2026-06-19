import { SkelHeading, SkelPanel } from "@/components/ui/skeletons";

export default function Loading() {
  return (
    <div>
      <SkelHeading />
      <SkelPanel h={360} />
      <div style={{ height: "16px" }} />
      <div className="dg-grid-halves">
        <SkelPanel h={180} />
        <SkelPanel h={180} />
      </div>
    </div>
  );
}
