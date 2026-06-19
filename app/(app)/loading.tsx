import { SkelHeading, SkelFeed } from "@/components/ui/skeletons";

export default function Loading() {
  return (
    <div>
      <SkelHeading />
      <SkelFeed count={3} />
    </div>
  );
}
