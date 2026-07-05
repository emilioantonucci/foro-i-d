import { initials, avatarColor } from "@/lib/ui";

/**
 * Round avatar. If `src` is provided (foto de perfil subida por el usuario),
 * renders the image cover-cropped inside the circle; otherwise falls back to a
 * deterministic brand color + initials.
 */
export default function Avatar({
  name,
  src,
  size = 32,
  className,
  title,
}: {
  name: string | null | undefined;
  /** URL pública de la foto de perfil; si falta, se muestran las iniciales. */
  src?: string | null;
  size?: number;
  className?: string;
  title?: string;
}) {
  if (src) {
    return (
      <span
        className={`dg-avatar ${className ?? ""}`.trim()}
        title={title}
        aria-hidden={title ? undefined : true}
        style={{ width: size, height: size }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={src}
          alt={title ?? ""}
          width={size}
          height={size}
          style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
        />
      </span>
    );
  }

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
