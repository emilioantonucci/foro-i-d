import { SkelHeading, SkelPanel } from "@/components/ui/skeletons";

export default function Loading() {
  return (
    <div>
      <SkelHeading />
      <SkelPanel h={130} />
      <div style={{ height: "16px" }} />
      <SkelPanel h={420} />
    </div>
  );
}
