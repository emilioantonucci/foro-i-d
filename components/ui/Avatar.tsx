import { initials, avatarColor } from "@/lib/ui";

/** Round avatar with deterministic brand color + initials. */
export default function Avatar({
  name,
  size = 32,
  className,
  title,
}: {
  name: string | null | undefined;
  size?: number;
  className?: string;
  title?: string;
}) {
  return (
    <span
      className={`dg-avatar ${className ?? ""}`.trim()}
      title={title}
      aria-hidden={title ? undefined : true}
      style={{
        width: size,
        height: size,
        fontSize: Math.round(size * 0.4),
        background: avatarColor(name),
      }}
    >
      {initials(name)}
    </span>
  );
}
