import type { CSSProperties } from "react";

/** Shimmer placeholder for loading states. */
export default function Skeleton({
  w = "100%",
  h = 14,
  radius,
  circle,
  className,
  style,
}: {
  w?: number | string;
  h?: number | string;
  radius?: number | string;
  circle?: boolean;
  className?: string;
  style?: CSSProperties;
}) {
  return (
    <span
      className={`dg-skel ${circle ? "dg-skel--circle" : ""} ${className ?? ""}`.trim()}
      aria-hidden="true"
      style={{
        width: w,
        height: circle ? w : h,
        borderRadius: circle ? "50%" : radius,
        ...style,
      }}
    />
  );
}
