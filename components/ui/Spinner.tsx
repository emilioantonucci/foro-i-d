import { Loader2 } from "lucide-react";

/** Inline loading spinner. Reuses the `.spin` keyframe from globals.css. */
export default function Spinner({
  size = 16,
  color,
  className = "",
}: {
  size?: number;
  color?: string;
  className?: string;
}) {
  return (
    <Loader2
      size={size}
      color={color}
      className={`spin ${className}`.trim()}
      aria-hidden
    />
  );
}
