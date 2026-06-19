import { SkelHeading, SkelKpis, SkelPanel } from "@/components/ui/skeletons";

export default function Loading() {
  return (
    <div>
      <SkelHeading />
      <SkelKpis />
      <div className="dg-grid-halves" style={{ marginBottom: "16px" }}>
        <SkelPanel h={200} />
        <SkelPanel h={200} />
      </div>
      <div className="dg-grid-halves">
        <SkelPanel h={160} />
        <SkelPanel h={160} />
      </div>
    </div>
  );
}
